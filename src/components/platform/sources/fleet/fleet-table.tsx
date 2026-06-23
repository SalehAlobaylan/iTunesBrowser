'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { sourceHealth } from '@/lib/sources/health';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceType } from '@/types/platform/source';
import type { SortDir, SortField } from '@/components/platform/sources/list/use-list-query-state';
import { SourceActionMenu } from '@/components/platform/sources/shared/source-action-menu';
import { SourceAvatar } from '@/components/platform/sources/shared/source-avatar';
import { HEALTH_BG, HEALTH_LABELS, HEALTH_TEXT } from '@/components/platform/sources/shared/health-meta';

interface FleetTableProps {
    sources: ContentSource[];
    isLoading: boolean;
    isError: boolean;
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[], on: boolean) => void;
    sortField: SortField;
    sortDir: SortDir;
    onToggleSort: (field: SortField) => void;
    onRequestDelete: (id: string) => void;
    returnTo: string;
}

function cadence(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = minutes / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

/**
 * Redesigned dense fleet table — replaces the old shared SourcesTable. Adds a
 * category column and a health pill, and uses the shared SourceActionMenu. Sorts
 * are driven by the page (this is presentational over the page-sliced rows).
 */
export function FleetTable({
    sources,
    isLoading,
    isError,
    selected,
    onToggle,
    onToggleAll,
    sortField,
    sortDir,
    onToggleSort,
    onRequestDelete,
    returnTo,
}: FleetTableProps) {
    const ids = sources.map((s) => s.id);
    const selectedOnPage = ids.filter((id) => selected.has(id)).length;
    const headerState =
        selectedOnPage === 0 ? false : selectedOnPage === ids.length ? true : 'indeterminate';

    return (
        <div className="overflow-hidden rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-10">
                            <Checkbox
                                checked={headerState}
                                onCheckedChange={(c) => onToggleAll(ids, Boolean(c))}
                                aria-label="Select all on this page"
                            />
                        </TableHead>
                        <SortHead label="Name" field="name" sortField={sortField} sortDir={sortDir} onClick={onToggleSort} />
                        <SortHead label="Type" field="type" sortField={sortField} sortDir={sortDir} onClick={onToggleSort} />
                        <TableHead>Category</TableHead>
                        <TableHead>Health</TableHead>
                        <SortHead label="Cadence" field="fetch_interval_minutes" sortField={sortField} sortDir={sortDir} onClick={onToggleSort} />
                        <SortHead label="Last fetched" field="last_fetched_at" sortField={sortField} sortDir={sortDir} onClick={onToggleSort} />
                        <TableHead>Next due</TableHead>
                        <TableHead className="w-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && sources.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 9 }).map((__, j) => (
                                    <TableCell key={j}>
                                        <Skeleton className="h-4 w-full max-w-[120px]" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={9} className="py-10 text-center text-destructive">
                                Failed to load sources. Please try again.
                            </TableCell>
                        </TableRow>
                    ) : sources.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                                No sources match your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sources.map((source) => {
                            const health = sourceHealth(source);
                            const isSelected = selected.has(source.id);
                            const isMedia = source.category === 'media';
                            return (
                                <TableRow key={source.id} data-state={isSelected ? 'selected' : undefined}>
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => onToggle(source.id)}
                                            aria-label={`Select ${source.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/platform/sources/${source.id}?from=${encodeURIComponent(returnTo)}`}
                                            className="flex items-center gap-2.5 font-medium hover:underline"
                                        >
                                            <SourceAvatar source={source} className="h-7 w-7 text-[11px]" />
                                            <span className="truncate">{source.name}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {SOURCE_TYPE_LABELS[source.type as SourceType] ?? source.type}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                'rounded-full border px-2 py-0.5 text-xs',
                                                isMedia ? 'border-info/40 text-info' : 'border-news/40 text-news'
                                            )}
                                        >
                                            {isMedia ? 'Media' : 'News'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 text-xs font-medium',
                                                HEALTH_TEXT[health.status]
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    HEALTH_BG[health.status],
                                                    health.status === 'stale' && 'animate-pulse motion-reduce:animate-none'
                                                )}
                                            />
                                            {HEALTH_LABELS[health.status]}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                                        {cadence(source.fetch_interval_minutes)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {source.last_fetched_at ? (
                                            formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })
                                        ) : (
                                            <span className="text-muted-foreground">Never</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {health.nextDueAt
                                            ? formatDistanceToNow(health.nextDueAt, { addSuffix: true })
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <SourceActionMenu
                                            source={source}
                                            returnTo={returnTo}
                                            onRequestDelete={onRequestDelete}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function SortHead({
    label,
    field,
    sortField,
    sortDir,
    onClick,
}: {
    label: string;
    field: SortField;
    sortField: SortField;
    sortDir: SortDir;
    onClick: (field: SortField) => void;
}) {
    const active = sortField === field;
    return (
        <TableHead>
            <button
                type="button"
                onClick={() => onClick(field)}
                className={cn(
                    'flex items-center gap-1 transition-colors hover:text-foreground',
                    active ? 'text-foreground' : 'text-muted-foreground'
                )}
            >
                {label}
                {active ? (
                    sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                )}
            </button>
        </TableHead>
    );
}
