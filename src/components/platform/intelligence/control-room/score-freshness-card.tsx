'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type { IntelligenceDiagnostics } from '@/types/platform/media-circulation';

/**
 * Score freshness — how much of the media corpus is scored, how stale the
 * scores are, and the corpus-coverage bar. Read-only; the "refresh scores now"
 * action lives on the hub hero.
 */
export function ScoreFreshnessCard({ diagnostics: d }: { diagnostics: IntelligenceDiagnostics }) {
    const totalTracked = d.scored_count + d.unscored_count;
    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Score freshness
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
                Scores recompute in bounded batches: stale-first on a heartbeat, nudged by interaction deltas, and
                on demand when circulation decides.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FreshnessStat label="Scored" value={d.scored_count} />
                <FreshnessStat
                    label="Unscored"
                    value={d.unscored_count}
                    accent={d.unscored_count > 0 ? 'text-sky-600 dark:text-sky-300' : undefined}
                />
                <FreshnessStat
                    label="Stale"
                    value={d.stale_count}
                    accent={d.stale_count > 0 ? 'text-amber-600 dark:text-amber-300' : undefined}
                />
                <div className="rounded-lg border border-border bg-background p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Oldest</p>
                    <p className="mt-1 truncate text-sm font-medium">
                        {d.oldest_computed_at ? formatRelativeTime(d.oldest_computed_at) : '—'}
                    </p>
                </div>
            </div>
            {totalTracked > 0 && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>corpus coverage</span>
                        <span className="tabular-nums">{Math.round((d.scored_count / totalTracked) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-news transition-all duration-500"
                            style={{ width: `${Math.max(2, (d.scored_count / totalTracked) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

function FreshnessStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={cn('mt-1 text-lg font-semibold tabular-nums', accent)}>{value.toLocaleString()}</p>
        </div>
    );
}
