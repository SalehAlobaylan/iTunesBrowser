'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Database,
    FileText,
    MessageSquare,
    Mic,
    Newspaper,
    RefreshCw,
    Search,
    Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import {
    useContent,
    useStatusCounts,
    useUpdateContentStatus,
    useDeleteContentByIds,
} from '@/hooks/use-content';
import { useBulkAction } from '@/hooks/use-bulk-action';
import { listSourceNames } from '@/lib/api/cms/content';
import {
    triggerBatchEnrichment,
    ENRICHMENT_BATCH_LIMIT,
} from '@/lib/api/cms/enrichment';
import {
    CONTENT_TYPE_LABELS,
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
} from '@/types/platform/content';
import type {
    ContentItem,
    ContentStatus,
    ContentType,
} from '@/types/platform/content';

import { useContentListQueryState } from '@/components/platform/content/list/use-content-list-query-state';
import { StatusCountsStrip } from '@/components/platform/content/list/status-counts-strip';
import { ContentTable } from '@/components/platform/content/list/content-table';
import { ContentBulkActionBar } from '@/components/platform/content/list/content-bulk-action-bar';
import { BulkSetStatusDialog } from '@/components/platform/content/list/bulk-set-status-dialog';
import { BulkReEnrichDialog } from '@/components/platform/content/list/bulk-reenrich-dialog';
import { ToolsMenu } from '@/components/platform/content/list/tools-menu';

const PAGE_LIMIT = 10;

