'use client';

import { useState } from 'react';
import { AlertTriangle, Boxes, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    useCampaignAction,
    useCreateCampaign,
    useEmbeddingCampaign,
    useEmbeddingCampaigns,
    useEmbeddingExceptionAction,
    useEmbeddingRuns,
    useEmbeddingStatus,
    useRunEmbeddingAudit,
    useStartCampaign,
    useUpdateEmbeddingPolicy,
} from '@/hooks/use-embedding-lifecycle';
import type { EmbeddingCampaign, SurfaceSummary } from '@/lib/api/cms/embedding-lifecycle';

function verdictTone(v?: string) {
    if (v === 'coherent') return 'success' as const;
    if (v === 'drifting' || v === 'mixed_space' || v === 'blocked' || v === 'check_error') return 'destructive' as const;
    if (v === 'unstamped_debt' || v === 'migrating') return 'warning' as const;
    return 'secondary' as const;
}
function headlineTone(h?: string) {
    if (h === 'all_clear') return 'success' as const;
    if (h === 'attention') return 'destructive' as const;
    if (h === 'watching') return 'warning' as const;
    return 'secondary' as const;
}

function SurfaceRow({ k, s }: { k: string; s: SurfaceSummary }) {
    const total = s.with_vec || 0;
    const pct = total > 0 ? Math.round((s.current / total) * 100) : 100;
    return (
        <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
            <div className="flex items-center gap-2">
                <span className="font-medium">{k}</span>
                <Badge variant={verdictTone(s.verdict)}>{s.verdict}</Badge>
                <span className="text-xs text-muted-foreground">{s.space}</span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{pct}% current</span>
                <span>{s.current} ok</span>
                <span className={s.stale ? 'text-destructive' : ''}>{s.stale} stale</span>
                <span className={s.unstamped ? 'text-amber-600' : ''}>{s.unstamped} unstamped</span>
                {s.mixed_space > 0 && <span className="text-destructive">{s.mixed_space} mixed</span>}
            </div>
        </div>
    );
}

