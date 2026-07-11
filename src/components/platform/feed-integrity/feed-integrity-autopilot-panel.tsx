'use client';

import { AlertTriangle, Bot, Check, CircleOff, Clock3, Play, ShieldCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    useApproveFeedIntegrityAction,
    useFeedIntegrityAutopilotActions,
    useFeedIntegrityAutopilotStatus,
    usePauseFeedIntegrityAutopilot,
    useRejectFeedIntegrityAction,
    useRunFeedIntegrityAutopilot,
    useUpdateFeedIntegrityAutopilotPolicy,
} from '@/hooks/use-feed-integrity';
import type { FeedIntegrityAction, FeedIntegrityAutopilotMode } from '@/types/platform/feed-integrity';

const modes: Array<{ value: FeedIntegrityAutopilotMode; label: string }> = [
    { value: 'observe', label: 'Observe' },
    { value: 'assist', label: 'Assist' },
    { value: 'safe_auto', label: 'Safe Auto' },
];

function actionTone(outcome: string) {
    if (outcome === 'verification_passed' || outcome === 'tool_succeeded') return 'success' as const;
    if (outcome === 'tool_failed' || outcome === 'verification_failed' || outcome === 'rejected') return 'destructive' as const;
    if (outcome === 'approval_required' || outcome === 'ready' || outcome === 'verifying') return 'warning' as const;
    return 'secondary' as const;
}

function ActionRow({ action }: { action: FeedIntegrityAction }) {
    const approve = useApproveFeedIntegrityAction();
    const reject = useRejectFeedIntegrityAction();
    return (
        <div className="grid gap-3 border-b py-3 last:border-0 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={actionTone(action.outcome)}>{action.outcome.replaceAll('_', ' ')}</Badge>
                    <span className="font-medium">{action.action_class}</span>
                    <span className="text-xs text-muted-foreground">{action.owner_system}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{action.reason || action.guardrail || 'Decision recorded'}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{action.target_scope} - {new Date(action.created_at).toLocaleString()}</p>
            </div>
            {action.outcome === 'approval_required' ? (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve.mutate(action.id)} disabled={approve.isPending}><Check className="mr-1 h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject.mutate({ id: action.id, reason: 'Rejected from Feed Integrity cockpit' })} disabled={reject.isPending}><X className="mr-1 h-4 w-4" />Reject</Button>
                </div>
            ) : null}
        </div>
    );
}

export function FeedIntegrityAutopilotPanel() {
    const { data, isLoading } = useFeedIntegrityAutopilotStatus();
    const { data: actions } = useFeedIntegrityAutopilotActions();
    const update = useUpdateFeedIntegrityAutopilotPolicy();
    const run = useRunFeedIntegrityAutopilot();
    const pause = usePauseFeedIntegrityAutopilot();
    const policy = data?.policy;
    const paused = !!policy?.autopilot_paused_until && new Date(policy.autopilot_paused_until).getTime() > Date.now();
    const pending = (actions?.items ?? data?.recent_actions ?? []).filter((action) => action.outcome === 'approval_required');

    if (isLoading) return <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading Autopilot...</CardContent></Card>;

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2"><Bot className="h-5 w-5" /><h2 className="text-xl font-semibold">Autopilot</h2><Badge variant={data?.self_health === 'healthy' ? 'success' : 'warning'}>{data?.self_health ?? 'unknown'}</Badge></div>
                    <p className="text-sm text-muted-foreground">{data?.decision?.replaceAll('_', ' ') || 'No decision yet'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-md border p-1">
                        {modes.map((mode) => <Button key={mode.value} size="sm" variant={policy?.autopilot_mode === mode.value ? 'default' : 'ghost'} onClick={() => update.mutate({ autopilot_mode: mode.value })} disabled={update.isPending}>{mode.label}</Button>)}
                    </div>
                    <Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}><Play className="mr-2 h-4 w-4" />Evaluate</Button>
                </div>
            </div>

            <Card>
                <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div><p className="text-xs text-muted-foreground">Action state</p><p className="font-medium">{data?.action_state ?? 'disabled'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Pending review</p><p className="font-medium">{pending.length}</p></div>
                        <div><p className="text-xs text-muted-foreground">Unevaluated</p><p className="font-medium">{data?.pending_evaluations ?? 0}</p></div>
                        <div><p className="text-xs text-muted-foreground">Stuck actions</p><p className="font-medium">{data?.stuck_actions ?? 0}</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <Switch checked={policy?.autopilot_enabled ?? false} onCheckedChange={(autopilot_enabled) => update.mutate({ autopilot_enabled })} disabled={update.isPending} />
                        <span className="text-sm">Actions enabled</span>
                        <Button size="icon" variant="ghost" title={paused ? 'Resume actions' : 'Pause actions for 2 hours'} onClick={() => pause.mutate(paused ? 0 : 120)} disabled={pause.isPending}><CircleOff className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Trust by action</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {(data?.trust ?? []).map((item) => (
                            <div key={item.action_class}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{item.action_class}</span><Badge variant={item.breaker_open ? 'destructive' : item.state === 'trusted' ? 'success' : 'secondary'}>{item.breaker_open ? 'breaker open' : item.state}</Badge></div>
                                <div className="h-2 overflow-hidden rounded-sm bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, item.agreement_pct)}%` }} /></div>
                                <p className="mt-1 text-xs text-muted-foreground">{item.decisions} decisions - {Math.round(item.agreement_pct)}% agreement - {item.failures} recent failures</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" />Needs attention</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {pending.slice(0, 6).map((action) => <ActionRow key={action.id} action={action} />)}
                        {!pending.length ? <p className="text-sm text-muted-foreground">No actions awaiting approval.</p> : null}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Action ledger</CardTitle></CardHeader>
                <CardContent>{(actions?.items ?? data?.recent_actions ?? []).slice(0, 30).map((action) => <ActionRow key={action.id} action={action} />)}</CardContent>
            </Card>
        </section>
    );
}
