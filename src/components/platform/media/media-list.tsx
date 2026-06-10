'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Loader2, Sparkles, Search, MoreHorizontal, SlidersHorizontal, RefreshCw,
    Clapperboard, Trash2, Copy, ExternalLink, ArrowUpDown, Rss, Layers, ChevronRight, ChevronDown,
} from 'lucide-react';

import {
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useContent, useDeleteContentByIds } from '@/hooks/use-content';
import { useBulkTriggerStt, useTriggerStt } from '@/hooks/use-transcription';
import { listSourceNames } from '@/lib/api/cms/content';
import {
    CAPTION_STATE_LABELS, CAPTION_STATE_VARIANTS, CONTENT_STATUS_LABELS, CONTENT_STATUS_VARIANTS,
    type CaptionState, type ContentItem, type ContentStatus, type ContentType,
    type TranscriptQualityStatus, type TranscriptionJobStatus, type TranscriptQualitySummary,
    type TranscriptionJobSummary,
} from '@/types/platform/content';

function formatDuration(sec?: number): string {
    if (!sec || sec <= 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

function captionStateOf(item: ContentItem): CaptionState {
    if (item.caption_state) return item.caption_state;
    return item.has_transcript ? 'stt_done' : 'none';
}

const UNKNOWN_SOURCE = 'Unknown source';
const STATUS_OPTIONS: (ContentStatus | 'all')[] = ['all', 'READY', 'PROCESSING', 'FAILED', 'PENDING'];
const CAPTION_FILTERS: { value: CaptionState | 'all'; label: string }[] = [
    { value: 'all', label: 'All transcripts' },
    { value: 'youtube_auto', label: '⚠️ Needs enrichment' },
    { value: 'youtube_human', label: 'Human caption' },
    { value: 'stt_done', label: 'STT transcript' },
];
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest', sort: 'published_at', order: 'desc' as const },
    { value: 'oldest', label: 'Oldest', sort: 'published_at', order: 'asc' as const },
    { value: 'longest', label: 'Longest', sort: 'duration_sec', order: 'desc' as const },
    { value: 'shortest', label: 'Shortest', sort: 'duration_sec', order: 'asc' as const },
    { value: 'title', label: 'Title A–Z', sort: 'title', order: 'asc' as const },
];
type JobFilterValue = TranscriptionJobStatus | 'auto_repair_queued' | 'all';

const JOB_FILTERS: { value: JobFilterValue; label: string }[] = [
    { value: 'all', label: 'All jobs' },
    { value: 'auto_repair_queued', label: 'Auto repair queued' },
    { value: 'queued', label: 'Queued' },
    { value: 'running', label: 'Running' },
    { value: 'failed', label: 'Failed' },
    { value: 'writeback_failed', label: 'Writeback failed' },
];
const QUALITY_FILTERS: { value: TranscriptQualityStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All quality' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'auto_repair', label: 'Auto repair' },
    { value: 'ok', label: 'OK' },
];
const JOB_STATUS_LABELS: Record<TranscriptionJobStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    skipped: 'Skipped',
    succeeded: 'Succeeded',
    failed: 'Failed',
    writeback_failed: 'Writeback failed',
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
};
const QUALITY_STATUS_LABELS: Record<TranscriptQualityStatus, string> = {
    ok: 'OK',
    needs_review: 'Needs review',
    auto_repair: 'Auto repair',
};
const QUALITY_STATUS_VARIANTS: Record<
    TranscriptQualityStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'
> = {
    ok: 'success',
    needs_review: 'warning',
    auto_repair: 'destructive',
};

function formatUsd(value?: number): string {
    if (!value || value <= 0) return '$0.00';
    return `$${value.toFixed(2)}`;
}

