'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clapperboard,
    Clock3,
    Loader2,
    Mic,
    Search,
    Video,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContent } from '@/hooks/use-content';
import {
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
    type ContentItem,
    type ContentType,
    type TranscriptQualityStatus,
    type TranscriptionJobStatus,
} from '@/types/platform/content';

const JOB_STATUS_LABELS: Record<TranscriptionJobStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    skipped: 'Skipped',
    succeeded: 'Succeeded',
    failed: 'Failed',
    writeback_failed: 'Writeback failed',
    canceled: 'Canceled',
};

const JOB_STATUS_VARIANTS: Record<
    TranscriptionJobStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'
> = {
    queued: 'secondary',
    running: 'info',
    skipped: 'outline',
    succeeded: 'success',
    failed: 'destructive',
    writeback_failed: 'destructive',
    canceled: 'outline',
};

const QUALITY_STATUS_LABELS: Record<TranscriptQualityStatus, string> = {
    ok: 'OK',
    needs_review: 'Needs review',
    auto_repair: 'Auto repair',
};

function formatDateShort(value?: string): string {
    if (!value) return 'No timestamp';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No timestamp';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function jobTime(item: ContentItem): string {
    const job = item.latest_transcription_job;
    return formatDateShort(job?.completed_at || job?.started_at || job?.created_at || item.updated_at);
}

function jobReason(item: ContentItem): string | undefined {
    const job = item.latest_transcription_job;
    return job?.error_message || job?.writeback_error || job?.skip_reason;
}

function StudioItemRow({ item, compact = false }: { item: ContentItem; compact?: boolean }) {
    const job = item.latest_transcription_job;
    const quality = item.transcript_quality;
    const reason = jobReason(item);

    return (
        <Link
            href={`/platform/media-studio/${item.id}`}
            className="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
        >
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <Clapperboard className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.title || '(untitled)'}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={CONTENT_STATUS_VARIANTS[item.status]}>{CONTENT_STATUS_LABELS[item.status]}</Badge>
                    {job && <Badge variant={JOB_STATUS_VARIANTS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>}
                    {quality && <Badge variant={quality.status === 'ok' ? 'success' : quality.status === 'needs_review' ? 'warning' : 'destructive'}>{QUALITY_STATUS_LABELS[quality.status]}</Badge>}
                    {!compact && <span>{jobTime(item)}</span>}
                </div>
                {reason && !compact && (
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{reason}</div>
                )}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {label}
        </div>
    );
}

export default function MediaStudioPage() {
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [type, setType] = useState<ContentType>('VIDEO');

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 250);
        return () => clearTimeout(t);
    }, [searchInput]);

    const queued = useContent({ page: 1, limit: 6, transcription_status: 'queued', sort: 'updated_at', order: 'desc' });
    const running = useContent({ page: 1, limit: 6, transcription_status: 'running', sort: 'updated_at', order: 'desc' });
    const failed = useContent({ page: 1, limit: 6, transcription_status: 'failed', sort: 'updated_at', order: 'desc' });
    const writebackFailed = useContent({ page: 1, limit: 6, transcription_status: 'writeback_failed', sort: 'updated_at', order: 'desc' });
    const needsReview = useContent({ page: 1, limit: 6, quality_status: 'needs_review', sort: 'updated_at', order: 'desc' });
    const autoRepair = useContent({ page: 1, limit: 6, quality_status: 'auto_repair', sort: 'updated_at', order: 'desc' });
    const searchResults = useContent({
        page: 1,
        limit: 8,
        type,
        search: search || undefined,
        sort: 'updated_at',
        order: 'desc',
    });

    const queueItems = useMemo(() => {
        const byId = new Map<string, ContentItem>();
        for (const item of [
            ...(running.data?.data ?? []),
            ...(queued.data?.data ?? []),
            ...(writebackFailed.data?.data ?? []),
            ...(failed.data?.data ?? []),
        ]) {
            byId.set(item.id, item);
        }
        return Array.from(byId.values()).slice(0, 10);
    }, [failed.data?.data, queued.data?.data, running.data?.data, writebackFailed.data?.data]);

    const loadingQueue = queued.isLoading || running.isLoading || failed.isLoading || writebackFailed.isLoading;

    const stats = [
        {
            label: 'Active jobs',
            value: (queued.data?.total ?? 0) + (running.data?.total ?? 0),
            icon: <Clock3 className="h-4 w-4" />,
            tone: 'text-info',
        },
        {
            label: 'Failures',
            value: (failed.data?.total ?? 0) + (writebackFailed.data?.total ?? 0),
            icon: <XCircle className="h-4 w-4" />,
            tone: 'text-destructive',
        },
        {
            label: 'Needs review',
            value: needsReview.data?.total ?? 0,
            icon: <AlertTriangle className="h-4 w-4" />,
            tone: 'text-warning',
        },
        {
            label: 'Auto repair',
            value: autoRepair.data?.total ?? 0,
            icon: <CheckCircle2 className="h-4 w-4" />,
            tone: 'text-success',
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Media Studio</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor transcription work and open media items for transcript, chapter, and quality review.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/platform/media">
                        <Video className="mr-1.5 h-4 w-4" />
                        Media Library
                    </Link>
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <div className="text-2xl font-semibold tabular-nums">{stat.value}</div>
                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                            </div>
                            <div className={stat.tone}>{stat.icon}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Transcription Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {loadingQueue ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : queueItems.length > 0 ? (
                            queueItems.map((item) => <StudioItemRow key={item.id} item={item} />)
                        ) : (
                            <EmptyState label="No queued, running, failed, or writeback-failed transcription jobs." />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Open Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant={type === 'VIDEO' ? 'default' : 'outline'} onClick={() => setType('VIDEO')}>
                                <Video className="mr-1.5 h-3.5 w-3.5" />
                                Video
                            </Button>
                            <Button size="sm" variant={type === 'PODCAST' ? 'default' : 'outline'} onClick={() => setType('PODCAST')}>
                                <Mic className="mr-1.5 h-3.5 w-3.5" />
                                Podcast
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search media title"
                                className="pl-8"
                            />
                        </div>
                        <div className="space-y-2">
                            {searchResults.isLoading ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : (searchResults.data?.data ?? []).length > 0 ? (
                                searchResults.data!.data.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                            ) : (
                                <EmptyState label="No matching media items." />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Needs Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {needsReview.isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : (needsReview.data?.data ?? []).length > 0 ? (
                            needsReview.data!.data.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                        ) : (
                            <EmptyState label="No transcripts currently need review." />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Auto Repair</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {autoRepair.isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : (autoRepair.data?.data ?? []).length > 0 ? (
                            autoRepair.data!.data.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                        ) : (
                            <EmptyState label="No transcripts are marked for auto repair." />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
