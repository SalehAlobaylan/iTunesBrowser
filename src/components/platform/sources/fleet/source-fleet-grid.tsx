'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/format';
import { sourceHealth } from '@/lib/sources/health';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceHealth, SourceType } from '@/types/platform/source';
import type { HealthFilter, TypeFilter } from '@/components/platform/sources/list/use-list-query-state';

import { HEALTH_BG, HEALTH_LABELS, HEALTH_ORDER } from '../shared/health-meta';

interface SourceFleetGridProps {
    sources: ContentSource[];
    isLoading: boolean;
    activeType: TypeFilter;
    activeHealth: HealthFilter;
    onSelectType: (type: TypeFilter) => void;
    onSelectHealth: (health: HealthFilter) => void;
    /** Where tile clicks return to after editing (the editor `from` param). */
    returnTo: string;
}

const typeLabel = (key: string) =>
    SOURCE_TYPE_LABELS[key as SourceType] ?? key.charAt(0) + key.slice(1).toLowerCase();

/**
 * The Fleet Grid — the page's signature. Every source is a health-colored tile,
 * grouped into per-type lanes; overdue tiles pulse. Click a tile to edit; click a
 * lane header or a legend swatch to cross-filter the management table below.
 */
export function SourceFleetGrid({
    sources,
    isLoading,
    activeType,
    activeHealth,
    onSelectType,
    onSelectHealth,
    returnTo,
}: SourceFleetGridProps) {
    const lanes = useMemo(() => {
        const byType = new Map<string, { source: ContentSource; health: SourceHealth }[]>();
        for (const s of sources) {
            const health = sourceHealth(s).status;
            const arr = byType.get(s.type) ?? [];
            arr.push({ source: s, health });
            byType.set(s.type, arr);
        }
        return Array.from(byType.entries())
            .map(([type, items]) => ({
                type,
                // Surface unhealthy tiles first within a lane.
                items: items.sort(
                    (a, b) => HEALTH_ORDER.indexOf(b.health) - HEALTH_ORDER.indexOf(a.health)
                ),
            }))
            .sort((a, b) => b.items.length - a.items.length);
    }, [sources]);

    return (
        <Card className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gold" aria-hidden />
            <CardHeader className="flex flex-row items-end justify-between gap-3 space-y-0 pb-3">
                <div>
                    <p className="brand-overline text-gold">Fleet map</p>
                    <h2 className="text-lg font-semibold tracking-tight">The ingestion fleet</h2>
                </div>
                <Legend activeHealth={activeHealth} onSelectHealth={onSelectHealth} />
            </CardHeader>
            <CardContent>
                {isLoading && sources.length === 0 ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        ))}
                    </div>
                ) : lanes.length === 0 ? (
                    <div className="rounded-md border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                        No sources yet. Add one to start ingesting.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lanes.map((lane) => {
                            const isActiveLane = activeType === lane.type;
                            return (
                                <div
                                    key={lane.type}
                                    className={cn(
                                        'rounded-md border p-2.5 transition-colors',
                                        isActiveLane ? 'border-gold/60 bg-gold/5' : 'border-transparent'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onSelectType(isActiveLane ? 'all' : (lane.type as TypeFilter))
                                        }
                                        className="mb-2 flex w-full items-center justify-between text-left"
                                        title={`Filter table to ${typeLabel(lane.type)}`}
                                    >
                                        <span
                                            className={cn(
                                                'text-xs font-medium uppercase tracking-wide',
                                                isActiveLane ? 'text-gold' : 'text-muted-foreground'
                                            )}
                                        >
                                            {typeLabel(lane.type)}
                                        </span>
                                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                            {formatNumber(lane.items.length)}
                                        </span>
                                    </button>
                                    <div className="flex flex-wrap gap-1">
                                        {lane.items.map(({ source, health }) => (
                                            <Tile
                                                key={source.id}
                                                source={source}
                                                health={health}
                                                dimmed={activeHealth !== 'all' && activeHealth !== health}
                                                returnTo={returnTo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Tile({
    source,
    health,
    dimmed,
    returnTo,
}: {
    source: ContentSource;
    health: SourceHealth;
    dimmed: boolean;
    returnTo: string;
}) {
    const last = source.last_fetched_at
        ? `fetched ${formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })}`
        : 'never fetched';
    return (
        <Link
            href={`/platform/sources/${source.id}?from=${encodeURIComponent(returnTo)}`}
            title={`${source.name} · ${HEALTH_LABELS[health]} · ${last}`}
            aria-label={`${source.name} — ${HEALTH_LABELS[health]}`}
            className={cn(
                'h-4 w-4 rounded-sm ring-offset-background transition-all hover:scale-125 hover:ring-2 hover:ring-ring focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                HEALTH_BG[health],
                health === 'stale' && 'animate-pulse motion-reduce:animate-none',
                dimmed && 'opacity-20'
            )}
        />
    );
}

function Legend({
    activeHealth,
    onSelectHealth,
}: {
    activeHealth: HealthFilter;
    onSelectHealth: (health: HealthFilter) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {HEALTH_ORDER.map((h) => {
                const active = activeHealth === h;
                return (
                    <button
                        key={h}
                        type="button"
                        onClick={() => onSelectHealth(active ? 'all' : h)}
                        title={`Filter table to ${HEALTH_LABELS[h]}`}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs transition-colors',
                            active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
                        )}
                    >
                        <span className={cn('h-2.5 w-2.5 rounded-sm', HEALTH_BG[h])} />
                        {HEALTH_LABELS[h]}
                    </button>
                );
            })}
        </div>
    );
}
