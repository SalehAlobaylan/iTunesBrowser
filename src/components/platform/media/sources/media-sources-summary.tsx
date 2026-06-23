'use client';

import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/format';
import { sourceHealth } from '@/lib/sources/health';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceHealth, SourceType } from '@/types/platform/source';
import {
    HEALTH_BG,
    HEALTH_LABELS,
    HEALTH_ORDER,
    HEALTH_TEXT,
} from '@/components/platform/sources/shared/health-meta';

interface MediaSourcesSummaryProps {
    sources: ContentSource[];
    isLoading: boolean;
}

const typeLabel = (key: string) =>
    SOURCE_TYPE_LABELS[key as SourceType] ?? key.charAt(0) + key.slice(1).toLowerCase();

/**
 * Media roster summary — total + a stacked health ribbon and per-type chips.
 * Computed from the loaded media sources so the numbers match the gallery exactly.
 */
export function MediaSourcesSummary({ sources, isLoading }: MediaSourcesSummaryProps) {
    const { total, health, types } = useMemo(() => {
        const health: Record<SourceHealth, number> = {
            healthy: 0,
            stale: 0,
            never_run: 0,
            disabled: 0,
        };
        const types = new Map<string, number>();
        for (const s of sources) {
            health[sourceHealth(s).status] += 1;
            types.set(s.type, (types.get(s.type) ?? 0) + 1);
        }
        return {
            total: sources.length,
            health,
            types: Array.from(types.entries()).sort((a, b) => b[1] - a[1]),
        };
    }, [sources]);

    if (isLoading && sources.length === 0) {
        return <Skeleton className="h-[104px] w-full" />;
    }

    return (
        <Card>
            <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                {/* Total */}
                <div className="shrink-0">
                    <div className="text-3xl font-semibold tabular-nums">{formatNumber(total)}</div>
                    <div className="text-xs text-muted-foreground">media sources</div>
                </div>

                {/* Health ribbon */}
                <div className="min-w-0 flex-1 space-y-2 lg:border-l lg:pl-5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        {total > 0 &&
                            HEALTH_ORDER.map((h) => {
                                const value = health[h];
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
                                    {formatNumber(health[h])}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Type chips */}
                <div className="flex flex-wrap gap-2 lg:border-l lg:pl-5">
                    {types.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No sources yet</span>
                    ) : (
                        types.map(([type, count]) => (
                            <span
                                key={type}
                                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                            >
                                <span className="font-medium">{typeLabel(type)}</span>
                                <span className="font-mono tabular-nums text-muted-foreground">
                                    {formatNumber(count)}
                                </span>
                            </span>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
