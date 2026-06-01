'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { useFeaturedIds } from '@/hooks/use-news';
import { NewsColumn } from '@/components/platform/news/news-column';
import { MoveToTopicDialog } from '@/components/platform/news/move-to-topic-dialog';
import type { BulkSelection, TopicSelection } from '@/types/platform/news';

export function NewsBoard({ topic }: { topic: TopicSelection }) {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [move, setMove] = useState<{ selection: BulkSelection; count: number } | null>(null);

    const featured = useFeaturedIds();
    const featuredIds = featured.data ?? new Set<string>();

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    const onMove = (selection: BulkSelection, count: number) => setMove({ selection, count });

    return (
        <div className="space-y-3">
            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search headlines…"
                    className="pl-9"
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                <NewsColumn
                    topicId={topic.id}
                    status="PENDING"
                    title="Queue"
                    accent="bg-blue-500"
                    search={debounced}
                    featuredIds={featuredIds}
                    onMove={onMove}
                />
                <NewsColumn
                    topicId={topic.id}
                    status="READY"
                    title="Live"
                    accent="bg-emerald-500"
                    search={debounced}
                    featuredIds={featuredIds}
                    onMove={onMove}
                />
                <NewsColumn
                    topicId={topic.id}
                    status="ARCHIVED"
                    title="Archived"
                    accent="bg-slate-400"
                    search={debounced}
                    featuredIds={featuredIds}
                    onMove={onMove}
                />
            </div>

            <MoveToTopicDialog
                selection={move?.selection ?? null}
                count={move?.count ?? 0}
                onClose={() => setMove(null)}
            />
        </div>
    );
}
