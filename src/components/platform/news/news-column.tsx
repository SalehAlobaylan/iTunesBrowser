'use client';

import type { ReactNode } from 'react';
import { Search, Newspaper } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NewsCard } from '@/components/platform/news/news-card';
import type { NewsItem, NewsView } from '@/types/platform/news';

interface NewsColumnProps {
    title: string;
    view: NewsView;
    accentClass?: string;
    total: number;
    items: NewsItem[];
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    search: string;
    onSearch: (v: string) => void;
    showSearch?: boolean;
    headerAction?: ReactNode;
    emptyHint: string;
    featuredIds?: Set<string>;
    busy?: boolean;
    onPublish?: (id: string) => void;
    onArchive?: (id: string) => void;
    onRestore?: (id: string) => void;
    onToggleFeature?: (id: string, on: boolean) => void;
    onDelete?: (id: string) => void;
}

export function NewsColumn({
    title,
    view,
    accentClass = 'bg-muted-foreground',
    total,
    items,
    isLoading,
    isError,
    hasMore,
    onLoadMore,
    search,
    onSearch,
    showSearch = false,
    headerAction,
    emptyHint,
    featuredIds,
    busy,
    onPublish,
    onArchive,
    onRestore,
    onToggleFeature,
    onDelete,
}: NewsColumnProps) {
    return (
        <div className="flex min-h-[24rem] flex-col rounded-lg border bg-muted/30">
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <span className={cn('h-2 w-2 rounded-full', accentClass)} />
                <h2 className="text-sm font-semibold">{title}</h2>
                <Badge variant="secondary" className="tabular-nums">
                    {total}
                </Badge>
                <div className="ml-auto">{headerAction}</div>
            </div>

            {/* Search */}
            {showSearch && (
                <div className="border-b p-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder="Search…"
                            className="h-9 pl-9"
                        />
                    </div>
                </div>
            )}

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2 lg:max-h-[calc(100vh-22rem)]">
                {isError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-center text-sm text-destructive">
                        Failed to load.
                    </div>
                ) : isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-sm text-muted-foreground">
                        <Newspaper className="mb-2 h-6 w-6 opacity-40" />
                        {emptyHint}
                    </div>
                ) : (
                    <>
                        {items.map((item) => (
                            <NewsCard
                                key={item.id}
                                item={item}
                                view={view}
                                featured={featuredIds?.has(item.id)}
                                busy={busy}
                                onPublish={onPublish}
                                onArchive={onArchive}
                                onRestore={onRestore}
                                onToggleFeature={onToggleFeature}
                                onDelete={onDelete}
                            />
                        ))}
                        {hasMore && (
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={onLoadMore}
                                disabled={isLoading}
                            >
                                Load more
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
