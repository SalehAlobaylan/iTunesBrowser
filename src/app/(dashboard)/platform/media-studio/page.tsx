'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clapperboard,
    Clock3,
    HardDrive,
    Loader2,
    Mic,
    RefreshCw,
    Search,
    Video,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContent, useMediaSizeStats } from '@/hooks/use-content';
import { useRepairTranscriptionSweep, useTranscriptionBatches, useTranscriptionJobs } from '@/hooks/use-transcription';
import {
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
    type ContentItem,
    type ContentType,
    type TranscriptQualityStatus,
    type TranscriptionJobSummary,
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

const MB = 1024 * 1024;
const LARGE_MEDIA_BYTES = 500 * MB;
const MEDIA_TYPES_FILTER = 'in:VIDEO,PODCAST';

function formatBytes(bytes?: number, emptyLabel = 'Untracked'): string {
    if (!bytes || bytes <= 0) return emptyLabel;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    const precision = value >= 10 || unit === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unit]}`;
}

function formatDateShort(value?: string): string {
    if (!value) return 'No timestamp';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No timestamp';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatUsd(value?: number): string {
    if (!value || value <= 0) return '$0.00';
    return `$${value.toFixed(2)}`;
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
                    <span>{formatBytes(item.file_size_bytes)}</span>
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

function StudioJobRow({ job }: { job: TranscriptionJobSummary }) {
    const reason = job.error_message || job.writeback_error || job.skip_reason;
    const cost = job.actual_cost_usd > 0
        ? formatUsd(job.actual_cost_usd)
        : job.reserved_cost_usd > 0
            ? `${formatUsd(job.reserved_cost_usd)} reserved`
            : formatUsd(job.estimated_cost_usd);
    return (
        <Link
            href={`/platform/media-studio/${job.content_item_id}`}
            className="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                <Clapperboard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{job.content_title || job.content_item_id}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {job.content_type && <Badge variant="outline">{job.content_type}</Badge>}
                    <Badge variant={JOB_STATUS_VARIANTS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                    <span>{formatBytes(job.file_size_bytes)}</span>
                    {job.storage_tier && <span>{job.storage_tier}</span>}
                    {job.provider && <span>{job.provider}</span>}
                    <span>{cost}</span>
                    <span>{formatDateShort(job.completed_at || job.started_at || job.created_at)}</span>
                </div>
                {job.writeback_status && (
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        Writeback: {job.writeback_status}
                    </div>
                )}
                {reason && <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{reason}</div>}
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

    const activeBatches = useTranscriptionBatches({ status: 'active', limit: 5 });
    const recentBatches = useTranscriptionBatches({ status: 'terminal', limit: 5 });
    const queuedJobs = useTranscriptionJobs({ status: 'queued', limit: 12 });
    const runningJobs = useTranscriptionJobs({ status: 'running', limit: 12 });
    const failedJobs = useTranscriptionJobs({ status: 'failed', limit: 12 });
    const writebackFailedJobs = useTranscriptionJobs({ status: 'writeback_failed', limit: 12 });
    const recentSucceededJobs = useTranscriptionJobs({ status: 'succeeded', limit: 8 });
    const repairSweep = useRepairTranscriptionSweep();
    // Count-only queries for the stat tiles: the jobs list is page-limited, so
    // its array length under-reports the true backlog. useContent returns total.
    const queuedCount = useContent({ page: 1, limit: 1, transcription_status: 'queued' });
    const runningCount = useContent({ page: 1, limit: 1, transcription_status: 'running' });
    const failedCount = useContent({ page: 1, limit: 1, transcription_status: 'failed' });
    const writebackFailedCount = useContent({ page: 1, limit: 1, transcription_status: 'writeback_failed' });
    const needsReview = useContent({ page: 1, limit: 6, quality_status: 'needs_review', sort: 'updated_at', order: 'desc' });
    const autoRepair = useContent({ page: 1, limit: 6, quality_status: 'auto_repair', sort: 'updated_at', order: 'desc' });
    const sizeStats = useMediaSizeStats({});
    const untrackedSize = useContent({ page: 1, limit: 5, type: MEDIA_TYPES_FILTER, size_tracked: 'untracked', sort: 'updated_at', order: 'desc' });
    const largeFailed = useContent({ page: 1, limit: 5, type: MEDIA_TYPES_FILTER, min_size_bytes: LARGE_MEDIA_BYTES, transcription_status: 'failed', sort: 'file_size_bytes', order: 'desc' });
    const largeWritebackFailed = useContent({ page: 1, limit: 5, type: MEDIA_TYPES_FILTER, min_size_bytes: LARGE_MEDIA_BYTES, transcription_status: 'writeback_failed', sort: 'file_size_bytes', order: 'desc' });
    const largeNeedsReview = useContent({ page: 1, limit: 5, type: MEDIA_TYPES_FILTER, min_size_bytes: LARGE_MEDIA_BYTES, quality_status: 'needs_review', sort: 'file_size_bytes', order: 'desc' });
    const largeAutoRepair = useContent({ page: 1, limit: 5, type: MEDIA_TYPES_FILTER, min_size_bytes: LARGE_MEDIA_BYTES, quality_status: 'auto_repair', sort: 'file_size_bytes', order: 'desc' });
    const searchResults = useContent({
        page: 1,
        limit: 8,
        type,
        search: search || undefined,
        sort: 'updated_at',
        order: 'desc',
    });

    const queueItems = useMemo(() => {
        const byId = new Map<string, TranscriptionJobSummary>();
        for (const job of [
            ...(runningJobs.data ?? []),
            ...(queuedJobs.data ?? []),
            ...(writebackFailedJobs.data ?? []),
            ...(failedJobs.data ?? []),
        ]) {
            byId.set(job.id, job);
        }
        return Array.from(byId.values())
            .sort((a, b) => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0))
            .slice(0, 12);
    }, [failedJobs.data, queuedJobs.data, runningJobs.data, writebackFailedJobs.data]);

    const loadingQueue = queuedJobs.isLoading || runningJobs.isLoading || failedJobs.isLoading || writebackFailedJobs.isLoading;
    const largeFailureItems = useMemo(() => {
        const byId = new Map<string, ContentItem>();
        for (const item of [
            ...(largeFailed.data?.data ?? []),
            ...(largeWritebackFailed.data?.data ?? []),
        ]) {
            byId.set(item.id, item);
        }
        return Array.from(byId.values()).sort((a, b) => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0)).slice(0, 5);
    }, [largeFailed.data?.data, largeWritebackFailed.data?.data]);
    const largeReviewItems = useMemo(() => {
        const byId = new Map<string, ContentItem>();
        for (const item of [
            ...(largeNeedsReview.data?.data ?? []),
            ...(largeAutoRepair.data?.data ?? []),
        ]) {
            byId.set(item.id, item);
        }
        return Array.from(byId.values()).sort((a, b) => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0)).slice(0, 5);
    }, [largeAutoRepair.data?.data, largeNeedsReview.data?.data]);

    const stats = [
        {
            label: 'Active jobs',
            value: (queuedCount.data?.total ?? 0) + (runningCount.data?.total ?? 0),
            icon: <Clock3 className="h-4 w-4" />,
            tone: 'text-info',
        },
        {
            label: 'Failures',
            value: (failedCount.data?.total ?? 0) + (writebackFailedCount.data?.total ?? 0),
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

            <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Active Batches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {activeBatches.isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : (activeBatches.data?.data ?? []).length > 0 ? (
                            activeBatches.data!.data.map((batch) => (
                                <div key={batch.id} className="rounded-md border px-3 py-2 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{batch.status}</Badge>
                                        <span className="font-medium">{batch.total_count} items</span>
                                        <span className="text-muted-foreground">
                                            {batch.accepted_count} accepted · {batch.completed_count} done · {batch.failed_count} failed · {batch.canceled_count} canceled
                                        </span>
                                    </div>
                                    {batch.latest_error && <div className="mt-1 line-clamp-1 text-xs text-destructive">{batch.latest_error}</div>}
                                    {(batch.items ?? []).length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {batch.items!.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Badge variant="outline">{item.status}</Badge>
                                                    <span className="truncate">{item.job?.content_title || item.content_item_id}</span>
                                                    {item.job && <span>{formatBytes(item.job.file_size_bytes)}</span>}
                                                    {item.job?.provider && <span>{item.job.provider}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <EmptyState label="No active transcription batches." />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">Repair Automation</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => repairSweep.mutate(100)} disabled={repairSweep.isPending}>
                                {repairSweep.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                                Scan weak transcripts
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {repairSweep.data ? (
                            <div className="rounded-md border px-3 py-2 text-sm">
                                <div className="font-medium">
                                    {repairSweep.data.accepted} queued · {repairSweep.data.skipped} skipped · {repairSweep.data.failed} failed
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {Object.entries(repairSweep.data.reasons).slice(0, 6).map(([reason, count]) => (
                                        <Badge key={reason} variant="outline">{count} {reason}</Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Run a manual scan to queue eligible weak or missing transcripts within the CMS budget." />
                        )}
                        {(recentBatches.data?.data ?? []).slice(0, 2).map((batch) => (
                            <div key={batch.id} className="text-xs text-muted-foreground">
                                Recent batch: {batch.status} · {batch.completed_count} done · {formatDateShort(batch.completed_at || batch.updated_at)}
                            </div>
                        ))}
                    </CardContent>
                </Card>
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
                            queueItems.map((job) => <StudioJobRow key={job.id} job={job} />)
                        ) : (
                            <EmptyState label="No queued, running, failed, or writeback-failed transcription jobs." />
                        )}
                        {(recentSucceededJobs.data ?? []).length > 0 && (
                            <div className="pt-2">
                                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Recent completions</div>
                                <div className="space-y-2">
                                    {recentSucceededJobs.data!.slice(0, 3).map((job) => <StudioJobRow key={job.id} job={job} />)}
                                </div>
                            </div>
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

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HardDrive className="h-4 w-4" />
                            Size Bottlenecks
                        </CardTitle>
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/platform/storage?tab=candidates">Storage candidates</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                            <div className="text-lg font-semibold tabular-nums">
                                {sizeStats.isLoading ? 'Loading...' : formatBytes(sizeStats.data?.total_bytes, '0 B')}
                            </div>
                            <div className="text-xs text-muted-foreground">Tracked media size</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-lg font-semibold tabular-nums">
                                {sizeStats.isLoading ? 'Loading...' : formatBytes(sizeStats.data?.max_bytes, '0 B')}
                            </div>
                            <div className="text-xs text-muted-foreground">Largest media item</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-lg font-semibold tabular-nums">
                                {sizeStats.isLoading ? 'Loading...' : sizeStats.data?.untracked_count ?? 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Untracked size items</div>
                        </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Largest media</h3>
                            {sizeStats.isLoading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (sizeStats.data?.largest_items ?? []).length > 0 ? (
                                sizeStats.data!.largest_items.slice(0, 5).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/platform/media-studio/${item.id}`}
                                        className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                                    >
                                        <div className="truncate font-medium">{item.title || '(untitled)'}</div>
                                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span>{item.type}</span>
                                            <span>{formatBytes(item.file_size_bytes)}</span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <EmptyState label="No tracked media sizes yet." />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Untracked size</h3>
                            {untrackedSize.isLoading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (untrackedSize.data?.data ?? []).length > 0 ? (
                                untrackedSize.data!.data.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                            ) : (
                                <EmptyState label="No untracked media size items." />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Large failures</h3>
                            {largeFailed.isLoading || largeWritebackFailed.isLoading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : largeFailureItems.length > 0 ? (
                                largeFailureItems.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                            ) : (
                                <EmptyState label="No large failed transcription jobs." />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Large review work</h3>
                            {largeNeedsReview.isLoading || largeAutoRepair.isLoading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : largeReviewItems.length > 0 ? (
                                largeReviewItems.map((item) => <StudioItemRow key={item.id} item={item} compact />)
                            ) : (
                                <EmptyState label="No large review or auto-repair items." />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
