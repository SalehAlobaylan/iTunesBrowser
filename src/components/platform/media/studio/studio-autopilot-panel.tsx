'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useRunStudioAutopilotNow,
    usePauseStudioAutopilot,
    useStudioAutopilotInsights,
    useStudioAutopilotRun,
    useStudioAutopilotRuns,
    useStudioAutopilotStatus,
    useUpdateStudioAutopilotPolicy,
} from '@/hooks/use-media-studio-autopilot';
import type { MediaStudioAction } from '@/types/platform/media-studio-autopilot';
import { StudioClearanceFlow } from './studio-clearance-flow';
import { StudioQueueComposition } from './studio-queue-composition';
import { StudioRunTimeline } from './studio-run-timeline';
import { StudioTrustProgress } from './studio-trust-progress';

const HEADLINE_TONE: Record<string, string> = {
    clear: 'bg-emerald-500/15 text-emerald-300',
    manageable: 'bg-amber-500/15 text-amber-300',
    backlog: 'bg-red-500/15 text-red-300',
};

export function StudioAutopilotPanel() {
    const { data: status, isLoading } = useStudioAutopilotStatus();
    const { data: insights } = useStudioAutopilotInsights();
    const { data: runs } = useStudioAutopilotRuns();
    const updatePolicy = useUpdateStudioAutopilotPolicy();
    const runNow = useRunStudioAutopilotNow();
    const pause = usePauseStudioAutopilot();
    const [openRunId, setOpenRunId] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    if (isLoading || !status) {
        return <div className="p-6 text-sm text-muted-foreground">Loading autopilot…</div>;
    }

    const { policy, health, trust, lead, pending_proposals, next_run_at, last_run } = status;
    const paused = policy.paused_until && new Date(policy.paused_until) > new Date();
    const stateLabel = !policy.autopilot_enabled
        ? 'Off'
        : paused
          ? 'Paused'
          : policy.autopilot_mode === 'safe_auto'
            ? 'Safe Auto'
            : 'Observe';

    return (
        <div className="space-y-4">
            {/* Headline strip */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">Studio Clearance Autopilot</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge className={HEADLINE_TONE[health.headline] ?? ''}>{health.headline}</Badge>
                        <Badge variant="outline">{stateLabel}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat label="Review queue" value={health.review_queue_depth} />
                        <Stat label="Aged" value={health.aged_count} tone={health.aged_count > 0 ? 'warn' : undefined} />
                        <Stat label="Pending proposals" value={pending_proposals} />
                        <Stat label="Auto-repair transcripts" value={health.transcript_auto_repair} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {last_run && <>Last run ({last_run.trigger}): {last_run.summary || last_run.status}. </>}
                        {lead.chain_idle
                            ? 'Lead autopilot off — chain idle; interval sweep only.'
                            : 'Lead autopilot on — chains after each atomize_now.'}
                        {next_run_at && ` · Next interval ~${new Date(next_run_at).toLocaleTimeString()}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => runNow.mutate()} disabled={runNow.isPending || !policy.autopilot_enabled}>
                            Run now
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => pause.mutate(720)} disabled={pause.isPending || !policy.autopilot_enabled}>
                            Pause 12h
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* HERO — decision flow with live counts */}
            <StudioClearanceFlow flow={insights?.latest_flow ?? null} mode={policy.autopilot_mode} />

            {/* Composition + trust progress */}
            <div className="grid gap-4 lg:grid-cols-2">
                <StudioQueueComposition byCode={health.by_code} total={health.review_queue_depth} aged={health.aged_count} />
                <StudioTrustProgress trust={trust} policy={policy} />
            </div>

            {/* Run activity over time */}
            <StudioRunTimeline runs={insights?.run_history ?? []} />

            {/* Details & controls (demoted) */}
            <Card>
                <CardHeader className="pb-2">
                    <button className="flex w-full items-center justify-between text-left" onClick={() => setShowDetails((v) => !v)}>
                        <CardTitle className="text-sm">Details &amp; controls</CardTitle>
                        <span className="text-xs text-muted-foreground">{showDetails ? 'Hide' : 'Show'}</span>
                    </button>
                </CardHeader>
                {showDetails && (
                    <CardContent className="space-y-5">
                        {/* Policy */}
                        <div className="space-y-3">
                            <ToggleRow label="Enabled" checked={policy.autopilot_enabled}
                                onChange={(v) => updatePolicy.mutate({ autopilot_enabled: v })} />
                            <ToggleRow label="Safe Auto (off = Observe)" checked={policy.autopilot_mode === 'safe_auto'}
                                onChange={(v) => updatePolicy.mutate({ autopilot_mode: v ? 'safe_auto' : 'observe' })} />
                            <ToggleRow label="Generate proposals in Observe" checked={policy.observe_proposals}
                                onChange={(v) => updatePolicy.mutate({ observe_proposals: v })} />
                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                                <span>Interval: {policy.interval_minutes}m</span>
                                <span>Max clears: {policy.max_clears_per_run}</span>
                                <span>Max publishes: {policy.max_publishes_per_run}</span>
                                <span>Max STT: {policy.max_stt_per_run}</span>
                                <span>Max proposals: {policy.max_proposals_per_run}</span>
                                <span>Aged: {policy.aged_threshold_days}d</span>
                                <span>Trust: {policy.trust_min_decisions}/{policy.trust_min_approve_pct}%/{policy.trust_max_reversal_pct}%</span>
                            </div>
                        </div>

                        {/* Runs + ledger */}
                        <div>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Recent runs — click for the action ledger</p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>When</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Summary</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(runs ?? []).map((run) => (
                                        <TableRow key={run.id} className="cursor-pointer"
                                            onClick={() => setOpenRunId(openRunId === run.id ? null : run.id)}>
                                            <TableCell>{new Date(run.started_at).toLocaleString()}</TableCell>
                                            <TableCell>{run.trigger}</TableCell>
                                            <TableCell>{run.mode}</TableCell>
                                            <TableCell>{run.status}</TableCell>
                                            <TableCell className="max-w-[280px] truncate">{run.summary}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(runs ?? []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground">No runs yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {openRunId && <RunLedger runId={openRunId} />}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function RunLedger({ runId }: { runId: string }) {
    const { data } = useStudioAutopilotRun(runId);
    if (!data) return <p className="mt-3 text-xs text-muted-foreground">Loading ledger…</p>;
    return (
        <div className="mt-3 rounded-md border p-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Verdict</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Guardrail</TableHead>
                        <TableHead>Reason</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.actions.map((a: MediaStudioAction) => (
                        <TableRow key={a.id}>
                            <TableCell className="font-mono text-xs">{a.verdict}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs">
                                    {a.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{a.guardrail || '—'}</TableCell>
                            <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                                {a.reason}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
    return (
        <div className="rounded-md border p-2">
            <div
                className={`text-xl font-semibold ${tone === 'warn' ? 'text-amber-400' : ''}`}
            >
                {value}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    );
}

function ToggleRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm">{label}</span>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
