'use client';

import { cn } from '@/lib/utils';
import type { BucketDemand, ObservatorySnapshot } from '@/types/platform/intelligence';
import type { TopicDemand } from '@/types/platform/media-circulation';

interface DemandEconomicsProps {
    snapshot?: ObservatorySnapshot;
}

const DEMAND = '#7dd3fc'; // what listeners pull on
const COVERAGE = '#e0a92e'; // what the library holds (value-weighted)

/**
 * Demand economics — the cache's supply-vs-demand ledger. Per duration bucket
 * and per topic: what listeners pull on (demand) against what the library
 * actually holds (value-weighted coverage). Where demand overhangs coverage the
 * gap is warm-lit — those shelves are starving and pull intake toward them.
 */
export function DemandEconomics({ snapshot }: DemandEconomicsProps) {
    const buckets = snapshot?.bucket_demand ?? [];
    const measured = snapshot?.demand_measured ?? false;
    const topics = [...(snapshot?.topic_demand ?? [])].sort((a, b) => b.gap - a.gap).slice(0, 8);

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h2 className="font-editorial text-sm font-semibold">Supply &amp; demand</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        What listeners pull on vs what the library holds. A warm gap = a starving shelf.
                    </p>
                </div>
                <span
                    className={cn(
                        'rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                        measured
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'border-border text-muted-foreground'
                    )}
                >
                    {measured ? 'measured' : 'estimated'}
                </span>
            </div>

            {/* By duration bucket */}
            <div className="mt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">By duration</p>
                <div className="space-y-2.5">
                    {buckets.map((b) => (
                        <BucketRow key={b.bucket} b={b} />
                    ))}
                </div>
            </div>

            {/* By topic */}
            {topics.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Most under-supplied topics
                    </p>
                    <div className="space-y-2">
                        {topics.map((t) => (
                            <TopicRow key={t.topic} t={t} />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: DEMAND }} /> demand
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: COVERAGE }} /> coverage
                </span>
            </div>
        </section>
    );
}

function GapChip({ gap }: { gap: number }) {
    const pct = Math.round(gap * 100);
    const under = pct > 8;
    const over = pct < -8;
    return (
        <span
            className={cn(
                'w-12 shrink-0 text-right font-mono text-xs font-semibold tabular-nums',
                under ? 'text-news' : over ? 'text-muted-foreground' : 'text-foreground'
            )}
        >
            {pct > 0 ? '+' : ''}
            {pct}
        </span>
    );
}

function PairedBars({ demand, coverage }: { demand: number; coverage: number }) {
    return (
        <div className="min-w-0 flex-1 space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${clamp(demand)}%`, background: DEMAND }} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${clamp(coverage)}%`, background: COVERAGE }} />
            </div>
        </div>
    );
}

function BucketRow({ b }: { b: BucketDemand }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-9 shrink-0 font-mono text-xs font-semibold text-foreground">{b.bucket}</span>
            <PairedBars demand={b.demand_score * 100} coverage={b.coverage_score * 100} />
            <GapChip gap={b.gap} />
        </div>
    );
}

function TopicRow({ t }: { t: TopicDemand }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium" dir="auto" title={t.topic}>
                {t.topic}
            </span>
            <PairedBars demand={t.demand_score * 100} coverage={t.coverage_score * 100} />
            <GapChip gap={t.gap} />
        </div>
    );
}

function clamp(v: number) {
    return Math.min(100, Math.max(2, v));
}
