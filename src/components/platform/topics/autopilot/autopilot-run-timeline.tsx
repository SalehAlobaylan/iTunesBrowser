'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePreferenceAutopilotRunActions } from '@/hooks/use-preference-autopilot';
import type { PrefRunHistoryEntry } from '@/types/platform/preference-autopilot';

// Run-activity timeline — one stacked bar per run (oldest → newest), segmented by
// outcome family, trigger glyph on the axis. Click a bar to open that run's full
// action ledger. Mirrors the studio run-timeline idiom.

const OUTCOME = [
    { key: 'auto', label: 'Auto-handled', color: '#34d399' },
    { key: 'held', label: 'Needs human', color: 'hsl(var(--primary))' },
    { key: 'skipped', label: 'Skipped', color: 'hsl(var(--muted-foreground))' },
    { key: 'errored', label: 'Errored', color: 'hsl(var(--destructive))' },
] as const;

const TRIGGER_MARK: Record<string, string> = { scheduled: 'S', manual: 'M' };

const CLASS_LABEL: Record<string, string> = {
    map_sweep: 'Mapping sweep',
    dirty_sweep: 'Dirty re-map',
    centroid_refresh: 'Centroid recovery',
    member_refresh: 'Member counts',
    recompute: 'Affinity recompute',
    mine: 'Mining',
    proposal_enrich: 'Proposal scoring',
    auto_approve: 'Auto-approve',
    merge_suggest: 'Merge suggestion',
    snapshot: 'Baseline / snapshot',
};

const STATUS_TONE: Record<string, string> = {
    success: 'text-emerald-500',
    baseline_success: 'text-emerald-500',
    would_trigger: 'text-primary',
    would_skip: 'text-muted-foreground',
    skipped: 'text-muted-foreground',
    error: 'text-destructive',
    baseline_error: 'text-destructive',
};

function RunLedgerSheet({ runId, onClose }: { runId: string | null; onClose: () => void }) {
    const { data, isLoading } = usePreferenceAutopilotRunActions(runId);
    return (
        <Sheet open={!!runId} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Run ledger</SheetTitle>
                    <SheetDescription>{data?.run.summary}</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                    ) : (data?.actions.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">No actions recorded for this run.</p>
                    ) : (
                        data!.actions.map((a) => (
                            <div key={a.id} className="rounded-lg border border-border px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">{CLASS_LABEL[a.action_class] ?? a.action_class}</span>
                                    <span className={cn('text-xs font-medium', STATUS_TONE[a.status] ?? 'text-muted-foreground')}>
                                        {a.status}
                                        {a.guardrail ? ` · ${a.guardrail}` : ''}
                                    </span>
                                </div>
                                {a.reason && <p className="mt-0.5 text-xs text-muted-foreground">{a.reason}</p>}
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function AutopilotRunTimeline({ runs }: { runs: PrefRunHistoryEntry[] }) {
    const [openRun, setOpenRun] = useState<string | null>(null);

    if (runs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Run activity</CardTitle>
                    <CardDescription>No runs yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Oldest → newest for the timeline; fold buckets into outcome families.
    const data = [...runs].reverse().map((r) => {
        const b = r.buckets;
        return {
            id: r.id,
            mark: TRIGGER_MARK[r.trigger] ?? '?',
            when: new Date(r.started_at).toLocaleString(),
            trigger: r.trigger,
            mode: r.mode,
            headline: r.headline,
            auto:
                b.map_sweep + b.dirty_sweep + b.centroid_refresh + b.member_refresh + b.recompute + b.mine +
                b.proposal_enrich + b.auto_approve + b.baseline,
            held: b.merge_suggest,
            skipped: b.skipped,
            errored: b.errored,
        };
    });

    return (
        <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-base">Run activity</CardTitle>
                    <CardDescription>One bar per run. Select a bar for its ledger; S is scheduled, M is manual.</CardDescription>
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                    {OUTCOME.map((o) => (
                        <span key={o.key} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: o.color }} />
                            {o.label}
                        </span>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                        <CartesianGrid className="stroke-muted" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mark" tick={{ fontSize: 12 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10.5 }} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            labelFormatter={(_, payload) => {
                                const p = payload?.[0]?.payload;
                                return p ? `${p.when} · ${p.trigger} · ${p.mode} · ${p.headline}` : '';
                            }}
                        />
                        {OUTCOME.map((o) => (
                            <Bar
                                key={o.key}
                                dataKey={o.key}
                                stackId="run"
                                fill={o.color}
                                cursor="pointer"
                                onClick={(entry: { id?: string; payload?: { id?: string } }) => {
                                    const id = entry?.payload?.id ?? entry?.id;
                                    if (id) setOpenRun(id);
                                }}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
            <RunLedgerSheet runId={openRun} onClose={() => setOpenRun(null)} />
        </Card>
    );
}
