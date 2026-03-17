'use client';

import type { TypeEmbedStat } from '@/types/platform/intelligence';

interface EmbeddingCoverageStatsProps {
    data: TypeEmbedStat[];
}

export function EmbeddingCoverageStats({ data }: EmbeddingCoverageStatsProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No embedding data available
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((stat) => {
                const pct = stat.total > 0 ? Math.round((stat.with_embedding / stat.total) * 100) : 0;
                return (
                    <div key={stat.type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{stat.type}</span>
                            <span className="text-muted-foreground tabular-nums">
                                {stat.with_embedding}/{stat.total} ({pct}%)
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
