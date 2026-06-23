'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SourceLeaderboard } from '@/components/platform/content/monitor/source-leaderboard';
import type { SourceStats } from '@/types/platform/source';

interface SourceOutputChartProps {
    stats?: SourceStats;
    isLoading: boolean;
}

const newsHref = (name: string) =>
    `/platform/news?view=library&source_name=${encodeURIComponent(name)}`;
const mediaHref = (name: string) => `/platform/media?source_name=${encodeURIComponent(name)}`;

/**
 * Top sources by output — horizontal bar leaderboard with a ready/failed split,
 * sorted by volume. Surfaces the heaviest producers and where failures cluster.
 * Fed by the stats endpoint (needs the content_items join).
 */
export function SourceOutputChart({ stats, isLoading }: SourceOutputChartProps) {
    const { rows, buildHref } = useMemo(() => {
        const top = stats?.top_sources ?? [];
        const category = new Map(top.map((s) => [s.name, s.category]));
        return {
            rows: top.map((s) => ({
                source_name: s.name,
                count: s.items,
                ready: s.ready,
                failed: s.failed,
            })),
            buildHref: (name: string) =>
                category.get(name) === 'media' ? mediaHref(name) : newsHref(name),
        };
    }, [stats?.top_sources]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Top sources by output</CardTitle>
                <p className="text-xs text-muted-foreground">Items produced · ready / failed split</p>
            </CardHeader>
            <CardContent>
                {isLoading && !stats ? (
                    <Skeleton className="h-40 w-full" />
                ) : (
                    <SourceLeaderboard sources={rows} buildHref={buildHref} />
                )}
            </CardContent>
        </Card>
    );
}
