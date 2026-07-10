'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Pause, Play, PlayCircle, RefreshCw, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
    usePreferenceAutopilotInsights,
    usePreferenceAutopilotStatus,
    useRunPreferenceAutopilotNow,
    useUpdatePreferenceAutopilotPolicy,
} from '@/hooks/use-preference-autopilot';
import type { PreferenceHeadline } from '@/types/platform/preference-autopilot';
import { AutopilotAdvisor } from './autopilot-advisor';
import { AutopilotAttention } from './autopilot-attention';
import { AutopilotAutoApproveCard } from './autopilot-auto-approve-card';
import { AutopilotCoverageTrend } from './autopilot-coverage-trend';
import { AutopilotFlow } from './autopilot-flow';
import { AutopilotHealth } from './autopilot-health';
import { AutopilotLedger } from './autopilot-ledger';
import { AutopilotOps } from './autopilot-ops';
import { AutopilotPolicySheet } from './autopilot-policy-sheet';
import { AutopilotRunTimeline } from './autopilot-run-timeline';
import { ConfirmDialog } from '../confirm-dialog';

const HEADLINE_LABEL: Record<PreferenceHeadline, string> = {
    curation_current: 'Curation current',
    review_ready: 'Review ready',
    backlog: 'Proposal backlog',
    coverage_gap: 'Coverage gap',
    flip_eligible: 'Flip eligible',
    integrity_alert: 'Integrity alert',
    degraded: 'Degraded',
    not_observed: 'Not observed yet',
};

const HEADLINE_TONE: Record<PreferenceHeadline, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
    curation_current: 'success',
    review_ready: 'info',
    backlog: 'warning',
    coverage_gap: 'warning',
    flip_eligible: 'info',
    integrity_alert: 'destructive',
    degraded: 'destructive',
    not_observed: 'secondary',
};

function StatTile({ label, value, accent }: { label: string; value: string; accent?: 'primary' | 'destructive' | 'success' }) {
    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2">
            <div
                className={cn(
                    'text-xl font-bold tabular-nums',
                    accent === 'primary' && 'text-primary',
                    accent === 'destructive' && 'text-destructive',
                    accent === 'success' && 'text-emerald-500'
                )}
            >
                {value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
    );
}

