'use client';

import { useEffect, useRef } from 'react';
import {
  FileText,
  Box,
  Activity,
  Video,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Newspaper,
  Loader2,
  Zap,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEnrichmentStats,
  useEnrichmentHealth,
  useBulkEnrichStatus,
  enrichmentKeys,
} from '@/hooks/use-enrichment';
import type { BulkEnrichStatus } from '@/types/platform/enrichment';
import { MissingPanel } from './missing-panel';
import { EnrichmentAutopilotStrip } from './autopilot-strip';
import { AttentionLane } from './attention-lane';

// ── Helpers ──────────────────────────────────────────────────

function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// ── Page ─────────────────────────────────────────────────────

export default function EnrichmentPage() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useEnrichmentStats();
  const { data: health, isLoading: healthLoading } = useEnrichmentHealth();
  const { data: bulk } = useBulkEnrichStatus();

  const bulkRunning = bulk?.running ?? false;

  // When a bulk run finishes, refresh stats + missing lists + counts so the
  // coverage numbers and per-artifact counts reflect the new state.
  const prevRunning = useRef(false);
  useEffect(() => {
    if (prevRunning.current && !bulkRunning) {
      queryClient.invalidateQueries({ queryKey: enrichmentKeys.all });
    }
    prevRunning.current = bulkRunning;
  }, [bulkRunning, queryClient]);

  const isServiceUp = health?.status === 'ok';

  // Per-service breakdown — populated by CMS after the Media-Service split.
  // Fall back to the legacy flat `models` map so the page still renders if
  // CMS hasn't been upgraded yet.
  const mediaService = health?.services?.media;
  const enrichmentService = health?.services?.enrichment;
  const hasPerServiceHealth = Boolean(mediaService || enrichmentService);

  const mediaModels = mediaService?.models ?? {
    whisper: health?.models?.whisper ?? false,
    clip: health?.models?.clip ?? false,
  };
  const enrichmentModels = enrichmentService?.models ?? {
    embedder: health?.models?.embedder ?? false,
    reranker: health?.models?.reranker ?? false,
  };

  const transcriptPct = stats
    ? pct(stats.with_transcript, stats.total_media)
    : 0;
  const embeddingPct = stats ? pct(stats.with_embedding, stats.total_ready) : 0;
  // Image coverage is measured against the items that *should* have it
  // (with + missing), not all READY items.
  const imageDenom =
    (stats?.with_image_embedding ?? 0) + (stats?.missing_image_embedding ?? 0);
  const imagePct = stats ? pct(stats.with_image_embedding, imageDenom) : 0;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrichment</h1>
          <p className="text-muted-foreground">
            Manage transcription, embeddings, and AI enrichment for content
          </p>
        </div>
        <div className="flex items-center gap-2">
          {healthLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <Badge
              variant={isServiceUp ? 'default' : 'destructive'}
              className="flex items-center gap-1.5"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isServiceUp ? 'animate-pulse bg-green-400' : 'bg-red-400'
                }`}
              />
              {isServiceUp ? 'Service Online' : 'Service Offline'}
            </Badge>
          )}
        </div>
      </div>

      {/* Autopilot cockpit — scheduled, guardrailed coverage supervision */}
      <EnrichmentAutopilotStrip />
      <AttentionLane />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Media */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Items</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.total_media ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  VIDEO + PODCAST content
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transcript Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{transcriptPct}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${transcriptPct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.with_transcript ?? 0} / {stats?.total_media ?? 0}{' '}
                  media items
                  {(stats?.missing_transcript ?? 0) > 0 && (
                    <span className="ml-1 text-orange-500">
                      ({stats?.missing_transcript} missing)
                    </span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Embedding Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embeddings</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{embeddingPct}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${embeddingPct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.with_embedding ?? 0} / {stats?.total_ready ?? 0} all
                  READY items
                  {(stats?.missing_embedding ?? 0) > 0 && (
                    <span className="ml-1 text-orange-500">
                      ({stats?.missing_embedding} missing)
                    </span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Image Embedding Coverage (CLIP — items with a thumbnail) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Image Embeddings
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{imagePct}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-pink-500 transition-all"
                    style={{ width: `${imagePct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.with_image_embedding ?? 0} CLIP vectors
                  {(stats?.missing_image_embedding ?? 0) > 0 && (
                    <span className="ml-1 text-orange-500">
                      ({stats?.missing_image_embedding} missing)
                    </span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Status — per-service after the Media split */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-3 text-sm">
                {/* Media-Service */}
                <div>
                  <div className="mb-1 flex items-center justify-between font-medium">
                    <span>Media</span>
                    {mediaService?.status === 'unreachable' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : Object.values(mediaModels).every(Boolean) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(mediaModels).map(([name, loaded]) => (
                      <Badge
                        key={name}
                        variant={loaded ? 'default' : 'outline'}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {name}
                        {loaded ? ' ✓' : ' ✗'}
                      </Badge>
                    ))}
                  </div>
                  {mediaService?.error && (
                    <p className="mt-1 truncate text-[11px] text-destructive">
                      {mediaService.error}
                    </p>
                  )}
                </div>

                {/* Enrichment-Service */}
                <div>
                  <div className="mb-1 flex items-center justify-between font-medium">
                    <span>Enrichment</span>
                    {enrichmentService?.status === 'unreachable' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : Object.values(enrichmentModels).every(Boolean) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(enrichmentModels).map(([name, loaded]) => (
                      <Badge
                        key={name}
                        variant={loaded ? 'default' : 'outline'}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {name}
                        {loaded ? ' ✓' : ' ✗'}
                      </Badge>
                    ))}
                  </div>
                  {enrichmentService?.error && (
                    <p className="mt-1 truncate text-[11px] text-destructive">
                      {enrichmentService.error}
                    </p>
                  )}
                </div>

                {!hasPerServiceHealth && health?.error && (
                  <p className="mt-1 truncate text-xs text-destructive">
                    {health.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live progress while a background bulk run is active */}
      {bulk && (bulk.running || bulk.done > 0) && (
        <BulkProgressBanner bulk={bulk} />
      )}

      {/* Missing Enrichments — split by content domain */}
      <div id="missing-panel">
        <MissingPanel
          title="Videos & Podcasts"
          description="Audio/video items missing a transcript or CLIP image embedding"
          icon={<Video className="h-5 w-5 text-muted-foreground" />}
          typeQuery="VIDEO,PODCAST"
          typeOptions={[
            { value: '', label: 'Video + Podcast' },
            { value: 'VIDEO', label: 'Video' },
            { value: 'PODCAST', label: 'Podcast' },
          ]}
          artifacts={[
            {
              value: 'transcript',
              label: 'Transcript',
              badgeVariant: 'destructive',
            },
            { value: 'image', label: 'Image', badgeVariant: 'secondary' },
          ]}
          isServiceUp={isServiceUp}
          bulkRunning={bulkRunning}
        />
      </div>

      <MissingPanel
        title="News & Articles"
        description="News items missing a dense embedding (Qwen)"
        icon={<Newspaper className="h-5 w-5 text-muted-foreground" />}
        typeQuery="NEWS"
        typeOptions={[{ value: '', label: 'News' }]}
        artifacts={[
          { value: 'embedding', label: 'Embedding', badgeVariant: 'secondary' },
        ]}
        isServiceUp={isServiceUp}
        bulkRunning={bulkRunning}
      />
    </div>
  );
}

// ── Bulk run progress banner ─────────────────────────────────

function BulkProgressBanner({ bulk }: { bulk: BulkEnrichStatus }) {
  const progress =
    bulk.total > 0 ? Math.round((bulk.done / bulk.total) * 100) : 0;
  const finished = !bulk.running;

  return (
    <Card className={finished ? 'border-green-500/40' : 'border-primary/40'}>
      <CardContent className="py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            {bulk.running ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Zap className="h-4 w-4 text-green-500" />
            )}
            {bulk.running ? 'Enriching' : 'Enrichment run complete'}
            <span className="font-normal text-muted-foreground">
              {bulk.types.join(', ')}
              {bulk.content_type ? ` · ${bulk.content_type}` : ''}
            </span>
          </div>
          <div className="text-sm tabular-nums">
            <span className="font-semibold">{bulk.done}</span>
            <span className="text-muted-foreground"> / {bulk.total}</span>
            {bulk.failed > 0 && (
              <span className="ml-2 text-orange-500">{bulk.failed} failed</span>
            )}
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              finished ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {bulk.failed > 0 && bulk.last_error && (
          <p className="mt-2 truncate text-xs text-orange-500">
            Last error: {bulk.last_error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
