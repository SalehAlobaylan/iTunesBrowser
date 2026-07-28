'use client';

import { useMemo, useState } from 'react';
import {
    ArchiveRestore,
    Clock3,
    Database,
    Gauge,
    Pause,
    Play,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    useApproveRetentionAction,
    useExecuteRetentionAction,
    usePauseRetention,
    usePrepareRetentionCompaction,
    useRetentionHolds,
    useRetentionRunActions,
    useRetentionRuns,
    useRetentionStatus,
    useRunRetention,
    useUpdateRetentionPolicy,
} from '@/hooks/use-retention';
import type { RetentionMode, RetentionVerdict } from '@/types/platform/retention';

const MIB = 1024 * 1024;

function formatBytes(value?: number | null) {
    if (value == null) return 'Unavailable';
    return `${(value / MIB).toFixed(value < 10 * MIB ? 1 : 0)} MiB`;
}

function verdictTone(verdict?: RetentionVerdict | string) {
    if (verdict === 'healthy' || verdict === 'completed') return 'success' as const;
    if (verdict === 'critical' || verdict === 'failed') return 'destructive' as const;
    if (verdict === 'warning' || verdict === 'action_required' || verdict === 'maintenance_required') return 'warning' as const;
    return 'secondary' as const;
}

function CapacityRail({
    current,
    target,
    action,
    critical,
}: {
    current: number;
    target: number;
    action: number;
    critical: number;
}) {
    const scale = Math.max(critical * 1.08, current * 1.03, 1);
    const pct = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;
    return (
        <div className="space-y-3">
            <div className="relative h-4 overflow-hidden rounded-full bg-muted">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-[width] duration-500"
                    style={{ width: pct(current) }}
                />
                {[target, action, critical].map((value) => (
                    <span
                        key={value}
                        className="absolute inset-y-[-4px] w-px bg-foreground/70"
                        style={{ left: pct(value) }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div><span className="block font-medium text-foreground">Working target</span>{formatBytes(target)}</div>
                <div className="text-center"><span className="block font-medium text-foreground">Action</span>{formatBytes(action)}</div>
                <div className="text-right"><span className="block font-medium text-foreground">Critical</span>{formatBytes(critical)}</div>
            </div>
        </div>
    );
}

export default function RetentionPage() {
    const status = useRetentionStatus();
    const runs = useRetentionRuns();
    const holds = useRetentionHolds();
    const run = useRunRetention();
    const pause = usePauseRetention();
    const prepareCompaction = usePrepareRetentionCompaction();
    const approveAction = useApproveRetentionAction();
    const executeAction = useExecuteRetentionAction();
    const savePolicy = useUpdateRetentionPolicy();
    const policy = status.data?.policy;
    const latestRunId = status.data?.latest_run?.id;
    const actions = useRetentionRunActions(latestRunId);
    const [mode, setMode] = useState<RetentionMode | undefined>();
    const selectedMode = mode ?? policy?.mode ?? 'observe';
    const sample = status.data?.latest_sample;

    const runwayCopy = useMemo(() => {
        const days = status.data?.forecast.runway_to_critical_days;
        if (days == null) return 'Growth runway needs at least two samples.';
        if (days < 0) return 'The critical line has already been crossed.';
        return `${days.toFixed(days < 10 ? 1 : 0)} days to the critical line at the measured growth rate.`;
    }, [status.data?.forecast.runway_to_critical_days]);

    if (!policy && status.isLoading) {
        return <p className="text-sm text-muted-foreground">Loading Retention Autopilot…</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Database custody</Badge>
                        <Badge variant={policy?.mode === 'assist' && policy.enabled ? 'warning' : 'secondary'}>
                            {policy?.mode === 'assist' && policy.enabled ? 'Assist execution armed' : 'Observe-only until Assist is enabled'}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Retention Autopilot</h1>
                    <p className="mt-2 text-muted-foreground">
                        Keep a full current month for readers while measuring what can be compacted safely.
                        Sources, canonical identities, and protected interactions remain outside deletion.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => status.refetch()} disabled={status.isFetching}>
                        <RefreshCw className="mr-2 h-4 w-4" />Refresh
                    </Button>
                    <Button variant="outline" onClick={() => pause.mutate(120)} disabled={pause.isPending}>
                        <Pause className="mr-2 h-4 w-4" />Pause 2 hours
                    </Button>
                    <Button onClick={() => run.mutate()} disabled={run.isPending}>
                        <Play className="mr-2 h-4 w-4" />Run observation
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-gold/30">
                <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                    <div className="border-b bg-gold/5 p-6 lg:border-b-0 lg:border-r">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Allocated database</p>
                            <Badge variant={verdictTone(status.data?.verdict)}>{status.data?.verdict ?? 'inconclusive'}</Badge>
                        </div>
                        <p className="mt-3 text-5xl font-semibold tracking-[-0.05em]">
                            {sample ? (sample.database_bytes / MIB).toFixed(0) : '—'}
                            <span className="ml-2 text-base font-medium tracking-normal text-muted-foreground">MiB</span>
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">{runwayCopy}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Last measured {sample?.measured_at ? new Date(sample.measured_at).toLocaleString() : 'never'}
                        </p>
                    </div>
                    <div className="p-6">
                        <CapacityRail
                            current={sample?.database_bytes ?? 0}
                            target={policy?.database_target_bytes ?? 400 * MIB}
                            action={policy?.database_action_bytes ?? 440 * MIB}
                            critical={policy?.database_critical_bytes ?? 480 * MIB}
                        />
                        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5 md:grid-cols-4">
                            <Metric label="Indexes" value={formatBytes(sample?.index_bytes)} />
                            <Metric label="TOAST" value={formatBytes(sample?.toast_bytes)} />
                            <Metric label="Reusable estimate" value={formatBytes(sample?.reusable_bytes)} />
                            <Metric label="Growth / day" value={formatBytes(status.data?.forecast.growth_bytes_per_day)} />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ArchiveRestore className="h-4 w-4 text-gold" />Current shadow preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <Metric label="Dormant stories" value={String(status.data?.preview.eligible_stories ?? 0)} />
                            <Metric label="Candidate rows" value={String(status.data?.preview.candidate_rows ?? 0)} />
                            <Metric label="Logical bytes" value={formatBytes(status.data?.preview.estimated_bytes)} />
                            <Metric label="Protected rows" value={String(status.data?.preview.protected_rows ?? 0)} />
                        </div>
                        <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div>
                                <p className="text-sm font-medium">Execution is human-approved and bounded</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A prepared manifest freezes its exact rows. Execution is available only in enabled Assist mode,
                                    revalidates protection and dependencies, invalidates every News snapshot, and requires readback.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="mt-4"
                            variant="outline"
                            disabled={prepareCompaction.isPending || (status.data?.preview.candidate_rows ?? 0) === 0}
                            onClick={() => prepareCompaction.mutate()}
                        >
                            <ArchiveRestore className="mr-2 h-4 w-4" />Prepare approval manifest
                        </Button>
                        <p className="mt-2 text-xs text-muted-foreground">
                            This freezes the candidate evidence for review. It does not compact or delete anything.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4" />Policy in force</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div><p className="text-sm font-medium">Scheduled observations</p><p className="text-xs text-muted-foreground">Every {policy?.schedule_interval_minutes ?? 360} minutes</p></div>
                            <Switch
                                checked={policy?.enabled ?? false}
                                disabled={!policy || savePolicy.isPending}
                                onCheckedChange={(enabled) => savePolicy.mutate({ enabled })}
                            />
                        </div>
                        <label className="block text-sm">
                            <span className="mb-2 block font-medium">Operating mode</span>
                            <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                value={selectedMode}
                                onChange={(event) => setMode(event.target.value as RetentionMode)}
                            >
                                <option value="observe">Observe</option>
                                <option value="assist">Assist</option>
                                <option value="safe_auto">Safe Auto</option>
                            </select>
                        </label>
                        <Button
                            className="w-full"
                            variant="outline"
                            disabled={!policy || selectedMode === policy.mode || savePolicy.isPending}
                            onClick={() => savePolicy.mutate({ mode: selectedMode })}
                        >
                            Save mode
                        </Button>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <PolicyFact label="Full-fidelity News" value={`${status.data?.guarantees.full_fidelity_days ?? 7} days`} />
                            <PolicyFact label="History telemetry" value={`${status.data?.guarantees.history_retention_days ?? 90} days`} />
                            <PolicyFact label="Sources" value="Always preserved" />
                            <PolicyFact label="Physical rewrites" value="Operator only" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Time boundaries follow {policy?.news_timezone ?? 'Asia/Riyadh'}. These product guarantees
                            cannot be weakened from this dashboard.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Recent observations</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {(runs.data?.items ?? []).slice(0, 8).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                                <div>
                                    <p className="font-medium">{item.trigger} · policy v{item.policy_version}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(item.started_at).toLocaleString()}</p>
                                </div>
                                <Badge variant={verdictTone(item.verdict)}>{item.verdict}</Badge>
                            </div>
                        ))}
                        {!runs.data?.items?.length ? <p className="text-sm text-muted-foreground">Run the first observation to establish a baseline.</p> : null}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4" />Latest action ledger</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {(actions.data?.items ?? []).map((action) => (
                            <div key={action.id} className="rounded-md border p-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium">{action.action_class}</p>
                                    <Badge variant="secondary">{action.outcome}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {action.target_count} rows · {formatBytes(action.estimated_bytes)} · {action.guardrail}
                                </p>
                                {action.outcome === 'approval_required' ? (
                                    <Button className="mt-3" size="sm" variant="outline" disabled={approveAction.isPending} onClick={() => approveAction.mutate(action.id)}>
                                        Approve frozen manifest
                                    </Button>
                                ) : null}
                                {['approved', 'tool_succeeded', 'verification_failed'].includes(action.outcome) ? (
                                    <Button
                                        className="mt-3"
                                        size="sm"
                                        variant={action.outcome === 'approved' ? 'destructive' : 'outline'}
                                        disabled={executeAction.isPending || (action.outcome === 'approved' && !(policy?.enabled && policy.mode === 'assist'))}
                                        onClick={() => {
                                            if (action.outcome !== 'approved' || window.confirm('Execute the approved, immutable compaction manifest? This permanently retires only its selected redundant News rows after revalidation.')) {
                                                executeAction.mutate(action.id);
                                            }
                                        }}
                                    >
                                        {action.outcome === 'approved' ? 'Execute approved manifest' : 'Retry verification'}
                                    </Button>
                                ) : null}
                            </div>
                        ))}
                        {!actions.data?.items?.length ? <p className="text-sm text-muted-foreground">No action proposals in the latest run.</p> : null}
                        <p className="pt-2 text-xs text-muted-foreground">{holds.data?.items.length ?? 0} active retention holds are protecting content, stories, or months.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function PolicyFact({ label, value }: { label: string; value: string }) {
    return <div className="rounded-md bg-muted/60 p-3"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>;
}
