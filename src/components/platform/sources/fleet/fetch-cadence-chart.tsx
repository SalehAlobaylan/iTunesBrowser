'use client';

import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/format';
import type { ContentSource } from '@/types/platform/source';

interface FetchCadenceChartProps {
    sources: ContentSource[];
    isLoading: boolean;
}

// Fetch-interval buckets, coarsest scheduling at the right. Order matters.
const BUCKETS: { label: string; test: (m: number) => boolean }[] = [
    { label: '≤15m', test: (m) => m <= 15 },
    { label: '30m', test: (m) => m > 15 && m <= 30 },
    { label: '1h', test: (m) => m > 30 && m <= 60 },
    { label: '6h', test: (m) => m > 60 && m <= 360 },
    { label: '12h', test: (m) => m > 360 && m <= 720 },
    { label: '24h+', test: (m) => m > 720 },
];

/**
 * Fetch cadence — a histogram of how aggressively sources are scheduled. Helps
 * spot over-eager polling or sources left on a slow default. Y starts at 0.
 */
export function FetchCadenceChart({ sources, isLoading }: FetchCadenceChartProps) {
    const data = useMemo(
        () =>
            BUCKETS.map((b) => ({
                label: b.label,
                count: sources.filter((s) => b.test(s.fetch_interval_minutes)).length,
            })),
        [sources]
    );
    const hasData = data.some((d) => d.count > 0);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Fetch cadence</CardTitle>
                <p className="text-xs text-muted-foreground">Sources per scheduling interval</p>
            </CardHeader>
            <CardContent>
                {isLoading && sources.length === 0 ? (
                    <Skeleton className="h-[200px] w-full" />
                ) : !hasData ? (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                        No sources yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                allowDecimals={false}
                                width={40}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} content={<CadenceTooltip />} />
                            <Bar dataKey="count" name="Sources" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

function CadenceTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
            <div className="mb-1 font-medium text-popover-foreground">Every {label}</div>
            <div className="flex items-center justify-between gap-4 text-popover-foreground">
                <span className="text-muted-foreground">Sources</span>
                <span className="font-mono tabular-nums">
                    {formatNumber(Number(payload[0].value) || 0)}
                </span>
            </div>
        </div>
    );
}