function formatDateShort(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderQualitySummary(quality?: TranscriptQualitySummary) {
    if (!quality) return <span className="text-xs text-muted-foreground">Not scored</span>;
    const issueLabel = quality.issue_codes.length
        ? `${quality.issue_codes.length} issue${quality.issue_codes.length === 1 ? '' : 's'}`
        : 'No issues';
    return (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={QUALITY_STATUS_VARIANTS[quality.status]}>
                {QUALITY_STATUS_LABELS[quality.status]} · {Math.round(quality.score * 100)}%
            </Badge>
            <span className="text-xs text-muted-foreground">{issueLabel}</span>
        </div>
    );
}

function renderJobSummary(job?: TranscriptionJobSummary) {
    if (!job) return <span className="text-xs text-muted-foreground">No jobs yet</span>;
    const reason = job.error_message || job.skip_reason;
    const cost = job.actual_cost_usd > 0
        ? formatUsd(job.actual_cost_usd)
        : job.reserved_cost_usd > 0
            ? `${formatUsd(job.reserved_cost_usd)} reserved`
            : formatUsd(job.estimated_cost_usd);
    return (
        <div className="space-y-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={JOB_STATUS_VARIANTS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                {job.provider && <span className="text-muted-foreground">{job.provider}</span>}
            </div>
            <div className="text-muted-foreground">
                {formatDateShort(job.completed_at || job.started_at || job.created_at)} · {cost}
            </div>
            {reason && <div className="line-clamp-2 max-w-44 text-muted-foreground" title={reason}>{reason}</div>}
        </div>
    );
}

export function MediaList({ type }: { type: ContentType }) {
    const router = useRouter();

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<ContentStatus | 'all'>('all');
    const [captionFilter, setCaptionFilter] = useState<CaptionState | 'all'>('all');
    const [jobFilter, setJobFilter] = useState<JobFilterValue>('all');
    const [qualityFilter, setQualityFilter] = useState<TranscriptQualityStatus | 'all'>('all');
    const [source, setSource] = useState<string>('all');
    const [sortValue, setSortValue] = useState('newest');
    const [groupBy, setGroupBy] = useState(true);
    const [sourceNames, setSourceNames] = useState<string[]>([]);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [sttConfirm, setSttConfirm] = useState<ContentItem[] | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ContentItem[] | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    const triggerStt = useTriggerStt();
    const bulkTriggerStt = useBulkTriggerStt();
    const deleteByIds = useDeleteContentByIds();

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [type, search, status, captionFilter, jobFilter, qualityFilter, source, sortValue, groupBy]);

    useEffect(() => {
        listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
    }, []);

    const sortOpt = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];
    // When grouping, sort by source first so same-source items cluster, then by
    // the chosen within-group order (multi-sort: the CMS parser pairs them).
    const sortParam = groupBy ? `source_name,${sortOpt.sort}` : sortOpt.sort;
    const orderParam = groupBy ? `asc,${sortOpt.order}` : sortOpt.order;

    const { data, isLoading } = useContent(
        {
            type,
            page,
            limit: groupBy ? 50 : 20,
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            caption_state: captionFilter === 'all' ? undefined : captionFilter,
            transcription_status: jobFilter === 'all'
                ? undefined
                : jobFilter === 'auto_repair_queued'
                    ? 'queued'
                    : jobFilter,
            transcription_trigger: jobFilter === 'auto_repair_queued' ? 'auto_quality' : undefined,
            quality_status: qualityFilter === 'all' ? undefined : qualityFilter,
            source_name: source === 'all' ? undefined : source,
            sort: sortParam,
            order: orderParam,
        },
        { paused: bulkBusy }
    );

    const items = useMemo(() => data?.data ?? [], [data?.data]);
    const total = data?.total ?? 0;
    const totalPages = data?.total_pages ?? 1;

    // Ordered groups (items already arrive clustered by source from the sort).
    const groups = useMemo(() => {
        const map = new Map<string, ContentItem[]>();
        for (const it of items) {
            const key = it.source_name || UNKNOWN_SOURCE;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(it);
        }
        return Array.from(map.entries());
    }, [items]);

    const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
    const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

    const setMany = (ids: string[], on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
            return next;
        });
    const toggleAll = () => setMany(items.map((i) => i.id), !allSelected);
    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    const toggleCollapse = (src: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(src)) next.delete(src);
            else next.add(src);
            return next;
        });

    const runStt = async (targets: ContentItem[]) => {
        setSttConfirm(null);
        if (targets.length === 1) {
            triggerStt.mutate(targets[0].id);
            return;
        }
        setBulkBusy(true);
        await bulkTriggerStt.mutateAsync(targets.map((t) => t.id)).catch(() => undefined);
        setBulkBusy(false);
        setSelected(new Set());
    };

    const runDelete = (targets: ContentItem[]) => {
        setDeleteConfirm(null);
        deleteByIds.mutate(targets.map((t) => t.id));
        setSelected(new Set());
    };

    const copyId = (id: string) => {
        navigator.clipboard?.writeText(id);
        toast({ title: 'ID copied', variant: 'success' });
    };

    const colSpan = 7;

    const renderRow = (item: ContentItem) => {
        const state = captionStateOf(item);
        const hasMedia = !!item.media_url;
        const isReT = state === 'stt_done' || state === 'youtube_human';
        return (
            <TableRow key={item.id}>
                <TableCell>
                    <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleOne(item.id)}
                        aria-label="Select row"
                    />
                </TableCell>
                <TableCell className="max-w-0">
                    <div className="flex items-center gap-3">
                        <Link href={`/platform/media/${item.id}`} className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                            {item.thumbnail_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                                <Clapperboard className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                            )}
                        </Link>
                        <div className="min-w-0">
                            <Link href={`/platform/media/${item.id}`} className="block truncate font-medium hover:underline" title={item.title}>
                                {item.title || '(untitled)'}
                            </Link>
                            {item.source_name && !groupBy && (
                                <span className="block truncate text-xs text-muted-foreground">{item.source_name}</span>
                            )}
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={CONTENT_STATUS_VARIANTS[item.status]}>{CONTENT_STATUS_LABELS[item.status]}</Badge>
                </TableCell>
                <TableCell className="tabular-nums text-sm">{formatDuration(item.duration_sec)}</TableCell>
                <TableCell>
                    <div className="space-y-1">
                        <Badge variant={CAPTION_STATE_VARIANTS[state]}>
                            {state === 'youtube_auto' && '⚠️ '}
                            {CAPTION_STATE_LABELS[state]}
                        </Badge>
                        {renderQualitySummary(item.transcript_quality)}
                    </div>
                </TableCell>
                <TableCell>
                    {renderJobSummary(item.latest_transcription_job)}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => router.push(`/platform/media/${item.id}`)}>
                                <Clapperboard className="mr-2 h-4 w-4" /> Open in Studio
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!hasMedia} onClick={() => setSttConfirm([item])}>
                                {isReT ? <RefreshCw className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isReT ? 'Re-transcribe with STT' : 'Enrich with STT'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyId(item.id)}>
                                <Copy className="mr-2 h-4 w-4" /> Copy ID
                            </DropdownMenuItem>
                            {item.original_url && (
                                <DropdownMenuItem asChild>
                                    <a href={item.original_url} target="_blank" rel="noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" /> Open original
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirm([item])}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <div className="space-y-3">
            {/* Filter / search bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search title…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-8" />
                </div>
                <Button
                    size="sm"
                    variant={groupBy ? 'secondary' : 'outline'}
                    onClick={() => setGroupBy((g) => !g)}
                    title="Group items by their source"
                >
                    <Layers className="mr-1.5 h-3.5 w-3.5" /> Group by source
                </Button>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus | 'all')}>
                    <SelectTrigger className="w-[140px]">
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : CONTENT_STATUS_LABELS[s]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={captionFilter} onValueChange={(v) => setCaptionFilter(v as CaptionState | 'all')}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {CAPTION_FILTERS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                <Select value={qualityFilter} onValueChange={(v) => setQualityFilter(v as TranscriptQualityStatus | 'all')}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {QUALITY_FILTERS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                <Select value={jobFilter} onValueChange={(v) => setJobFilter(v as JobFilterValue)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {JOB_FILTERS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                {sourceNames.length > 0 && (
                    <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="w-[170px]">
                            <Rss className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All sources</SelectItem>
                            {sourceNames.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                    </Select>
                )}
                <Select value={sortValue} onValueChange={setSortValue}>
                    <SelectTrigger className="w-[140px]">
                        <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>

            {/* Bulk action bar OR result count */}
            {selected.size > 0 ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-medium">{selected.size} selected</span>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => setSttConfirm(selectedItems.filter((i) => i.media_url))}>
                        {bulkBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                        Re-transcribe
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" disabled={bulkBusy} onClick={() => setDeleteConfirm(selectedItems)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">
                    {isLoading ? 'Loading…' : `${total} ${type.toLowerCase()} item${total === 1 ? '' : 's'}${groupBy ? ` · ${groups.length} source${groups.length === 1 ? '' : 's'} on this page` : ''}`}
                </p>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                            </TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead className="w-20">Length</TableHead>
                            <TableHead className="w-56">Transcript</TableHead>
                            <TableHead className="w-56">Latest job</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
                                    No matching {type.toLowerCase()} items.
                                </TableCell>
                            </TableRow>
                        ) : groupBy ? (
                            groups.map(([src, gItems]) => {
                                const groupIds = gItems.map((i) => i.id);
                                const groupAllSelected = groupIds.every((id) => selected.has(id));
                                const isCollapsed = collapsed.has(src);
                                return (
                                    <Fragment key={src}>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableCell>
                                                <Checkbox
                                                    checked={groupAllSelected}
                                                    onCheckedChange={() => setMany(groupIds, !groupAllSelected)}
                                                    aria-label="Select source"
                                                />
                                            </TableCell>
                                            <TableCell colSpan={colSpan - 1}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCollapse(src)}
                                                    className="flex items-center gap-1.5 text-sm font-semibold"
                                                >
                                                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    <Rss className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {src}
                                                    <Badge variant="secondary" className="ml-1">{gItems.length}</Badge>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                        {!isCollapsed && gItems.map(renderRow)}
                                    </Fragment>
                                );
                            })
                        ) : (
                            items.map(renderRow)
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
            )}

            {/* STT confirm (single or bulk) */}
            <Dialog open={!!sttConfirm} onOpenChange={(o) => !o && setSttConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{(sttConfirm?.length ?? 0) > 1 ? `Re-transcribe ${sttConfirm?.length} items?` : 'Transcribe with STT?'}</DialogTitle>
                        <DialogDescription>
                            Runs the configured STT engine{(sttConfirm?.length ?? 0) > 1 ? ' on the selected items' : ` on “${sttConfirm?.[0]?.title || 'this item'}”`},
                            replacing any existing transcript and re-running embeddings. The monthly budget cap still applies.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSttConfirm(null)}>Cancel</Button>
                        <Button onClick={() => sttConfirm && runStt(sttConfirm)} disabled={triggerStt.isPending || bulkBusy}>
                            {(triggerStt.isPending || bulkBusy) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {(sttConfirm?.length ?? 0) > 1 ? 'Re-transcribe all' : 'Transcribe'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm (single or bulk) */}
            <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {deleteConfirm?.length === 1 ? 'this item' : `${deleteConfirm?.length} items`}?</DialogTitle>
                        <DialogDescription>
                            This permanently removes the content {deleteConfirm?.length === 1 ? 'item' : 'items'} and {deleteConfirm?.length === 1 ? 'its' : 'their'} transcript/chapters. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && runDelete(deleteConfirm)} disabled={deleteByIds.isPending}>
                            {deleteByIds.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