export default function ContentPage() {
    const { state, setState, toggleSort } = useContentListQueryState();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkReEnrichOpen, setBulkReEnrichOpen] = useState(false);
    const [sourceNames, setSourceNames] = useState<string[]>([]);

    const bulkStatus = useBulkAction({ mode: 'sequential' });
    const bulkEnrich = useBulkAction({ mode: 'sequential' });
    const updateStatus = useUpdateContentStatus();
    const deleteByIds = useDeleteContentByIds();

    const bulkBusy =
        bulkStatus.running ||
        bulkEnrich.running ||
        deleteByIds.isPending;

    const { data, isLoading, error, refetch } = useContent(
        {
            page: state.page,
            limit: PAGE_LIMIT,
            search: state.search || undefined,
            status: state.status === 'all' ? undefined : (state.status as ContentStatus),
            type: state.type === 'all' ? undefined : (state.type as ContentType),
            source_name: state.sourceName || undefined,
        },
        { paused: bulkBusy }
    );

    const counts = useStatusCounts({ paused: bulkBusy });
    const newsSummary = useContent({ page: 1, limit: 1, type: 'NEWS' }, { paused: bulkBusy });
    const articleSummary = useContent({ page: 1, limit: 1, type: 'ARTICLE' }, { paused: bulkBusy });
    const videoSummary = useContent({ page: 1, limit: 1, type: 'VIDEO' }, { paused: bulkBusy });
    const podcastSummary = useContent({ page: 1, limit: 1, type: 'PODCAST' }, { paused: bulkBusy });
    const tweetSummary = useContent({ page: 1, limit: 1, type: 'TWEET' }, { paused: bulkBusy });
    const commentSummary = useContent({ page: 1, limit: 1, type: 'COMMENT' }, { paused: bulkBusy });
    const recentFailures = useContent(
        { page: 1, limit: 5, status: 'FAILED', sort: 'updated_at', order: 'desc' },
        { paused: bulkBusy }
    );

    // Lazy-load source names once for the toolbar filter.
    useEffect(() => {
        listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
    }, []);

    // Clear selection on page/filter change.
    useEffect(() => {
        setSelected(new Set());
    }, [state.page, state.search, state.status, state.type, state.sourceName]);

    const items: ContentItem[] = useMemo(() => data?.data ?? [], [data]);

    const selectedItems = useMemo(
        () => items.filter((i) => selected.has(i.id)),
        [items, selected]
    );

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllOnPage = (ids: string[], on: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            for (const id of ids) {
                if (on) next.add(id);
                else next.delete(id);
            }
            return next;
        });
    };

    const handleSingleDelete = () => {
        if (!deleteId) return;
        deleteByIds.mutate([deleteId], {
            onSuccess: () => setDeleteId(null),
        });
    };

    const handleBulkSetStatus = async (target: ContentStatus) => {
        const ids = [...selected];
        if (ids.length === 0) return;
        const result = await bulkStatus.run(ids, async (id) => {
            await updateStatus.mutateAsync({ id, status: target });
        });
        await refetch();
        if (result.failed.length === 0) {
            toast({
                title: 'Status updated',
                description: `${result.completed} item${result.completed === 1 ? '' : 's'} → ${CONTENT_STATUS_LABELS[target]}.`,
                variant: 'success',
            });
        } else {
            toast({
                title: 'Update finished with errors',
                description: `${result.completed} succeeded, ${result.failed.length} failed.`,
                variant: 'destructive',
            });
        }
        setSelected(new Set());
        setBulkStatusOpen(false);
    };

    const handleBulkReEnrich = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;

        // Chunk into batches of 10 (backend limit).
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += ENRICHMENT_BATCH_LIMIT) {
            chunks.push(ids.slice(i, i + ENRICHMENT_BATCH_LIMIT));
        }

        // Drive useBulkAction over chunk indexes (use the chunk index as the "id").
        const result = await bulkEnrich.run(
            chunks.map((_, i) => String(i)),
            async (idxStr) => {
                await triggerBatchEnrichment(chunks[Number(idxStr)]);
            }
        );

        if (result.failed.length === 0) {
            toast({
                title: 'Enrichment triggered',
                description: `${ids.length} items, ${chunks.length} batch${chunks.length === 1 ? '' : 'es'}.`,
                variant: 'success',
            });
        } else {
            toast({
                title: 'Enrichment finished with errors',
                description: `${result.failed.length} batch${result.failed.length === 1 ? '' : 'es'} failed.`,
                variant: 'destructive',
            });
        }
        setSelected(new Set());
        setBulkReEnrichOpen(false);
    };

    const handleBulkDelete = () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        deleteByIds.mutate(ids, {
            onSuccess: () => {
                setSelected(new Set());
                setBulkDeleteOpen(false);
            },
        });
    };

    const totalPages = data?.total_pages ?? 1;
    const pageNumbers = useMemo(
        () => buildPagination(state.page, totalPages),
        [state.page, totalPages]
    );
    const statusCounts = counts.data;
    const totalContent = statusCounts
        ? Object.values(statusCounts).reduce((sum, value) => sum + value, 0)
        : 0;
    const mediaTotal = (videoSummary.data?.total ?? 0) + (podcastSummary.data?.total ?? 0);
    const newsTotal = (newsSummary.data?.total ?? 0) + (articleSummary.data?.total ?? 0);
    const socialTotal = (tweetSummary.data?.total ?? 0) + (commentSummary.data?.total ?? 0);
    // News types route into the News Library; media types into Media Library.
    const typeBreakdown = [
        { type: 'NEWS' as ContentType, total: newsSummary.data?.total ?? 0, icon: <Newspaper className="h-4 w-4" />, href: '/platform/news?view=library&type=NEWS' },
        { type: 'ARTICLE' as ContentType, total: articleSummary.data?.total ?? 0, icon: <FileText className="h-4 w-4" />, href: '/platform/news?view=library&type=ARTICLE' },
        { type: 'VIDEO' as ContentType, total: videoSummary.data?.total ?? 0, icon: <Video className="h-4 w-4" />, href: '/platform/media?type=VIDEO' },
        { type: 'PODCAST' as ContentType, total: podcastSummary.data?.total ?? 0, icon: <Mic className="h-4 w-4" />, href: '/platform/media?type=PODCAST' },
        { type: 'TWEET' as ContentType, total: tweetSummary.data?.total ?? 0, icon: <MessageSquare className="h-4 w-4" />, href: '/platform/news?view=library&type=TWEET' },
        { type: 'COMMENT' as ContentType, total: commentSummary.data?.total ?? 0, icon: <MessageSquare className="h-4 w-4" />, href: '/platform/news?view=library&type=COMMENT' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content</h1>
                    <p className="text-muted-foreground">
                        General content health, distribution, and cross-platform operations.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            refetch();
                            counts.refetch();
                        }}
                        disabled={isLoading || bulkBusy}
                        aria-label="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <ToolsMenu />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <OverviewStat
                    label="Total content"
                    value={totalContent}
                    icon={<Database className="h-4 w-4" />}
                />
                <OverviewStat
                    label="Ready"
                    value={statusCounts?.READY ?? 0}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    tone="text-success"
                />
                <OverviewStat
                    label="Processing"
                    value={(statusCounts?.PROCESSING ?? 0) + (statusCounts?.PENDING ?? 0)}
                    icon={<Clock3 className="h-4 w-4" />}
                    tone="text-info"
                />
                <OverviewStat
                    label="Failed"
                    value={statusCounts?.FAILED ?? 0}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    tone="text-destructive"
                />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Content Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Link href="/platform/news" className="rounded-md border p-3 transition-colors hover:bg-muted/50">
                                <div className="text-2xl font-semibold tabular-nums">{newsTotal}</div>
                                <div className="text-xs text-muted-foreground">News center</div>
                            </Link>
                            <Link href="/platform/media" className="rounded-md border p-3 transition-colors hover:bg-muted/50">
                                <div className="text-2xl font-semibold tabular-nums">{mediaTotal}</div>
                                <div className="text-xs text-muted-foreground">Media library</div>
                            </Link>
                            <Link href="/platform/news?view=library&type=TWEET" className="rounded-md border p-3 transition-colors hover:bg-muted/50">
                                <div className="text-2xl font-semibold tabular-nums">{socialTotal}</div>
                                <div className="text-xs text-muted-foreground">Social items</div>
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {typeBreakdown.map((entry) => {
                                const row = (
                                    <>
                                        <div className="text-muted-foreground">{entry.icon}</div>
                                        <div className="flex-1 text-sm">{CONTENT_TYPE_LABELS[entry.type]}</div>
                                        <div className="font-mono text-sm tabular-nums">{entry.total}</div>
                                    </>
                                );
                                return entry.href ? (
                                    <Link
                                        key={entry.type}
                                        href={entry.href}
                                        className="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
                                    >
                                        {row}
                                    </Link>
                                ) : (
                                    <div key={entry.type} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                        {row}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recent Failures</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {recentFailures.isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Activity className="h-5 w-5 animate-pulse" />
                            </div>
                        ) : (recentFailures.data?.data ?? []).length > 0 ? (
                            recentFailures.data!.data.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.type === 'VIDEO' || item.type === 'PODCAST' ? `/platform/media-studio/${item.id}` : `/platform/content/${item.id}`}
                                    className="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{item.title || '(untitled)'}</div>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <Badge variant="outline">{CONTENT_TYPE_LABELS[item.type]}</Badge>
                                            <Badge variant={CONTENT_STATUS_VARIANTS[item.status]}>{CONTENT_STATUS_LABELS[item.status]}</Badge>
                                            {item.source_name && <span className="text-xs text-muted-foreground">{item.source_name}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                No failed content items right now.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-6">
                <div>
                    <h2 className="text-lg font-semibold">All Content Browser</h2>
                    <p className="text-sm text-muted-foreground">
                        Temporary legacy browser while News and Media continue moving into dedicated tabs.
                    </p>
                </div>
            </div>

            {/* Status counts strip */}
            <StatusCountsStrip
                counts={counts.data}
                isLoading={counts.isLoading}
                activeStatus={state.status}
                onSelect={(s) => setState({ status: s })}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-sm flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search title / excerpt / author…"
                        value={state.search}
                        onChange={(e) => setState({ search: e.target.value })}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={state.status}
                    onValueChange={(v) => setState({ status: v as typeof state.status })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {Object.entries(CONTENT_STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                                {l}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={state.type}
                    onValueChange={(v) => setState({ type: v as typeof state.type })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {Object.entries(CONTENT_TYPE_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                                {l}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={state.sourceName || 'all'}
                    onValueChange={(v) =>
                        setState({ sourceName: v === 'all' ? '' : v })
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {sourceNames.map((n) => (
                            <SelectItem key={n} value={n}>
                                {n}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Bulk action bar */}
            <ContentBulkActionBar
                count={selected.size}
                busy={bulkBusy}
                progress={
                    bulkBusy
                        ? {
                              completed: bulkStatus.completed + bulkEnrich.completed,
                              total: bulkStatus.total + bulkEnrich.total,
                          }
                        : null
                }
                onClear={() => setSelected(new Set())}
                onSetStatus={() => setBulkStatusOpen(true)}
                onReEnrich={() => setBulkReEnrichOpen(true)}
                onDelete={() => setBulkDeleteOpen(true)}
            />

            {/* Table */}
            <ContentTable
                items={items}
                isLoading={isLoading}
                isError={Boolean(error)}
                selected={selected}
                onToggle={toggleOne}
                onToggleAll={toggleAllOnPage}
                sortField={state.sortField}
                sortDir={state.sortDir}
                onToggleSort={toggleSort}
                onDeleteRow={(id) => setDeleteId(id)}
            />

            {/* Pagination */}
            {data && totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setState({ page: Math.max(1, state.page - 1) })}
                                className={
                                    state.page <= 1
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                        {pageNumbers.map((p, i) =>
                            p === '…' ? (
                                <PaginationItem key={`e-${i}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            ) : (
                                <PaginationItem key={p}>
                                    <PaginationLink
                                        onClick={() => setState({ page: p })}
                                        isActive={p === state.page}
                                        className="cursor-pointer"
                                    >
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            )
                        )}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() =>
                                    setState({
                                        page: Math.min(totalPages, state.page + 1),
                                    })
                                }
                                className={
                                    state.page >= totalPages
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Single-row delete */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete content</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSingleDelete}
                            disabled={deleteByIds.isPending}
                        >
                            {deleteByIds.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk delete */}
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className="max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>
                            Delete {selectedItems.length} content item
                            {selectedItems.length === 1 ? '' : 's'}
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-64 overflow-y-auto rounded-md border">
                        <ul className="divide-y text-sm">
                            {selectedItems.map((i) => (
                                <li
                                    key={i.id}
                                    className="flex items-center justify-between px-3 py-2"
                                >
                                    <span className="line-clamp-1 truncate font-medium">
                                        {i.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {CONTENT_STATUS_LABELS[i.status]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteOpen(false)}
                            disabled={deleteByIds.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={deleteByIds.isPending}
                        >
                            {deleteByIds.isPending
                                ? 'Deleting…'
                                : `Delete ${selectedItems.length}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BulkSetStatusDialog
                open={bulkStatusOpen}
                count={selectedItems.length}
                onClose={() => setBulkStatusOpen(false)}
                onSubmit={handleBulkSetStatus}
                isSubmitting={bulkStatus.running}
            />

            <BulkReEnrichDialog
                open={bulkReEnrichOpen}
                count={selectedItems.length}
                onClose={() => setBulkReEnrichOpen(false)}
                onConfirm={handleBulkReEnrich}
                isSubmitting={bulkEnrich.running}
            />
        </div>
    );
}

/**
 * Build a compact pagination list: 1 … 4 5 6 … 50.
 * For ≤ 7 pages, just enumerate all of them.
 */
function buildPagination(current: number, total: number): Array<number | '…'> {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const out: Array<number | '…'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push('…');
    for (let p = start; p <= end; p += 1) out.push(p);
    if (end < total - 1) out.push('…');
    out.push(total);
    return out;
}

function OverviewStat({
    label,
    value,
    icon,
    tone = 'text-muted-foreground',
}: {
    label: string;
    value: number;
    icon: ReactNode;
    tone?: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                </div>
                <div className={tone}>{icon}</div>
            </CardContent>
        </Card>
    );
}
