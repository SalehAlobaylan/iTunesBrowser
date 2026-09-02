'use client';

import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber, formatRelativeTime } from '@/lib/utils/format';
import { sourceHealth } from '@/lib/sources/health';
import type { ContentSource, SourceHealth } from '@/types/platform/source';

import { HEALTH_BG, HEALTH_LABELS, HEALTH_ORDER, HEALTH_TEXT } from '../shared/health-meta';

interface FleetStatRibbonProps {
    sources: ContentSource[];
    isLoading: boolean;
    lastUpdated: Date | null;
    isRefreshing: boolean;
}

/**
 * Slim fleet summary: total sources + a single stacked health ribbon with inline
 * counts and a live freshness pulse. Replaces a 6-card KPI band with one
 * glanceable composition bar.
 */
export function FleetStatRibbon({
    sources,
    isLoading,
    lastUpdated,
    isRefreshing,
}: FleetStatRibbonProps) {
    const { total, counts } = useMemo(() => {
        const counts: Record<SourceHealth, number> = {
            active: 0,
            healthy: 0,
            stale: 0,
            never_run: 0,
            disabled: 0,
        };
        for (const s of sources) counts[sourceHealth(s).status] += 1;
        return { total: sources.length, counts };
    }, [sources]);

    if (isLoading && sources.length === 0) {
        return <Skeleton className="h-[92px] w-full" />;
    }

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* Total */}
                <div className="flex shrink-0 items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums">{formatNumber(total)}</span>
                    <span className="text-sm text-muted-foreground">sources</span>
                </div>

                {/* Stacked health ribbon */}
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        {total > 0 &&
                            HEALTH_ORDER.map((h) => {
                                const value = counts[h];
                                if (value === 0) return null;
                                return (
                                    <div
                                        key={h}
                                        className={HEALTH_BG[h]}
                                        style={{ width: `${(value / total) * 100}%` }}
                                        title={`${HEALTH_LABELS[h]}: ${formatNumber(value)}`}
                                    />
                                );
                            })}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {HEALTH_ORDER.map((h) => (
                            <span key={h} className="flex items-center gap-1.5 text-xs">
                                <span className={cn('h-2 w-2 rounded-sm', HEALTH_BG[h])} />
                                <span className="text-muted-foreground">{HEALTH_LABELS[h]}</span>
                                <span className={cn('font-mono tabular-nums', HEALTH_TEXT[h])}>
                                    {formatNumber(counts[h])}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Live freshness pulse */}
                {lastUpdated && (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                isRefreshing ? 'animate-pulse bg-info motion-reduce:animate-none' : 'bg-success'
                            )}
                        />
                        Updated {formatRelativeTime(lastUpdated)}
                    </span>
                )}
            </CardContent>
        </Card>
    );
}
