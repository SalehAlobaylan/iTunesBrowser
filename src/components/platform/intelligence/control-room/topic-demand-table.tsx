'use client';

import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntelligenceDiagnostics, TopicDemand } from '@/types/platform/media-circulation';

/**
 * Topic demand — what listeners pull on vs what the library holds, measured from
 * real serves over the last 7 days. A positive gap = under-supplied topic. This
 * is the D5-C measured-demand surface (per-topic axis).
 */
export function TopicDemandTable({ diagnostics: d }: { diagnostics: IntelligenceDiagnostics }) {
    return (
        <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border p-4">
                <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                        <Gauge className="h-4 w-4 text-news" />
                        Topic demand
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        What listeners pull on vs what the library holds, measured from real serves over the last 7
                        days. A positive gap = under-supplied topic.
                    </p>
                </div>
            </div>
            {d.topic_demand.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                    No topic telemetry yet — it accumulates as the Pods feed serves tagged media.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-4 py-2 font-semibold">Topic</th>
                                <th className="px-3 py-2 text-right font-semibold">Serves</th>
                                <th className="px-3 py-2 text-right font-semibold">Repeats</th>
                                <th className="px-3 py-2 text-right font-semibold">Units</th>
                                <th className="px-3 py-2 font-semibold">Demand vs coverage</th>
                                <th className="px-4 py-2 text-right font-semibold">Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {d.topic_demand.map((row) => (
                                <TopicRow key={row.topic} row={row} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function TopicRow({ row }: { row: TopicDemand }) {
    const demandW = Math.min(100, Math.max(2, row.demand_score * 100));
    const coverageW = Math.min(100, Math.max(2, row.coverage_score * 100));
    const gapPct = Math.round(row.gap * 100);
    return (
        <tr className="border-b border-border/60 last:border-0">
            <td className="max-w-[220px] truncate px-4 py-2.5 font-medium" dir="auto">
                {row.topic}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.serves.toLocaleString()}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.repeat_serves.toLocaleString()}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.visible_units.toLocaleString()}</td>
            <td className="min-w-[160px] px-3 py-2.5">
                <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-slate-400/80" style={{ width: `${demandW}%` }} />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${coverageW}%` }} />
                    </div>
                </div>
            </td>
            <td
                className={cn(
                    'px-4 py-2.5 text-right font-medium tabular-nums',
                    gapPct > 25 ? 'text-news' : gapPct < -25 ? 'text-muted-foreground' : undefined
                )}
            >
                {gapPct > 0 ? '+' : ''}
                {gapPct}
            </td>
        </tr>
    );
}
