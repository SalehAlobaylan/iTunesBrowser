'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Zap } from 'lucide-react';

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
import { useSources, useDeleteSource } from '@/hooks/use-sources';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceType } from '@/types/platform/source';
import { sourceHealth } from '@/lib/sources/health';

import { useListQueryState } from '@/components/platform/sources/list/use-list-query-state';
import { useBulkAction } from '@/hooks/use-bulk-action';
import { SourcesTable } from '@/components/platform/sources/list/sources-table';
import { BulkActionBar } from '@/components/platform/sources/list/bulk-action-bar';
import { BulkIntervalDialog } from '@/components/platform/sources/list/bulk-interval-dialog';
import { RunStaleDialog } from '@/components/platform/sources/list/run-stale-dialog';
import { runSource, updateSource, deleteSource } from '@/lib/api/cms/sources';

const PAGE_LIMIT = 10;

export default function SourcesPage() {
    const { state, setState, toggleSort } = useListQueryState();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkIntervalOpen, setBulkIntervalOpen] = useState(false);
    const [runStaleOpen, setRunStaleOpen] = useState(false);

    const bulkRun = useBulkAction({ mode: 'sequential' });
    const bulkDelete = useBulkAction({ mode: 'sequential' });
    const bulkActive = useBulkAction({ mode: 'parallel' });
    const bulkInterval = useBulkAction({ mode: 'parallel' });
    const bulkBusy =
        bulkRun.running ||
        bulkDelete.running ||
        bulkActive.running ||
        bulkInterval.running;

    const { data, isLoading, error, refetch } = useSources(
        {
            page: state.page,
            limit: PAGE_LIMIT,
            search: state.search || undefined,
            is_active:
                state.status === 'all' ? undefined : state.status === 'active',
            type: state.type === 'all' ? undefined : (state.type as SourceType),
        },
        { paused: bulkBusy }
    );

    const deleteMutation = useDeleteSource();

    // Clear selection when the underlying page or filters change.
    useEffect(() => {
        setSelected(new Set());
    }, [state.page, state.search, state.status, state.type]);

    // News sources are managed in News → Feeds Finding. This page owns media
    // sources (For You). A source's `category` decides ownership — so a Telegram
    // channel shows in exactly one place. An explicit type filter shows all.
    const sources: ContentSource[] = useMemo(() => {
        const all = data?.data ?? [];
        if (state.type !== 'all') return all;
        return all.filter((s) => s.category === 'media');
    }, [data, state.type]);

    const summary = useMemo(() => {
        let active = 0;
        let stale = 0;
        let disabled = 0;
        for (const s of sources) {
            const h = sourceHealth(s);
            if (h.status === 'disabled') disabled += 1;
            else if (h.isStale) stale += 1;
            else active += 1;
        }
        return { active, stale, disabled };
    }, [sources]);

    const staleSources = useMemo(
        () => sources.filter((s) => sourceHealth(s).isStale),
        [sources]
    );

    const selectedSources = useMemo(
        () => sources.filter((s) => selected.has(s.id)),
        [sources, selected]
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
        deleteMutation.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
        });
    };

    const runBulk = async (
        action: ReturnType<typeof useBulkAction>,
        ids: string[],
        handler: (id: string) => Promise<unknown>,
        verb: string
    ) => {
        if (ids.length === 0) return;
        const result = await action.run(ids, handler);
        await refetch();
        if (result.failed.length === 0) {
            toast({
                title: `${verb} ${result.completed}`,
                description: `Bulk ${verb.toLowerCase()} complete.`,
                variant: 'success',
            });
        } else {
            toast({
                title: `${verb} finished with errors`,
                description: `${result.completed} succeeded, ${result.failed.length} failed.`,
                variant: 'destructive',
            });
        }
        setSelected(new Set());
    };

    const handleBulkRun = () =>
        runBulk(bulkRun, [...selected], (id) => runSource(id), 'Ran');

    const handleBulkEnable = () =>
        runBulk(
            bulkActive,
            [...selected],
            (id) => updateSource(id, { is_active: true }),
            'Enabled'
        );

    const handleBulkDisable = () =>
        runBulk(
            bulkActive,
            [...selected],
            (id) => updateSource(id, { is_active: false }),
            'Disabled'
        );

    const handleBulkDelete = async () => {
        await runBulk(bulkDelete, [...selected], (id) => deleteSource(id), 'Deleted');
        setBulkDeleteOpen(false);
    };

    const handleBulkInterval = async (minutes: number) => {
        await runBulk(
            bulkInterval,
            [...selected],
            (id) => updateSource(id, { fetch_interval_minutes: minutes }),
            'Updated'
        );
        setBulkIntervalOpen(false);
    };

    const handleRunStale = async () => {
        const ids = staleSources.map((s) => s.id);
        await runBulk(bulkRun, ids, (id) => runSource(id), 'Ran');
        setRunStaleOpen(false);
    };

    const totalPages = data?.total_pages ?? 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Sources</h1>
                    <p className="text-muted-foreground">
                        Manage your content ingestion sources
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setRunStaleOpen(true)}
                        disabled={bulkBusy || staleSources.length === 0}
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Run all stale{staleSources.length > 0 ? ` (${staleSources.length})` : ''}
                    </Button>
                    <Button asChild>
                        <Link href="/platform/sources/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Source
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={state.search}
                        onChange={(e) => setState({ search: e.target.value })}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={state.status}
                    onValueChange={(value) =>
                        setState({ status: value as typeof state.status })
                    }
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={state.type}
                    onValueChange={(value) =>
                        setState({ type: value as typeof state.type })
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto text-xs text-muted-foreground">
                    {summary.active} healthy
                    {' · '}
                    <span className={summary.stale > 0 ? 'text-destructive' : ''}>
                        {summary.stale} stale
                    </span>
                    {' · '}
                    {summary.disabled} disabled
                </div>
            </div>

            {/* Bulk action bar */}
            <BulkActionBar
                count={selected.size}
                busy={bulkBusy}
                progress={
                    bulkBusy
                        ? {
                              completed:
                                  bulkRun.completed +
                                  bulkDelete.completed +
                                  bulkActive.completed +
                                  bulkInterval.completed,
                              total:
                                  bulkRun.total +
                                  bulkDelete.total +
                                  bulkActive.total +
                                  bulkInterval.total,
                          }
                        : null
                }
                onClear={() => setSelected(new Set())}
                onRun={handleBulkRun}
                onEnable={handleBulkEnable}
                onDisable={handleBulkDisable}
                onChangeInterval={() => setBulkIntervalOpen(true)}
                onDelete={() => setBulkDeleteOpen(true)}
            />

            {/* Table */}
            <SourcesTable
                sources={sources}
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    onClick={() => setState({ page: p })}
                                    isActive={p === state.page}
                                    className="cursor-pointer"
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() =>
                                    setState({ page: Math.min(totalPages, state.page + 1) })
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

            {/* Single-row delete confirmation (preserved from old page) */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Source</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this source? This action cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSingleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk delete confirmation */}
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className="max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Delete {selectedSources.length} sources</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-64 overflow-y-auto rounded-md border">
                        <ul className="divide-y text-sm">
                            {selectedSources.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between px-3 py-2"
                                >
                                    <span className="truncate font-medium">{s.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {SOURCE_TYPE_LABELS[s.type]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteOpen(false)}
                            disabled={bulkDelete.running}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={bulkDelete.running}
                        >
                            {bulkDelete.running
                                ? `Deleting ${bulkDelete.completed}/${bulkDelete.total}…`
                                : `Delete ${selectedSources.length}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BulkIntervalDialog
                open={bulkIntervalOpen}
                count={selectedSources.length}
                onClose={() => setBulkIntervalOpen(false)}
                onSubmit={handleBulkInterval}
                isSubmitting={bulkInterval.running}
            />

            <RunStaleDialog
                open={runStaleOpen}
                sources={staleSources}
                onClose={() => setRunStaleOpen(false)}
                onConfirm={handleRunStale}
                isSubmitting={bulkRun.running}
            />
        </div>
    );
}
