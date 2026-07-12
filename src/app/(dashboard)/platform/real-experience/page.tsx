'use client';

import { useState } from 'react';
import { Activity, AlertTriangle, Gauge, Pause, Play, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    useCloseExperienceIncident,
    useExperienceActions,
    useExperienceIncidents,
    useExperienceMetrics,
    useExperienceRuns,
    useExperienceStatus,
    useExperienceSuppressions,
    usePauseExperienceSchedule,
    useRevokeExperienceSuppression,
    useRunExperienceNow,
    useUpdateExperiencePolicy,
} from '@/hooks/use-real-experience';
import type { RuxVerdict, SliStatus, SurfaceVerdict } from '@/types/platform/real-experience';

function verdictTone(v?: string) {
    if (v === 'healthy' || v === 'completed' || v === 'ok') return 'success' as const;
    if (v === 'critical' || v === 'failed' || v === 'breach') return 'destructive' as const;
    if (v === 'degraded' || v === 'partial' || v === 'latency_breach') return 'warning' as const;
    if (v === 'watching') return 'warning' as const;
    return 'secondary' as const;
}

const SURFACE_LABELS: Record<string, string> = { foryou: 'For You', news: 'News' };

function pct(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function SliRow({ sli }: { sli: SliStatus }) {
    const showValue = sli.status !== 'insufficient';
    return (
        <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-sm last:border-0">
            <span className="text-muted-foreground">{sli.label}</span>
            <div className="flex items-center gap-2">
                {showValue ? (
                    <span className="tabular-nums">{pct(sli.value)}</span>
                ) : (
                    <span className="text-xs text-muted-foreground">insufficient data</span>
                )}
                {sli.p75_ms ? <span className="text-xs text-muted-foreground">p75 {sli.p75_ms}ms</span> : null}
                <Badge variant={verdictTone(sli.status)} className="text-[10px]">{sli.status}</Badge>
            </div>
        </div>
    );
}

function SurfaceCard({ surface, data }: { surface: string; data?: SurfaceVerdict }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    {SURFACE_LABELS[surface] ?? surface}
                    <Badge variant={verdictTone(data?.verdict)}>{data?.verdict ?? 'no data'}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                {data?.slis?.length ? data.slis.map((s) => <SliRow key={s.metric} sli={s} />) : (
                    <p className="text-muted-foreground">No SLIs computed yet.</p>
                )}
            </CardContent>
        </Card>
    );
}

function headline(surfaces: Record<string, SurfaceVerdict> | undefined, telemetryFresh: boolean): { text: string; tone: RuxVerdict } {
    if (!telemetryFresh) return { text: 'Telemetry is stale — experience conclusions withheld.', tone: 'telemetry_degraded' };
    if (!surfaces) return { text: 'Waiting for the first evaluation.', tone: 'insufficient_data' };
    const verdicts = Object.values(surfaces).map((s) => s.verdict);
    if (verdicts.includes('critical')) return { text: 'A core journey is broadly failing for real sessions.', tone: 'critical' };
    if (verdicts.includes('degraded')) return { text: 'A supported cohort has confirmed experience damage.', tone: 'degraded' };
    if (verdicts.includes('watching')) return { text: 'An early regression is being watched.', tone: 'watching' };
    if (verdicts.every((v) => v === 'insufficient_data')) return { text: 'Not enough real sessions yet to judge health.', tone: 'insufficient_data' };
    return { text: 'Real For You and News sessions are healthy.', tone: 'healthy' };
}

