'use client';

import { Compass, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntelligenceDiagnostics } from '@/types/platform/media-circulation';

/**
 * Exploration pipeline — how many media items are still earning their exposure
 * vs established, and how many carry an active soft-eviction demotion. Read-only
 * observability for the media-value engine.
 */
export function ExplorationPipelineCard({ diagnostics: d }: { diagnostics: IntelligenceDiagnostics }) {
    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Compass className="h-3.5 w-3.5" />
                Exploration pipeline
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
                Items start <span className="font-medium">exploring</span> — protected from rank-down and purge —
                until enough impressions establish their value.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PipelineStat label="Exploring" value={d.exploring_count} accent="text-sky-600 dark:text-sky-300" />
                <PipelineStat label="Established" value={d.established_count} accent="text-emerald-600 dark:text-emerald-300" />
                <PipelineStat label="Re-trial" value={d.retrial_count} />
                <PipelineStat
                    label="Demoted"
                    value={d.demoted_count}
                    accent={d.demoted_count > 0 ? 'text-amber-600 dark:text-amber-300' : undefined}
                    icon={TrendingDown}
                />
            </div>
        </section>
    );
}

function PipelineStat({
    label,
    value,
    accent,
    icon: Icon,
}: {
    label: string;
    value: number;
    accent?: string;
    icon?: typeof TrendingDown;
}) {
    return (
        <div className="rounded-lg border border-border bg-background p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </p>
            <p className={cn('mt-1 text-lg font-semibold tabular-nums', accent)}>{value.toLocaleString()}</p>
        </div>
    );
}
