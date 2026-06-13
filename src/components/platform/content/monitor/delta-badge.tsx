'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface DeltaBadgeProps {
    /** Current period value. */
    current: number;
    /** Prior period value (same window length, immediately before). */
    previous: number;
    /** Title hint, e.g. 'vs prior 7 days'. */
    title?: string;
}

// Week-over-week (or period-over-period) delta. Only meaningful for flow metrics
// like new-item ingestion — never for cumulative status counts.
export function DeltaBadge({ current, previous, title }: DeltaBadgeProps) {
    // No prior baseline → nothing honest to show.
    if (previous <= 0) {
        if (current <= 0) return null;
        return (
            <span
                className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success"
                title={title}
            >
                <ArrowUpRight className="h-3 w-3" />
                new
            </span>
        );
    }

    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) {
        return (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground" title={title}>
                <Minus className="h-3 w-3" />
                0%
            </span>
        );
    }

    const up = pct > 0;
    const tone = up ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive';
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tone}`} title={title}>
            <Icon className="h-3 w-3" />
            {Math.abs(pct)}%
        </span>
    );
}
