'use client';

import { formatDistanceToNow } from 'date-fns';
import {
    MoreHorizontal,
    Archive,
    Trash2,
    Undo2,
    Send,
    ExternalLink,
    Eye,
    Newspaper,
} from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
} from '@/types/platform/content';
import type { NewsItem, NewsView } from '@/types/platform/news';

interface NewsLineupTableProps {
    items: NewsItem[];
    isLoading: boolean;
    isError: boolean;
    view: NewsView;
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[], on: boolean) => void;
    onArchiveRow: (id: string) => void;
    onDeleteRow: (id: string) => void;
    onRestoreRow: (id: string) => void;
    onPromoteRow: (id: string) => void;
}

function relativeDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
}

export function NewsLineupTable({
    items,
    isLoading,
    isError,
    view,
    selected,
    onToggle,
    onToggleAll,
    onArchiveRow,
    onDeleteRow,
    onRestoreRow,
    onPromoteRow,
}: NewsLineupTableProps) {
    const pageIds = items.map((i) => i.id);
    const allOnPageSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const someSelected = pageIds.some((id) => selected.has(id));

    if (isError) {
        return (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
                Failed to load the news lineup. Try refreshing.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[44px]">
                            <Checkbox
                                aria-label="Select all on page"
                                checked={
                                    allOnPageSelected
                                        ? true
                                        : someSelected
                                          ? 'indeterminate'
                                          : false
                                }
                                onCheckedChange={(v) =>
                                    onToggleAll(pageIds, v === true)
                                }
                                disabled={pageIds.length === 0}
                            />
                        </TableHead>
                        <TableHead>Article</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[150px]">Published</TableHead>
                        <TableHead className="w-[90px] text-right">Views</TableHead>
                        <TableHead className="w-[56px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <TableRow key={`s-${i}`}>
                                  <TableCell colSpan={6}>
                                      <Skeleton className="h-10 w-full" />
                                  </TableCell>
                              </TableRow>
                          ))
                        : items.length === 0
                          ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-sm text-muted-foreground"
                                    >
                                        <Newspaper className="mx-auto mb-2 h-6 w-6 opacity-40" />
                                        No {view.toLowerCase()} news here yet.
                                    </TableCell>
                                </TableRow>
                            )
                          : items.map((item) => (
                                <TableRow
                                    key={item.id}
                                    data-state={
                                        selected.has(item.id) ? 'selected' : undefined
                                    }
                                >
                                    <TableCell>
                                        <Checkbox
                                            aria-label={`Select ${item.title}`}
                                            checked={selected.has(item.id)}
                                            onCheckedChange={() => onToggle(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {item.thumbnail_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.thumbnail_url}
                                                    alt=""
                                                    className="h-10 w-16 flex-shrink-0 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded bg-muted">
                                                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="line-clamp-1 font-medium">
                                                    {item.title || 'Untitled'}
                                                </p>
                                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                                    {item.source_name || 'Manual'}
                                                    {item.author ? ` · ${item.author}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={CONTENT_STATUS_VARIANTS[item.status]}
                                        >
                                            {CONTENT_STATUS_LABELS[item.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {relativeDate(item.published_at || item.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm tabular-nums">
                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                            <Eye className="h-3.5 w-3.5" />
                                            {item.view_count ?? 0}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Row actions"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {view === 'PENDING' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onPromoteRow(item.id)}
                                                    >
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Publish to feed
                                                    </DropdownMenuItem>
                                                )}
                                                {view === 'READY' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onArchiveRow(item.id)}
                                                    >
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                )}
                                                {view === 'ARCHIVED' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onRestoreRow(item.id)}
                                                    >
                                                        <Undo2 className="mr-2 h-4 w-4" />
                                                        Restore to feed
                                                    </DropdownMenuItem>
                                                )}
                                                {item.original_url && (
                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={item.original_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Open source
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => onDeleteRow(item.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete permanently
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                </TableBody>
            </Table>
        </div>
    );
}
