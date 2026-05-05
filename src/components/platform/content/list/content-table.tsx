'use client';

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ExternalLink } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
    CONTENT_TYPE_LABELS,
} from '@/types/platform/content';
import type { ContentItem } from '@/types/platform/content';
import { ContentRowActions } from './content-row-actions';
import type { SortDir, SortField } from './use-content-list-query-state';

interface ContentTableProps {
    items: ContentItem[];
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

export function ContentTable({
    items,
    isLoading,
    isError,
    selected,
    onToggle,
    onToggleAll,
    sortField,
    sortDir,
    onToggleSort,
    onDeleteRow,
}: ContentTableProps) {
    const router = useRouter();

    const sorted = useMemo(() => {
        const cmp = (a: ContentItem, b: ContentItem): number => {
            switch (sortField) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'type':
                    return a.type.localeCompare(b.type);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'created_at':
                    return (
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                case 'published_at': {
                    const aT = a.published_at ? new Date(a.published_at).getTime() : null;
                    const bT = b.published_at ? new Date(b.published_at).getTime() : null;
                    if (aT === null && bT === null) return 0;
                    if (aT === null) return 1;
                    if (bT === null) return -1;
                    return aT - bT;
                }
            }
        };
        const arr = [...items].sort(cmp);
        return sortDir === 'desc' ? arr.reverse() : arr;
    }, [items, sortField, sortDir]);

    const allOnPageIds = sorted.map((i) => i.id);
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
                            label="Title"
                            field="title"
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
                        <SortableHead
                            label="Status"
                            field="status"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <TableHead>Source</TableHead>
                        <SortableHead
                            label="Published"
                            field="published_at"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <SortableHead
                            label="Created"
                            field="created_at"
                            sortField={sortField}
                            sortDir={sortDir}
                            onClick={onToggleSort}
                        />
                        <TableHead className="w-10 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-destructive">
                                Failed to load content. Please try again.
                            </TableCell>
                        </TableRow>
                    ) : sorted.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                No content matches your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sorted.map((item) => {
                            const isSelected = selected.has(item.id);
                            return (
                                <TableRow
                                    key={item.id}
                                    data-state={isSelected ? 'selected' : undefined}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => onToggle(item.id)}
                                            aria-label={`Select ${item.title}`}
                                        />
                                    </TableCell>
                                    <TableCell
                                        className="cursor-pointer max-w-md"
                                        onClick={() =>
                                            router.push(`/platform/content/${item.id}`)
                                        }
                                    >
                                        <div className="line-clamp-1 font-medium hover:underline">
                                            {item.title}
                                        </div>
                                        {item.author && (
                                            <div className="line-clamp-1 text-xs text-muted-foreground">
                                                {item.author}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {CONTENT_TYPE_LABELS[item.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={CONTENT_STATUS_VARIANTS[item.status]}>
                                            {CONTENT_STATUS_LABELS[item.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.source_name ? (
                                            <div className="flex items-center gap-1">
                                                <span className="truncate">{item.source_name}</span>
                                                {item.original_url && (
                                                    <a
                                                        href={item.original_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        aria-label="Open original"
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.published_at
                                            ? formatDistanceToNow(new Date(item.published_at), {
                                                  addSuffix: true,
                                              })
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(item.created_at), {
                                            addSuffix: true,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ContentRowActions item={item} onDelete={onDeleteRow} />
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
