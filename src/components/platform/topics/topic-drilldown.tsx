'use client';

import { FileText, Newspaper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopicDrilldown } from '@/hooks/use-topics';
import type { TopicMappedItem, TopicMappedStory } from '@/types/platform/topics';

function ScoreBar({ score }: { score: number }) {
    const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">{score.toFixed(2)}</span>
        </div>
    );
}

export function TopicDrilldown({ topicId }: { topicId: string | null }) {
    const drill = useTopicDrilldown(topicId);

    if (drill.isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                ))}
            </div>
        );
    }
    if (drill.isError || !drill.data) {
        return <p className="text-sm text-destructive">Failed to load mapped content.</p>;
    }

    const { mapped_items, mapped_stories, item_count, story_count } = drill.data;

    return (
        <div className="space-y-5">
            <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Mapped content items
                    <span className="tabular-nums">({item_count})</span>
                </div>
                {mapped_items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No content items mapped yet.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {mapped_items.map((it: TopicMappedItem) => (
                            <li key={it.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                                <div className="min-w-0">
                                    <div className="truncate text-sm">{it.title || <span className="text-muted-foreground">Untitled</span>}</div>
                                    <div className="text-[11px] uppercase text-muted-foreground">{it.type}</div>
                                </div>
                                <ScoreBar score={it.score} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Newspaper className="h-3.5 w-3.5" /> Mapped stories
                    <span className="tabular-nums">({story_count})</span>
                </div>
                {mapped_stories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stories mapped yet.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {mapped_stories.map((s: TopicMappedStory) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                                <div className="truncate text-sm">{s.label || <span className="text-muted-foreground">Unlabeled</span>}</div>
                                <ScoreBar score={s.score} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
