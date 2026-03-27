'use client';

import { useState, useMemo } from 'react';
import {
    Sparkles,
    FileText,
    Box,
    Activity,
    Video,
    Podcast,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useEnrichmentStats,
    useEnrichmentHealth,
    useMissingEnrichments,
    useTriggerEnrichment,
    useTriggerBatchEnrichment,
} from '@/hooks/use-enrichment';
import type { MissingEnrichmentsParams, MissingEnrichmentItem } from '@/types/platform/enrichment';

// ── Helpers ───────────���─────────────────────────────────────

function pct(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

// ── Page ────────────���───────────────────────────────────────

export default function EnrichmentPage() {
    const [missingFilter, setMissingFilter] = useState<string>('transcript');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [offset, setOffset] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const limit = 20;

    const params: MissingEnrichmentsParams = useMemo(
        () => ({
            missing: missingFilter || 'transcript',
            type: typeFilter || undefined,
            status: 'READY',
            limit,
            offset,
        }),
        [missingFilter, typeFilter, offset]
    );

    const { data: stats, isLoading: statsLoading } = useEnrichmentStats();
    const { data: health, isLoading: healthLoading } = useEnrichmentHealth();
    const { data: missing, isLoading: missingLoading } = useMissingEnrichments(params);
    const triggerMutation = useTriggerEnrichment();
    const batchMutation = useTriggerBatchEnrichment();

    const isServiceUp = health?.status === 'ok';
    const whisperLoaded = health?.models?.whisper ?? false;
    const embedderLoaded = health?.models?.embedder ?? false;

    const transcriptPct = stats ? pct(stats.with_transcript, stats.total_media) : 0;
    const embeddingPct = stats ? pct(stats.with_embedding, stats.total_ready) : 0;

    const items = missing?.items ?? [];
    const total = missing?.total ?? 0;
    const hasNext = offset + limit < total;
    const hasPrev = offset > 0;

    // ── Selection helpers ────────────────────────────────────

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map((i) => i.id)));
        }
    }

    function handleBatchEnrich() {
        const ids = Array.from(selectedIds).slice(0, 10);
        const types = missingFilter ? [missingFilter] : ['transcript', 'embedding'];
        batchMutation.mutate(
            { ids, types },
            { onSuccess: () => setSelectedIds(new Set()) }
        );
    }

    function handleSingleEnrich(item: MissingEnrichmentItem) {
        const types: string[] = [];
        if (!item.has_transcript && (item.type === 'VIDEO' || item.type === 'PODCAST')) {
            types.push('transcript');
        }
        if (!item.has_embedding) {
            types.push('embedding');
        }
        if (types.length > 0) {
            triggerMutation.mutate({ id: item.id, types });
        }
    }

    // ── Render ────��──────────────────────────────────────────

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
                                className={`w-2 h-2 rounded-full ${
                                    isServiceUp ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                                }`}
                            />
                            {isServiceUp ? 'Service Online' : 'Service Offline'}
                        </Badge>
                    )}
                </div>
            </div>

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
                                <div className="text-2xl font-bold">{stats?.total_media ?? 0}</div>
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
                                <div className="w-full h-2 bg-muted rounded-full mt-2">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${transcriptPct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats?.with_transcript ?? 0} / {stats?.total_media ?? 0} media items
                                    {(stats?.missing_transcript ?? 0) > 0 && (
                                        <span className="text-orange-500 ml-1">
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
                                <div className="w-full h-2 bg-muted rounded-full mt-2">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${embeddingPct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats?.with_embedding ?? 0} / {stats?.total_ready ?? 0} all READY items
                                    {(stats?.missing_embedding ?? 0) > 0 && (
                                        <span className="text-orange-500 ml-1">
                                            ({stats?.missing_embedding} missing)
                                        </span>
                                    )}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Service Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Service Status</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {healthLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Whisper</span>
                                    {whisperLoaded ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Embedder</span>
                                    {embedderLoaded ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                {health?.error && (
                                    <p className="text-xs text-destructive mt-1 truncate">
                                        {health.error}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Missing Enrichments Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Missing Enrichments</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Content items that need enrichment processing
                            </p>
                        </div>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleBatchEnrich}
                                disabled={batchMutation.isPending || !isServiceUp}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {batchMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Enrich Selected ({Math.min(selectedIds.size, 10)})
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 mt-4">
                        <select
                            value={missingFilter}
                            onChange={(e) => {
                                setMissingFilter(e.target.value);
                                setOffset(0);
                                setSelectedIds(new Set());
                            }}
                            className="px-3 py-2 text-sm border rounded-md bg-background"
                        >
                            <option value="transcript">Missing Transcript</option>
                            <option value="embedding">Missing Embedding</option>
                            <option value="transcript,embedding">Missing Any</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setOffset(0);
                                setSelectedIds(new Set());
                            }}
                            className="px-3 py-2 text-sm border rounded-md bg-background"
                        >
                            <option value="">All Types</option>
                            <option value="VIDEO">Video</option>
                            <option value="PODCAST">Podcast</option>
                            <option value="ARTICLE">Article</option>
                            <option value="TWEET">Tweet</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={items.length > 0 && selectedIds.size === items.length}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                        />
                                    </TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="w-24">Type</TableHead>
                                    <TableHead className="w-32">Source</TableHead>
                                    <TableHead className="w-40">Missing</TableHead>
                                    <TableHead className="w-28">Created</TableHead>
                                    <TableHead className="w-24 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {missingLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                            <p>All content is fully enriched!</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="rounded"
                                                />
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate font-medium">
                                                {item.title || 'Untitled'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.type === 'VIDEO' && (
                                                        <Video className="h-3 w-3 mr-1" />
                                                    )}
                                                    {item.type === 'PODCAST' && (
                                                        <Podcast className="h-3 w-3 mr-1" />
                                                    )}
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm truncate max-w-[120px]">
                                                {item.source_name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {!item.has_transcript &&
                                                        (item.type === 'VIDEO' ||
                                                            item.type === 'PODCAST') && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-[10px]"
                                                            >
                                                                Transcript
                                                            </Badge>
                                                        )}
                                                    {!item.has_embedding && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            Embedding
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDate(item.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <button
                                                    onClick={() => handleSingleEnrich(item)}
                                                    disabled={
                                                        triggerMutation.isPending || !isServiceUp
                                                    }
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50 transition-colors"
                                                >
                                                    {triggerMutation.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="h-3 w-3" />
                                                    )}
                                                    Enrich
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {total > limit && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setOffset((o) => Math.max(0, o - limit))}
                                    disabled={!hasPrev}
                                    className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setOffset((o) => o + limit)}
                                    disabled={!hasNext}
                                    className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
