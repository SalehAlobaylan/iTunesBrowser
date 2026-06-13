'use client';

import { AlertTriangle, Clock3, Timer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatRelativeTime } from '@/lib/utils/format';
import type { ContentStats } from '@/types/platform/content';

interface PipelineHealthCardProps {
    stats?: ContentStats;
    isLoading: boolean;
}

export function PipelineHealthCard({ stats, isLoading }: PipelineHealthCardProps) {
    const freshness = stats?.freshness;
    const reasons = stats?.failure_reasons ?? [];
    const maxReason = Math.max(...reasons.map((r) => r.count), 1);

    return (
        <Card>
            <CardHeader className="pb-2">
                <p className="brand-overline text-muted-foreground">Pipeline</p>
                <CardTitle className="text-base">Health &amp; freshness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && !stats ? (
                    <Skeleton className="h-40 w-full" />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border p-3">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    <span className="text-[10px] uppercase tracking-wide">Oldest unprocessed</span>
                                </div>
                                <div className="mt-1 text-sm font-semibold">
                                    {freshness?.oldest_unprocessed
                                        ? formatRelativeTime(freshness.oldest_unprocessed)
                                        : '—'}
                                </div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Timer className="h-3.5 w-3.5" />
                                    <span className="text-[10px] uppercase tracking-wide">
                                        Stuck &gt; {freshness?.stuck_threshold_hours ?? 24}h
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-sm font-semibold tabular-nums">
                                        {formatNumber(freshness?.stuck_count ?? 0)}
                                    </span>
                                    {(freshness?.stuck_count ?? 0) > 0 && (
                                        <Badge variant="warning">needs attention</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 border-t pt-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Top failure reasons
                            </div>
                            {reasons.length === 0 ? (
                                <div className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                                    No failures recorded.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {reasons.map((r) => (
                                        <div key={r.reason} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="truncate" title={r.reason}>{r.reason}</span>
                                                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                                                    {formatNumber(r.count)}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full bg-destructive"
                                                    style={{ width: `${(r.count / maxReason) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