export default function RealExperiencePage() {
    const status = useExperienceStatus();
    const metrics = useExperienceMetrics();
    const incidents = useExperienceIncidents();
    const runs = useExperienceRuns();
    const actions = useExperienceActions();
    const suppressions = useExperienceSuppressions();

    const updatePolicy = useUpdateExperiencePolicy();
    const runNow = useRunExperienceNow();
    const pause = usePauseExperienceSchedule();
    const closeIncident = useCloseExperienceIncident();
    const revokeSuppression = useRevokeExperienceSuppression();

    const [closingId, setClosingId] = useState<string | null>(null);

    const policy = status.data?.policy;
    const telemetryFresh = status.data?.telemetry_fresh ?? false;
    const surfaces = metrics.data?.surfaces;
    const head = headline(surfaces, telemetryFresh);
    const openIncidents = incidents.data ?? [];
    const topIncident = openIncidents[0];

    return (
        <div className="space-y-6 p-6">
            {/* ── What is happening ─────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <Gauge className="h-6 w-6" /> Real Experience
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {head.tone === 'telemetry_degraded' ? <WifiOff className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        {head.text}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={verdictTone(head.tone)} className="h-7 px-3 text-sm">{head.tone}</Badge>
                    <Button size="sm" variant="outline" onClick={() => runNow.mutate()} disabled={runNow.isPending}>
                        <RefreshCw className={`mr-1 h-4 w-4 ${runNow.isPending ? 'animate-spin' : ''}`} /> Evaluate now
                    </Button>
                </div>
            </div>

            {/* ── Is it healthy ─────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                <SurfaceCard surface="foryou" data={surfaces?.foryou} />
                <SurfaceCard surface="news" data={surfaces?.news} />
            </div>

            {/* ── What should I do ──────────────────────────────── */}
            {topIncident ? (
                <Card className="border-warning/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-warning" /> Recommended next step
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <p>{topIncident.recommendation || 'Investigate the highest-severity incident.'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Likely owner: <span className="font-medium">{topIncident.likely_owner || 'unknown'}</span>
                        </p>
                    </CardContent>
                </Card>
            ) : null}

            {/* ── What needs attention (incidents) ──────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Open incidents ({openIncidents.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {openIncidents.length === 0 ? (
                        <p className="text-muted-foreground">No open incidents.</p>
                    ) : openIncidents.map((inc) => (
                        <div key={inc.id} className="flex items-center justify-between gap-3 rounded-md border border-border/50 p-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant={verdictTone(inc.severity)} className="text-[10px]">{inc.severity}</Badge>
                                    <span className="truncate font-medium">{inc.summary}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {SURFACE_LABELS[inc.surface] ?? inc.surface} · {inc.cohort_dim}:{inc.cohort_val} · streak {inc.violation_streak} · owner {inc.likely_owner || 'n/a'}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={closeIncident.isPending && closingId === inc.id}
                                onClick={() => { setClosingId(inc.id); closeIncident.mutate({ id: inc.id, reason_class: 'false_positive' }); }}
                            >
                                Close (false positive)
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* ── What did the system do (runs + ledger) ────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Recent evaluations</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                        {(runs.data ?? []).slice(0, 8).map((r) => (
                            <div key={r.id} className="flex items-center justify-between border-b border-border/40 py-1 last:border-0">
                                <span className="text-muted-foreground">{new Date(r.started_at).toLocaleString()}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{r.buckets_processed} buckets</span>
                                    <Badge variant={verdictTone(r.status)} className="text-[10px]">{r.status}</Badge>
                                </div>
                            </div>
                        ))}
                        {(runs.data ?? []).length === 0 && <p className="text-muted-foreground">No runs yet.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Action ledger</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                        {(actions.data ?? []).slice(0, 10).map((a) => (
                            <div key={a.id} className="border-b border-border/40 py-1 last:border-0">
                                <div className="flex items-center justify-between">
                                    <span className="truncate">{a.label}</span>
                                    <Badge variant="secondary" className="ml-2 shrink-0 text-[10px]">{a.action_class}</Badge>
                                </div>
                            </div>
                        ))}
                        {(actions.data ?? []).length === 0 && <p className="text-muted-foreground">No actions recorded.</p>}
                    </CardContent>
                </Card>
            </div>

            {/* ── What can I tune (policy) ──────────────────────── */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Observe policy</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Ingestion</p>
                            <p className="text-xs text-muted-foreground">Public write kill-switch for browser telemetry.</p>
                        </div>
                        <Switch
                            checked={policy?.ingest_enabled ?? false}
                            onCheckedChange={(v) => updatePolicy.mutate({ ingest_enabled: v })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Scheduled evaluation</p>
                            <p className="text-xs text-muted-foreground">Runs rollups + verdicts on cadence. Keep off until baselines ratify.</p>
                        </div>
                        <Switch
                            checked={policy?.evaluation_enabled ?? false}
                            onCheckedChange={(v) => updatePolicy.mutate({ evaluation_enabled: v })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {policy?.paused_until ? (
                            <Button size="sm" variant="outline" onClick={() => pause.mutate(0)}>
                                <Play className="mr-1 h-4 w-4" /> Resume schedule
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => pause.mutate(60)}>
                                <Pause className="mr-1 h-4 w-4" /> Pause 60 min
                            </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                            sample floor {policy?.min_sample_floor} · confirm {policy?.confirm_windows} · resolve {policy?.resolve_windows} · raw retention {policy?.raw_retention_days}d
                        </span>
                    </div>

                    {(suppressions.data ?? []).length > 0 && (
                        <div className="border-t border-border/40 pt-3">
                            <p className="mb-1 font-medium">Active suppressions</p>
                            {(suppressions.data ?? []).map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-1 text-xs">
                                    <span className="text-muted-foreground">{s.metric_key || 'all'} · {s.surface || 'all'} · {s.reason}</span>
                                    <Button size="sm" variant="ghost" onClick={() => revokeSuppression.mutate(s.id)}>Revoke</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
