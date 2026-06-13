'use client';

import { format, parseISO } from 'date-fns';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/format';
import type { ContentDailyPoint } from '@/types/platform/content';

const RANGES = [7, 30, 90];

interface IngestionVelocityChartProps {
    daily: ContentDailyPoint[];
    rangeDays: number;
    onRangeChange: (days: number) => void;
    isLoading: boolean;
}

export function IngestionVelocityChart({
    daily,
    rangeDays,
    onRangeChange,
    isLoading,
}: IngestionVelocityChartProps) {
    const data = daily.map((point) => ({
        label: safeLabel(point.day),
        succeeded: Math.max(0, point.count - point.failed),
        failed: point.failed,
        total: point.count,
    }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                    <p className="brand-overline text-muted-foreground">Pipeline</p>
                    <CardTitle className="text-base">Ingestion velocity</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    {RANGES.map((r) => (
                        <Button
                            key={r}
                            size="sm"
                            variant={r === rangeDays ? 'default' : 'outline'}
                            onClick={() => onRangeChange(r)}
                            className="h-7 px-2.5 text-xs"
                        >
                            {r}d
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-[260px] w-full" />
                ) : data.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                        No items ingested in this window.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillSucceeded" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.45} />
                                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0.04} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={40} tickLine={false} axisLine={false} />
                            <Tooltip content={<VelocityTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="succeeded"
                                name="Succeeded"
                                stackId="1"
                                stroke="hsl(var(--gold))"
                                strokeWidth={2}
                                fill="url(#fillSucceeded)"
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                name="Failed"
                                stackId="1"
                                stroke="hsl(var(--destructive))"
                                strokeWidth={1.5}
                                fill="hsl(var(--destructive))"
                                fillOpacity={0.2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

function safeLabel(day: string): string {
    try {
        return format(parseISO(day), 'MMM d');
    } catch {
        return day;
    }
}

function VelocityTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
            <div className="mb-1 font-medium text-popover-foreground">{label}</div>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                    </span>
                    <span className="font-mono tabular-nums text-popover-foreground">
                        {formatNumber(Number(entry.value) || 0)}
                    </span>
                </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-4 border-t pt-1 text-popover-foreground">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatNumber(total)}</span>
            </div>
        </div>
    );
}
