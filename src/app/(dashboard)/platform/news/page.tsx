'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    useNewsLineup,
    useSetNewsStatus,
    useDeleteNewsByIds,
    useRotateOlderThan,
} from '@/hooks/use-news';
import { NewsLineupTable } from '@/components/platform/news/news-lineup-table';
import { RotateToolbar } from '@/components/platform/news/rotate-toolbar';
import { AddNewsDialog } from '@/components/platform/news/add-news-dialog';
import type { ContentStatus } from '@/types/platform/content';
import type { NewsItem, NewsView, RotateMode } from '@/types/platform/news';

const PAGE_LIMIT = 10;

const VIEW_LABELS: Record<NewsView, string> = {
    READY: 'Live feed',
    PENDING: 'Queue',
    ARCHIVED: 'Archived',
};

export default function NewsPage() {
    const [view, setView] = useState<NewsView>('READY');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [addOpen, setAddOpen] = useState(false);
    const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

    const setStatus = useSetNewsStatus();
    const deleteByIds = useDeleteNewsByIds();
    const rotateOlder = useRotateOlderThan();

    const busy =
        setStatus.isPending || deleteByIds.isPending || rotateOlder.isPending;

    // Debounce search input.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    // Reset page + selection when the view or search changes.
    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [view, debouncedSearch]);

    const { data, isLoading, error, refetch } = useNewsLineup(
        {
            page,
            limit: PAGE_LIMIT,
            search: debouncedSearch || undefined,
            status: view as ContentStatus,
        },
        { paused: busy }
    );

    const items: NewsItem[] = useMemo(() => data?.data ?? [], [data]);
    const totalPages = data?.total_pages ?? 1;
    const pageNumbers = useMemo(
        () => buildPagination(page, totalPages),
        [page, totalPages]
    );

    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAllOnPage = (ids: string[], on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            for (const id of ids) {
                if (on) next.add(id);
                else next.delete(id);
            }
            return next;
        });

    const clearSelection = () => setSelected(new Set());

    const archive = (ids: string[]) =>
        ids.length &&
        setStatus.mutate(
            { ids, toStatus: 'ARCHIVED' },
            { onSuccess: clearSelection }
        );
    const restore = (ids: string[]) =>
        ids.length &&
        setStatus.mutate({ ids, toStatus: 'READY' }, { onSuccess: clearSelection });
    const promote = (ids: string[]) =>
        ids.length &&
        setStatus.mutate({ ids, toStatus: 'READY' }, { onSuccess: clearSelection });

    const confirmDelete = () => {
        if (!deleteIds) return;
        deleteByIds.mutate(deleteIds, {
            onSuccess: () => {
                setDeleteIds(null);
                clearSelection();
            },
        });
    };

    const onRotateOlderThan = (days: number, mode: RotateMode) =>
        rotateOlder.mutate({ days, mode }, { onSuccess: clearSelection });

    const selectedIds = [...selected];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">News</h1>
                    <p className="text-muted-foreground">
                        Rotate the news feed — add fresh stories, retire old ones.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading || busy}
                        aria-label="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add news
                    </Button>
                </div>
            </div>

            {/* View + search toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={view} onValueChange={(v) => setView(v as NewsView)}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(VIEW_LABELS) as NewsView[]).map((v) => (
                            <SelectItem key={v} value={v}>
                                {VIEW_LABELS[v]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative max-w-sm flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search headlines…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Rotate toolbar (selection actions + age-based rotation) */}
            <RotateToolbar
                view={view}
                selectedCount={selected.size}
                busy={busy}
                onClearSelection={clearSelection}
                onArchiveSelected={() => archive(selectedIds)}
                onRestoreSelected={() => restore(selectedIds)}
                onPromoteSelected={() => promote(selectedIds)}
                onDeleteSelected={() => setDeleteIds(selectedIds)}
                onRotateOlderThan={onRotateOlderThan}
            />

            {/* Lineup table */}
            <NewsLineupTable
                items={items}
                isLoading={isLoading}
                isError={Boolean(error)}
                view={view}
                selected={selected}
                onToggle={toggleOne}
                onToggleAll={toggleAllOnPage}
                onArchiveRow={(id) => archive([id])}
                onDeleteRow={(id) => setDeleteIds([id])}
                onRestoreRow={(id) => restore([id])}
                onPromoteRow={(id) => promote([id])}
            />

            {/* Pagination */}
            {data && totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className={
                                    page <= 1
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
                                        onClick={() => setPage(p)}
                                        isActive={p === page}
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
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                className={
                                    page >= totalPages
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Add news dialog */}
            <AddNewsDialog open={addOpen} onClose={() => setAddOpen(false)} />

            {/* Delete confirm (single or bulk) */}
            <Dialog open={!!deleteIds} onOpenChange={(o) => !o && setDeleteIds(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Permanently delete{' '}
                            {deleteIds && deleteIds.length > 1
                                ? `${deleteIds.length} articles`
                                : 'this article'}
                        </DialogTitle>
                        <DialogDescription>
                            This removes the content from the database and cannot be
                            undone. To keep it recoverable, archive instead.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteIds(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteByIds.isPending}
                        >
                            {deleteByIds.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Compact pagination list: 1 … 4 5 6 … 50. */
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
