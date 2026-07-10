'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PreferenceFlipGate, PreferenceSnapshot } from '@/types/platform/preference-autopilot';

const GATE_COLOR: Record<string, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-primary',
    red: 'bg-destructive',
};

// CoverageBar renders a mapped-coverage percentage with a floor marker so an admin
// can read the flip gate at a glance.
function CoverageBar({ label, gate }: { label: string; gate?: PreferenceFlipGate }) {
    const pct = gate ? Math.min(100, Math.max(0, gate.coverage_pct)) : 0;
    const floor = gate?.floor_pct ?? 0;
    const state = gate?.state ?? 'red';
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                    {label}
                    {gate?.enabled ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            live
                        </span>
                    ) : (
                        <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            off
                        </span>
                    )}
                </span>
                <span className="tabular-nums font-medium">{pct.toFixed(0)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', GATE_COLOR[state])} style={{ width: `${pct}%` }} />
                {/* Floor marker */}
                <div className="absolute top-[-2px] h-3 w-0.5 bg-foreground/50" style={{ left: `${Math.min(100, floor)}%` }} title={`floor ${floor}%`} />
            </div>
            <div className="text-[11px] text-muted-foreground">
                floor {floor}% ·{' '}
                <span
                    className={cn(
                        state === 'green' && 'text-emerald-500',
                        state === 'amber' && 'text-primary',
                        state === 'red' && 'text-destructive'
                    )}
                >
                    {state}
                </span>
            </div>
        </div>
    );
}

function IntegrityRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="flex items-center gap-2 text-sm">
                {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {label}
            </span>
            <span className={cn('text-xs tabular-nums', ok ? 'text-muted-foreground' : 'text-destructive')}>{detail}</span>
        </div>
    );
}

export function AutopilotHealth({ snapshot }: { snapshot?: PreferenceSnapshot | null }) {
    if (!snapshot) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Is it healthy?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    No completed run yet — run the Autopilot to compute a coverage &amp; integrity snapshot.
                </CardContent>
            </Card>
        );
    }
    const foryou = snapshot.flip_gates?.foryou_enabled;
    const news = snapshot.flip_gates?.news_enabled;
    const boostOk = snapshot.boost_sanity === 'ok';
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Is it healthy?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <CoverageBar label="For You mapping" gate={foryou} />
                    <CoverageBar label="News mapping" gate={news} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <IntegrityRow
                        ok={snapshot.mute_violations === 0}
                        label="Mute integrity"
                        detail={snapshot.mute_violations === 0 ? 'clean' : `${snapshot.mute_violations} in affinity`}
                    />
                    <IntegrityRow
                        ok={snapshot.null_centroid_topics === 0}
                        label="Topic centroids"
                        detail={snapshot.null_centroid_topics === 0 ? 'all present' : `${snapshot.null_centroid_topics} NULL`}
                    />
                    <IntegrityRow
                        ok={boostOk}
                        label="Boost sanity"
                        detail={boostOk ? `${snapshot.boosted_serves}/${snapshot.total_serves} serves` : 'no data yet'}
                    />
                    <IntegrityRow
                        ok={snapshot.recompute_queue_depth === 0}
                        label="Recompute queue"
                        detail={snapshot.recompute_queue_depth === 0 ? 'drained' : `${snapshot.recompute_queue_depth} queued`}
                    />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <MiniStat label="Story coverage" value={`${snapshot.story_coverage_pct.toFixed(0)}%`} />
                    <MiniStat label="Unmapped backlog" value={snapshot.unmapped_backlog.toLocaleString()} />
                    <MiniStat label="Active topics" value={snapshot.active_topics.toLocaleString()} />
                </div>
            </CardContent>
        </Card>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2">
            <div className="text-lg font-semibold tabular-nums">{value}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
    );
}