export function AutopilotTab({
    onGoToSettings,
    onGoToProposals,
}: {
    onGoToSettings?: () => void;
    onGoToProposals?: () => void;
}) {
    const statusQuery = usePreferenceAutopilotStatus();
    const insightsQuery = usePreferenceAutopilotInsights();
    const status = statusQuery.data;
    const insights = insightsQuery.data;
    const update = useUpdatePreferenceAutopilotPolicy();
    const run = useRunPreferenceAutopilotNow();
    const [policyOpen, setPolicyOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [confirmSafeAuto, setConfirmSafeAuto] = useState(false);

    if (statusQuery.isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
                <Skeleton className="h-56 w-full rounded-xl" />
            </div>
        );
    }

    if (statusQuery.isError || !status) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                    <div>
                        <p className="font-semibold">Autopilot status is unavailable</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {statusQuery.error instanceof Error ? statusQuery.error.message : 'The CMS did not return the cockpit state.'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => statusQuery.refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const paused = status.state === 'paused';
    const flipEligible = status.headline === 'flip_eligible';
    const snapshot = status.snapshot ?? undefined;

    return (
        <div className="space-y-5">
            {/* ── What's happening: headline strip + controls ── */}
            <Card>
                <CardHeader className="flex-col items-start justify-between gap-3 space-y-0 pb-3 sm:flex-row">
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={HEADLINE_TONE[status.headline]}>{HEADLINE_LABEL[status.headline]}</Badge>
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{status.state}</span>
                            {typeof status.snapshot_age_sec === 'number' && (
                                <span className="text-[11px] text-muted-foreground">
                                    snapshot {Math.floor(status.snapshot_age_sec / 60)}m old
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{status.last_run?.summary || 'No completed run yet.'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">Enabled</span>
                        <Switch
                            aria-label="Enable Preferences Autopilot"
                            checked={status.enabled}
                            onCheckedChange={(v) => update.mutate({ enabled: v })}
                            disabled={update.isPending}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                        <StatTile label="Pending" value={`${status.pending_proposals}`} accent={status.pending_proposals > 0 ? 'primary' : undefined} />
                        <StatTile label="High-conf" value={`${snapshot?.high_confidence_pending ?? 0}`} accent="success" />
                        <StatTile label="For You cov." value={`${(snapshot?.foryou_coverage_pct ?? 0).toFixed(0)}%`} accent="primary" />
                        <StatTile label="News cov." value={`${(snapshot?.news_coverage_pct ?? 0).toFixed(0)}%`} accent="primary" />
                        <StatTile label="Stories cov." value={`${(snapshot?.story_coverage_pct ?? 0).toFixed(0)}%`} />
                        <StatTile label="Queue depth" value={`${snapshot?.recompute_queue_depth ?? 0}`} />
                        <StatTile label="Dup pairs" value={`${snapshot?.near_duplicate_pairs ?? 0}`} accent={(snapshot?.near_duplicate_pairs ?? 0) > 0 ? 'destructive' : undefined} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={status.mode}
                            onValueChange={(v) => {
                                if (v === 'safe_auto' && status.mode !== 'safe_auto') setConfirmSafeAuto(true);
                                else update.mutate({ mode: 'observe' });
                            }}
                            disabled={update.isPending}
                        >
                            <SelectTrigger className="h-9 w-[150px]" aria-label="Autopilot mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="observe">Observe (shadow)</SelectItem>
                                <SelectItem value="safe_auto">Safe Auto</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => run.mutate()}
                            disabled={run.isPending || !status.enabled}
                            aria-busy={run.isPending}
                        >
                            {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                            {run.isPending ? 'Running...' : 'Run now'}
                        </Button>
                        {paused ? (
                            <Button variant="outline" onClick={() => update.mutate({ paused_minutes: 0 })} disabled={update.isPending}>
                                <Play className="mr-2 h-4 w-4" /> Resume
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => update.mutate({ paused_minutes: 60 })} disabled={update.isPending || !status.enabled}>
                                <Pause className="mr-2 h-4 w-4" /> Pause 1h
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setPolicyOpen(true)}>
                            <Settings2 className="mr-2 h-4 w-4" /> Tune policy
                        </Button>
                    </div>
                    {run.isPending && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            Running the bounded maintenance pass. It is safe to keep this tab open while the ledger is updated.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── What should I do ── */}
            {status.recommended_action && (
                <Card className={cn(flipEligible && 'border-primary/40 bg-primary/5')}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recommended action</div>
                            <p className="text-sm font-medium">{status.recommended_action}</p>
                        </div>
                        {flipEligible && onGoToSettings && (
                            <Button onClick={onGoToSettings}>
                                Review feed switches
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {insightsQuery.isError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Deep analytics are unavailable; live controls and health remain usable.
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => insightsQuery.refetch()}>
                        Retry analytics
                    </Button>
                </div>
            )}

            {/* ── Immediate human work ── */}
            <div className="grid gap-5 lg:grid-cols-2">
                <AutopilotAdvisor onViewAll={onGoToProposals} />
                <AutopilotAttention
                    nullCentroids={status.null_centroid_topics}
                    deadTopics={status.dead_topics}
                    duplicatePairs={snapshot?.duplicate_pairs ?? []}
                />
            </div>

            {/* ── Health and trajectory ── */}
            <div className="grid gap-5 lg:grid-cols-2">
                <AutopilotHealth snapshot={snapshot} />
                {insightsQuery.isLoading ? (
                    <Skeleton className="min-h-72 w-full rounded-xl" />
                ) : (
                    <AutopilotCoverageTrend
                        series={insights?.coverage_series ?? []}
                        floors={insights?.coverage_floors ?? { foryou: 70, news: 60, story: 50 }}
                    />
                )}
            </div>

            {/* ── Autonomy and latest execution ── */}
            <div className="grid gap-5 lg:grid-cols-2">
                {insightsQuery.isLoading ? (
                    <>
                        <Skeleton className="min-h-72 w-full rounded-xl" />
                        <Skeleton className="min-h-72 w-full rounded-xl" />
                    </>
                ) : (
                    <>
                        <AutopilotAutoApproveCard policy={status.policy} trust={status.trust} autoApproved={insights?.auto_approved ?? []} />
                        <AutopilotFlow flow={insights?.latest_flow} />
                    </>
                )}
            </div>

            {insightsQuery.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
                <AutopilotRunTimeline runs={insights?.run_history ?? []} />
            )}

            {/* ── Advanced operations stay available without dominating the daily loop ── */}
            <section className="border-t border-border pt-1">
                <div>
                    <button
                        onClick={() => setShowDetails((v) => !v)}
                        aria-expanded={showDetails}
                        className="flex w-full items-center justify-between py-4 text-left"
                    >
                        <span>
                            <span className="block text-sm font-semibold">Advanced operations</span>
                            <span className="block text-xs text-muted-foreground">Cross-run ledger, repair queue, checkpoints, and policy envelope.</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {showDetails ? 'Hide' : 'Show'}
                            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                    </button>
                </div>
                {showDetails && (
                    <div className="space-y-5 pb-2">
                        <AutopilotLedger />
                        <AutopilotOps breakers={insights?.class_breakers ?? []} policy={status.policy} />
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <Knob label="Cadence" value={`${status.policy.interval_minutes}m`} />
                            <Knob label="Item candidates" value={`${status.policy.max_item_candidates}`} />
                            <Knob label="Story candidates" value={`${status.policy.max_story_candidates}`} />
                            <Knob label="Users / run" value={`${status.policy.max_users_recompute}`} />
                            <Knob label="Proposals scored" value={`${status.policy.max_proposals_enriched}`} />
                            <Knob label="Translations" value={`${status.policy.max_translation_calls}`} />
                            <Knob label="Mined / day" value={`${status.policy.max_mined_proposals}`} />
                            <Knob label="Pending ceiling" value={`${status.policy.max_pending_proposals}`} />
                            <Knob label="High-conf ≥" value={status.policy.high_confidence.toFixed(2)} />
                            <Knob label="Auto-approve ≥" value={status.policy.auto_approve_min_confidence.toFixed(2)} />
                            <Knob label="Auto-approvals" value={`${status.policy.max_auto_approvals}/run`} />
                            <Knob label="Breaker" value={`${status.policy.failure_breaker_pct}%`} />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPolicyOpen(true)}>
                            <Settings2 className="mr-2 h-3.5 w-3.5" /> Tune policy
                        </Button>
                    </div>
                )}
            </section>

            <AutopilotPolicySheet policy={status.policy} open={policyOpen} onOpenChange={setPolicyOpen} />
            <ConfirmDialog
                open={confirmSafeAuto}
                onOpenChange={setConfirmSafeAuto}
                title="Promote to Safe Auto?"
                confirmLabel="Enable Safe Auto"
                pending={update.isPending}
                description="Safe Auto replaces the incumbent baseline with bounded derived-data maintenance. Catalog decisions and feed switches remain human-controlled."
                onConfirm={() => update.mutate({ mode: 'safe_auto' }, { onSettled: () => setConfirmSafeAuto(false) })}
            />
        </div>
    );
}

function Knob({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="font-mono text-sm tabular-nums">{value}</div>
        </div>
    );
}
