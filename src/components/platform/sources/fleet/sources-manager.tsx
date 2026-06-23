'use client';

import { useEffect, useMemo } from 'react';
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
import { sourceHealth } from '@/lib/sources/health';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource } from '@/types/platform/source';

import { useSourceManagement } from '@/components/platform/sources/shared/use-source-management';
import { SelectionToolbar } from '@/components/platform/sources/shared/selection-toolbar';
import { SourceManagementDialogs } from '@/components/platform/sources/shared/source-management-dialogs';
import { HEALTH_LABELS, HEALTH_ORDER } from '@/components/platform/sources/shared/health-meta';
import { FleetTable } from './fleet-table';
import type {
    ListQueryState,
    SortField,
    SortDir,
} from '@/components/platform/sources/list/use-list-query-state';

const PAGE_LIMIT = 10;
const RETURN_TO = '/platform/sources';

interface SourcesManagerProps {
    sources: ContentSource[];
    isLoading: boolean;
    isError: boolean;
    state: ListQueryState;
    setState: (patch: Partial<ListQueryState>) => void;
    toggleSort: (field: SortField) => void;
    onBusyChange?: (busy: boolean) => void;
    refetch: () => Promise<unknown> | void;
}

function sortSources(arr: ContentSource[], field: SortField, dir: SortDir) {
    const cmp = (a: ContentSource, b: ContentSource): number => {
        switch (field) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'fetch_interval_minutes':
                return a.fetch_interval_minutes - b.fetch_interval_minutes;
            case 'last_fetched_at': {
                const aT = a.last_fetched_at ? new Date(a.last_fetched_at).getTime() : null;
                const bT = b.last_fetched_at ? new Date(b.last_fetched_at).getTime() : null;
                if (aT === null && bT === null) return 0;
                if (aT === null) return 1;
                if (bT === null) return -1;
                return aT - bT;
            }
        }
    };
    const sorted = [...arr].sort(cmp);
    return dir === 'desc' ? sorted.reverse() : sorted;
}

export function SourcesManager({
    sources,
    isLoading,
    isError,
    state,
    setState,
    toggleSort,
    onBusyChange,
    refetch,
}: SourcesManagerProps) {
    const mgmt = useSourceManagement({ sources, refetch, onBusyChange });

    const filtered = useMemo(() => {
        const q = state.search.trim().toLowerCase();
        const arr = sources.filter((s) => {
            if (q && !s.name.toLowerCase().includes(q)) return false;
            if (state.type !== 'all' && s.type !== state.type) return false;
            if (state.category !== 'all' && (s.category ?? 'news') !== state.category) return false;
            if (state.status === 'active' && !s.is_active) return false;
            if (state.status === 'disabled' && s.is_active) return false;
            if (state.health !== 'all' && sourceHealth(s).status !== state.health) return false;
            return true;
        });
        return sortSources(arr, state.sortField, state.sortDir);
    }, [sources, state.search, state.type, state.category, state.status, state.health, state.sortField, state.sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_LIMIT));
    const page = Math.min(state.page, totalPages);
    const pageItems = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

    const staleSources = useMemo(() => filtered.filter((s) => sourceHealth(s).isStale), [filtered]);

    // Clear selection when the filtered view changes underneath it.
    useEffect(() => {
        mgmt.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.search, state.type, state.category, state.status, state.health, page]);

    return (
        <div className="space-y-4">
            {/* Sub-header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Manage sources</h2>
                    <p className="text-sm text-muted-foreground">
                        Every source across News and Media — filter, select, and act in bulk.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => mgmt.openRunStale(staleSources)}
                        disabled={mgmt.bulkBusy || staleSources.length === 0}
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Run all stale{staleSources.length > 0 ? ` (${staleSources.length})` : ''}
                    </Button>
                    <Button asChild>
                        <Link href={`/platform/sources/new?from=${encodeURIComponent(RETURN_TO)}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Source
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={state.search}
                        onChange={(e) => setState({ search: e.target.value })}
                        className="pl-9"
                    />
                </div>
                <Select value={state.type} onValueChange={(v) => setState({ type: v as ListQueryState['type'] })}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={state.category} onValueChange={(v) => setState({ category: v as ListQueryState['category'] })}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={state.health} onValueChange={(v) => setState({ health: v as ListQueryState['health'] })}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Health" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All health</SelectItem>
                        {HEALTH_ORDER.map((h) => (
                            <SelectItem key={h} value={h}>{HEALTH_LABELS[h]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={state.status} onValueChange={(v) => setState({ status: v as ListQueryState['status'] })}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto text-xs text-muted-foreground">
                    {filtered.length} of {sources.length} sources
                </div>
            </div>

            {/* Selection toolbar */}
            <SelectionToolbar
                count={mgmt.selected.size}
                busy={mgmt.bulkBusy}
                progress={mgmt.progress}
                onClear={mgmt.clear}
                onRun={mgmt.actions.runSelected}
                onEnable={mgmt.actions.enableSelected}
                onDisable={mgmt.actions.disableSelected}
                onChangeInterval={mgmt.actions.openChangeInterval}
                onMoveToNews={mgmt.actions.moveSelectedToNews}
                onMoveToMedia={mgmt.actions.moveSelectedToMedia}
                onDelete={mgmt.actions.openBulkDelete}
            />

            {/* Table */}
            <FleetTable
                sources={pageItems}
                isLoading={isLoading}
                isError={isError}
                selected={mgmt.selected}
                onToggle={mgmt.toggleOne}
                onToggleAll={mgmt.toggleMany}
                sortField={state.sortField}
                sortDir={state.sortDir}
                onToggleSort={toggleSort}
                onRequestDelete={mgmt.requestDelete}
                returnTo={RETURN_TO}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setState({ page: Math.max(1, page - 1) })}
                                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    onClick={() => setState({ page: p })}
                                    isActive={p === page}
                                    className="cursor-pointer"
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setState({ page: Math.min(totalPages, page + 1) })}
                                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <SourceManagementDialogs dialogs={mgmt.dialogs} />
        </div>
    );
}
