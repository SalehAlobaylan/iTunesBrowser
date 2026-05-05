'use client';

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

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
import type { ContentSource } from '@/types/platform/source';
import type { SortDir, SortField } from './use-list-query-state';
import { HealthBadge } from './health-badge';
import { SourceRowActions } from './source-row-actions';

interface SourcesTableProps {
    sources: ContentSource[];
    isLoading: boolean;
    isError: boolean;
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[], on: boolean) => void;
    sortField: SortField;
    sortDir: SortDir;
    onToggleSort: (field: SortField) => void;
    onDeleteRow: (id: string) => void;
}

export function SourcesTable({
    sources,
    isLoading,
    isError,
    selected,
    onToggle,
    onToggleAll,
    sortField,
    sortDir,
    onToggleSort,
    onDeleteRow,
}: SourcesTableProps) {
    const router = useRouter();

    const sorted = useMemo(() => {
        const cmp = (a: ContentSource, b: ContentSource): number => {
            switch (sortField) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'type':
                    return a.type.localeCompare(b.type);
                case 'fetch_interval_minutes':
                    return a.fetch_interval_minutes - b.fetch_interval_minutes;
                case 'last_fetched_at': {
                    // Nulls last regardless of direction so "Never run" surfaces as outliers.
                    const aT = a.last_fetched_at ? new Date(a.last_fetched_at).getTime() : null;
                    const bT = b.last_fetched_at ? new Date(b.last_fetched_at).getTime() : null;
                    if (aT === null && bT === null) return 0;
                    if (aT === null) return 1;
                    if (bT === null) return -1;
                    return aT - bT;
                }
            }
        };
        const arr = [...sources].sort(cmp);
        return sortDir === 'desc' ? arr.reverse() : arr;
    }, [sources, sortField, sortDir]);

    const allOnPageIds = sorted.map((s) => s.id);
    const selectedOnPage = allOnPageIds.filter((id) => selected.has(id)).length;
    const headerState =
        selectedOnPage === 0
            ? false
            : selectedOnPage === allOnPageIds.length
              ? true
              : 'indeterminate';

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={headerState}
                                onCheckedChange={(c) => onToggleAll(allOnPageIds, Boolean(c))}
                                aria-label="Select all on this page"
                            />
                        </TableHead>
                        <SortableHead
                            label="Name"
                            field="name"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <SortableHead
                            label="Type"
                            field="type"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <TableHead>Health</TableHead>
                        <SortableHead
                            label="Interval"
                            field="fetch_interval_minutes"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <SortableHead
                            label="Last fetched"
                            field="last_fetched_at"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <TableHead>Next due</TableHead>
                        <TableHead className="w-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-destructive">
                                Failed to load sources. Please try again.
                            </TableCell>
                        </TableRow>
                    ) : sorted.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                No sources match your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sorted.map((source) => {
                            const health = sourceHealth(source);
                            const isSelected = selected.has(source.id);
                            return (
                                <TableRow
                                    key={source.id}
                                    data-state={isSelected ? 'selected' : undefined}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => onToggle(source.id)}
                                            aria-label={`Select ${source.name}`}
                                        />
                                    </TableCell>
                                    <TableCell
                                        className="cursor-pointer font-medium hover:underline"
                                        onClick={() =>
                                            router.push(`/platform/sources/${source.id}`)
                                        }
                                    >
                                        {source.name}
                                    </TableCell>
                                    <TableCell>{SOURCE_TYPE_LABELS[source.type]}</TableCell>
                                    <TableCell>
                                        <HealthBadge source={source} />
                                    </TableCell>
                                    <TableCell>{source.fetch_interval_minutes} min</TableCell>
                                    <TableCell className="text-sm">
                                        {source.last_fetched_at
                                            ? formatDistanceToNow(new Date(source.last_fetched_at), {
                                                  addSuffix: true,
                                              })
                                            : <span className="text-muted-foreground">Never</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {health.nextDueAt
                                            ? formatDistanceToNow(health.nextDueAt, { addSuffix: true })
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <SourceRowActions
                                            source={source}
                                            onDelete={() => onDeleteRow(source.id)}
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

interface SortableHeadProps {
    label: string;
    field: SortField;
    sortField: SortField;
    sortDir: SortDir;
    onClick: (field: SortField) => void;
}

function SortableHead({ label, field, sortField, sortDir, onClick }: SortableHeadProps) {
    const active = sortField === field;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <TableHead>
            <button
                type="button"
                onClick={() => onClick(field)}
                className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide hover:text-foreground',
                    active ? 'text-foreground' : 'text-muted-foreground'
                )}
            >
                {label}
                <Icon className="h-3 w-3" />
            </button>
        </TableHead>
    );
}
