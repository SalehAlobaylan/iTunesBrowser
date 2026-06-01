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
    Star,
    Newspaper,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { NewsItem, NewsView } from '@/types/platform/news';

interface NewsCardProps {
    item: NewsItem;
    view: NewsView;
    featured?: boolean;
    busy?: boolean;
    onPublish?: (id: string) => void;
    onArchive?: (id: string) => void;
    onRestore?: (id: string) => void;
    onToggleFeature?: (id: string, on: boolean) => void;
    onDelete?: (id: string) => void;
}

function relativeDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
}

export function NewsCard({
    item,
    view,
    featured = false,
    busy = false,
    onPublish,
    onArchive,
    onRestore,
    onToggleFeature,
    onDelete,
}: NewsCardProps) {
    return (
        <Card
            className={cn(
                'transition-colors hover:border-primary/30',
                featured && 'border-amber-400/50 bg-amber-50/30'
            )}
        >
            <CardContent className="space-y-2.5 p-3">
                <div className="flex gap-3">
                    {item.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.thumbnail_url}
                            alt=""
                            className="h-14 w-20 flex-shrink-0 rounded object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded bg-muted">
                            <Newspaper className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        {featured && (
                            <Badge
                                variant="warning"
                                className="mb-1 gap-1 text-[10px] uppercase tracking-wide"
                            >
                                <Star className="h-3 w-3 fill-current" />
                                Featured
                            </Badge>
                        )}
                        <p className="line-clamp-2 text-sm font-medium leading-snug">
                            {item.title || 'Untitled'}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {item.source_name || 'Manual'} ·{' '}
                            {relativeDate(item.published_at || item.created_at)}
                            {view !== 'PENDING' && (
                                <>
                                    {' '}
                                    ·{' '}
                                    <span className="inline-flex items-center gap-0.5">
                                        <Eye className="h-3 w-3" />
                                        {item.view_count ?? 0}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Primary stage action(s) */}
                    {view === 'PENDING' && (
                        <Button
                            size="sm"
                            className="flex-1"
                            disabled={busy}
                            onClick={() => onPublish?.(item.id)}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                        </Button>
                    )}
                    {view === 'READY' && (
                        <>
                            <Button
                                size="sm"
                                variant={featured ? 'secondary' : 'outline'}
                                disabled={busy}
                                onClick={() => onToggleFeature?.(item.id, !featured)}
                            >
                                <Star
                                    className={cn(
                                        'mr-1.5 h-4 w-4',
                                        featured && 'fill-current text-amber-500'
                                    )}
                                />
                                {featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={busy}
                                onClick={() => onArchive?.(item.id)}
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </Button>
                        </>
                    )}
                    {view === 'ARCHIVED' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={busy}
                            onClick={() => onRestore?.(item.id)}
                        >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Restore
                        </Button>
                    )}

                    {/* Overflow */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="ml-auto h-8 w-8 flex-shrink-0"
                                aria-label="More actions"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                                onClick={() => onDelete?.(item.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete permanently
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