function CampaignCard({ c }: { c: EmbeddingCampaign }) {
    const act = useCampaignAction();
    const start = useStartCampaign();
    const exceptionAction = useEmbeddingExceptionAction();
    const terminal = ['completed', 'completed_with_waivers', 'aborted'].includes(c.state);
    const { data: detail } = useEmbeddingCampaign(c.id, !terminal);
    const [reason, setReason] = useState('');
    const [waiverReason, setWaiverReason] = useState('');
    const openExceptions = (detail?.exceptions ?? []).filter((item) => item.status !== 'resolved');
    return (
        <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium">#{c.id} · {c.space}</span>
                    <Badge variant={c.state === 'completed' ? 'success' : c.state === 'blocked' ? 'destructive' : 'secondary'}>{c.state}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">→ {c.target_space_id.slice(0, 12)}…</span>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>{c.completed_count} done</span>
                <span className={c.failed_count ? 'text-destructive' : ''}>{c.failed_count} failed</span>
                <span>cap {c.daily_item_cap}/day</span>
            </div>
            {c.blocked_reason && <p className="mt-1 text-xs text-destructive">{c.blocked_reason}</p>}
            <div className="mt-3 flex items-center gap-2">
                {c.state === 'draft' && (
                    <>
                        <input
                            className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                            placeholder="Reason to start (required)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <Button size="sm" disabled={!reason || start.isPending} onClick={() => start.mutate({ id: c.id, reason })}>
                            <Play className="mr-1 h-3 w-3" /> Start
                        </Button>
                    </>
                )}
                {c.state === 'running' && <Button size="sm" variant="outline" onClick={() => act.mutate({ id: c.id, action: 'pause' })}>Pause</Button>}
                {c.state === 'paused' && <Button size="sm" variant="outline" onClick={() => act.mutate({ id: c.id, action: 'resume' })}>Resume</Button>}
                {c.state === 'blocked' && <Button size="sm" variant="outline" onClick={() => act.mutate({ id: c.id, action: 'resume' })}>Retry preflight</Button>}
                {!terminal && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act.mutate({ id: c.id, action: 'abort' })}>Abort</Button>
                )}
            </div>
            {openExceptions.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-destructive">Needs attention</p>
                    {openExceptions.slice(0, 5).map((item) => (
                        <div key={item.id} className="rounded border border-destructive/30 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span>{item.surface_key} · {item.target_id}</span>
                                <Badge variant="destructive">{item.status} · {item.attempts} tries</Badge>
                            </div>
                            <div className="mt-2 flex gap-2">
                                <Button size="sm" variant="outline" disabled={exceptionAction.isPending} onClick={() => exceptionAction.mutate({ id: item.id, action: 'retry' })}>Retry</Button>
                                <input className="min-w-0 flex-1 rounded border bg-background px-2" placeholder="Waiver reason (7-day expiry)" value={waiverReason} onChange={(e) => setWaiverReason(e.target.value)} />
                                <Button size="sm" variant="ghost" disabled={!waiverReason || exceptionAction.isPending} onClick={() => exceptionAction.mutate({ id: item.id, action: 'waive', reason: waiverReason, expiryHours: 168 })}>Waive</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {(detail?.actions ?? []).length > 0 && (
                <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Latest actions</p>
                    {(detail?.actions ?? []).slice(0, 5).map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 py-0.5">
                            <span>{item.surface_key} · {item.tool}</span>
                            <span>{item.status}{item.guardrail ? ` · ${item.guardrail}` : ''}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function EmbeddingLifecyclePage() {
    const { data, isLoading, refetch, isFetching } = useEmbeddingStatus();
    const { data: runsData } = useEmbeddingRuns();
    const { data: campData } = useEmbeddingCampaigns();
    const runAudit = useRunEmbeddingAudit();
    const savePolicy = useUpdateEmbeddingPolicy();
    const createCampaign = useCreateCampaign();

    const policy = data?.policy;
    const latest = data?.latest_run;
    const surfaces = latest?.per_surface ?? {};
    const spaces = data?.spaces;

    if (isLoading) return <div className="p-6 text-muted-foreground">Loading embedding lifecycle…</div>;

    return (
        <div className="space-y-6 p-6">
            {/* 1. What is happening */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold">
                        <Boxes className="h-6 w-6" /> Embedding & Model Lifecycle
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {latest ? (
                            <>
                                <Badge variant={headlineTone(latest.headline)}>{latest.headline}</Badge>
                                <span>audit {new Date(latest.started_at).toLocaleTimeString()} · {latest.violations_major} major · {latest.check_errors} check-errors</span>
                            </>
                        ) : 'No audit has run yet.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh</Button>
                    <Button size="sm" disabled={runAudit.isPending} onClick={() => runAudit.mutate()}><ShieldCheck className="mr-1 h-4 w-4" /> Run audit</Button>
                </div>
            </div>

            {/* 2. Is it healthy — per-space cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {(['text', 'image'] as const).map((sp) => {
                    const es = spaces?.[sp];
                    const resolved = es?.SpaceID && es.SpaceID.length > 0;
                    return (
                        <Card key={sp}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between text-base capitalize">
                                    {sp} space
                                    <Badge variant={resolved ? 'success' : 'destructive'}>{resolved ? 'resolved' : 'not ready'}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-xs text-muted-foreground">
                                <p>model: {es?.Model || '—'}</p>
                                <p>revision: {es?.Revision ? es.Revision.slice(0, 16) + '…' : 'unresolved'}</p>
                                <p>space_id: {resolved ? es!.SpaceID.slice(0, 20) + '…' : '—'}</p>
                                {es?.Err && <p className="text-destructive">{es.Err}</p>}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Per-surface breakdown */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Surfaces</CardTitle></CardHeader>
                <CardContent>
                    {Object.keys(surfaces).length === 0 && <p className="text-sm text-muted-foreground">Run an audit to populate surface coverage.</p>}
                    {Object.entries(surfaces).map(([k, s]) => <SurfaceRow key={k} k={k} s={s} />)}
                </CardContent>
            </Card>

            {/* 3 + 5. Campaigns / attention */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Migration campaigns</CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={createCampaign.isPending} onClick={() => createCampaign.mutate('text')}>Draft text</Button>
                        <Button size="sm" variant="outline" disabled={createCampaign.isPending} onClick={() => createCampaign.mutate('image')}>Draft image</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(campData?.campaigns ?? []).length === 0 && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" /> No campaigns. Draft one when a space is drifting.</p>
                    )}
                    {(campData?.campaigns ?? []).map((c) => <CampaignCard key={c.id} c={c} />)}
                </CardContent>
            </Card>

            {/* 4. What did it do — runs */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Recent audits</CardTitle></CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground">
                            <tr><th className="py-1">When</th><th>Trigger</th><th>Headline</th><th>Major</th><th>Errors</th><th>ms</th></tr>
                        </thead>
                        <tbody>
                            {(runsData?.runs ?? []).map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="py-1">{new Date(r.started_at).toLocaleString()}</td>
                                    <td>{r.trigger}</td>
                                    <td><Badge variant={headlineTone(r.headline)}>{r.headline}</Badge></td>
                                    <td>{r.violations_major}</td>
                                    <td>{r.check_errors}</td>
                                    <td>{r.duration_ms}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* 6. What can I tune */}
            {policy && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div><p className="font-medium">Scheduled audits</p><p className="text-xs text-muted-foreground">Observation only — never mutates. Every {policy.audit_interval_minutes}m.</p></div>
                            <Switch checked={policy.audit_enabled} onCheckedChange={(v) => savePolicy.mutate({ audit_enabled: v })} />
                        </div>
                        <div className="flex gap-6 text-xs text-muted-foreground">
                            <span>items/batch: {policy.items_per_batch}</span>
                            <span>daily cap: {policy.daily_item_cap}</span>
                            <span>last audit: {policy.last_audit_at ? new Date(policy.last_audit_at).toLocaleString() : 'never'}</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
