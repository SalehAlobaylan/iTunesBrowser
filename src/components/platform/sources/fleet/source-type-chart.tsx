'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/format';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceType } from '@/types/platform/source';

interface SourceTypeChartProps {
    sources: ContentSource[];
    isLoading: boolean;
}

const typeLabel = (key: string) =>
    SOURCE_TYPE_LABELS[key as SourceType] ?? key.charAt(0) + key.slice(1).toLowerCase();

/**
 * Sources by type — a sorted horizontal bar chart (CSS bars). Sorted by value
 * with counts labeled directly (data-viz: bars not pie, sort by value, label).
 */
export function SourceTypeChart({ sources, isLoading }: SourceTypeChartProps) {
    const entries = useMemo(() => {
        const counts = new Map<string, number>();
        for (const s of sources) counts.set(s.type, (counts.get(s.type) ?? 0) + 1);
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [sources]);
    const max = Math.max(...entries.map(([, c]) => c), 1);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Sources by type</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && sources.length === 0 ? (
                    <Skeleton className="h-40 w-full" />
                ) : entries.length === 0 ? (
                    <Empty />
                ) : (
                    <div className="space-y-3">
                        {entries.map(([type, count]) => (
                            <div key={type} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{typeLabel(type)}</span>
                                    <span className="font-mono tabular-nums text-muted-foreground">
                                        {formatNumber(count)}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gold"
                                        style={{ width: `${(count / max) * 100}%`, minWidth: '4px' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Empty() {
    return (
        <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No sources yet.
        </div>
    );
}
