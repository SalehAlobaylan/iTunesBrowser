'use client';

import { useState } from 'react';
import { ShieldCheck, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
    useRevertAutopilotTopic,
    useUpdatePreferenceAutopilotPolicy,
} from '@/hooks/use-preference-autopilot';
import type {
    PrefAutoApprovedTopic,
    PreferenceAutopilotPolicy,
    PreferenceTrustBanner,
} from '@/types/platform/preference-autopilot';
import { ConfirmDialog } from '../confirm-dialog';

// The earned auto-approve tier card: trust-progress bars with threshold markers
// (mirrors the studio trust-progress idiom), the human-flipped switch (server
// 409-gates on eligibility — UI disabling is cosmetic), and the quarantine list
// with one-click revert. Auto-REJECT is permanently forbidden and has no UI.

function TrustBar({
    label,
    value,
    threshold,
    max,
    ok,
}: {
    label: string;
    value: number;
    threshold: number;
    max: number;
    ok: boolean;
}) {
    const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
    const markerPct = Math.min(100, (threshold / Math.max(max, 1)) * 100);
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn('tabular-nums font-medium', ok ? 'text-emerald-500' : 'text-foreground')}>
                    {value.toFixed(0)} / {threshold}
                </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn('h-full rounded-full transition-all', ok ? 'bg-emerald-500' : 'bg-primary')}
                    style={{ width: `${pct}%` }}
                />
                <div className="absolute top-[-2px] h-3 w-0.5 bg-foreground/40" style={{ left: `${markerPct}%` }} />
            </div>
        </div>
    );
}

export function AutopilotAutoApproveCard({
    policy,
    trust,
    autoApproved,
}: {
    policy: PreferenceAutopilotPolicy;
    trust: PreferenceTrustBanner;
    autoApproved: PrefAutoApprovedTopic[];
}) {
    const update = useUpdatePreferenceAutopilotPolicy();
    const revert = useRevertAutopilotTopic();
    const [revertTarget, setRevertTarget] = useState<PrefAutoApprovedTopic | null>(null);
    const [confirmEnable, setConfirmEnable] = useState(false);

    const enabled = policy.auto_approve_enabled;
    // The switch unlocks only on earned trust; disabling is always allowed.
    const switchDisabled = update.isPending || (!enabled && !trust.eligible);

    return (
        <Card className={cn(enabled && 'border-emerald-500/40 bg-emerald-500/5')}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className={cn('h-4 w-4', enabled ? 'text-emerald-500' : 'text-muted-foreground')} />
                        Auto-approve tier
                    </CardTitle>
                    <CardDescription>
                        Earned autonomy: quarantined approvals only (unfeatured, tagged autopilot, one-click revert). Auto-reject
                        is permanently forbidden.
                    </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {enabled ? <Badge variant="success">Active</Badge> : trust.eligible ? <Badge variant="info">Eligible</Badge> : <Badge variant="secondary">Earning trust</Badge>}
                    <Switch
                        aria-label="Enable earned auto-approve tier"
                        checked={enabled}
                        disabled={switchDisabled}
                        onCheckedChange={(v) => {
                            if (v) {
                                setConfirmEnable(true); // deliberate flip — confirm before granting autonomy
                            } else {
                                update.mutate({ auto_approve_enabled: false });
                            }
                        }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <TrustBar
                        label="Human decisions recorded"
                        value={trust.decisions}
                        threshold={trust.min_decisions}
                        max={Math.max(trust.min_decisions * 1.4, trust.decisions)}
                        ok={trust.decisions >= trust.min_decisions}
                    />
                    <TrustBar
                        label="Prediction agreement %"
                        value={trust.agreement_pct}
                        threshold={trust.min_agreement_pct}
                        max={100}
                        ok={trust.agreement_pct >= trust.min_agreement_pct && trust.decisions > 0}
                    />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                        tier threshold <strong className="tabular-nums text-foreground">≥{(policy.auto_approve_min_confidence * 100).toFixed(0)}%</strong>{' '}
                        confidence
                    </span>
                    <span>
                        cap <strong className="tabular-nums text-foreground">{policy.max_auto_approvals}</strong> per run
                    </span>
                    {trust.mute_violation && <span className="text-destructive">mute-integrity violation blocks eligibility</span>}
                </div>

                {autoApproved.length > 0 && (
                    <div>
                        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Quarantined approvals</div>
                        <ul className="space-y-1">
                            {autoApproved.map((t) => (
                                <li
                                    key={t.id}
                                    className={cn(
                                        'flex items-center justify-between rounded border border-border px-2 py-1.5 text-xs',
                                        !t.active && 'opacity-55'
                                    )}
                                >
                                    <span className={cn('truncate', !t.active && 'line-through')}>
                                        {t.label_en || t.slug}
                                        <span className="ml-2 tabular-nums text-muted-foreground">{t.member_count} members</span>
                                    </span>
                                    {t.active ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                                            onClick={() => setRevertTarget(t)}
                                        >
                                            <Undo2 className="h-3 w-3" /> Revert
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">reverted</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>

            <ConfirmDialog
                open={confirmEnable}
                onOpenChange={setConfirmEnable}
                title="Enable auto-approve?"
                confirmLabel="Enable"
                pending={update.isPending}
                description={
                    <>
                        The autopilot will create topics from proposals scoring ≥
                        {(policy.auto_approve_min_confidence * 100).toFixed(0)}% confidence — quarantined (never featured, tagged
                        autopilot) and revertible in one click. The server re-verifies trust on every run.
                    </>
                }
                onConfirm={() => update.mutate({ auto_approve_enabled: true }, { onSettled: () => setConfirmEnable(false) })}
            />
            <ConfirmDialog
                open={!!revertTarget}
                onOpenChange={(o) => !o && setRevertTarget(null)}
                title="Revert autopilot topic?"
                destructive
                confirmLabel="Revert"
                pending={revert.isPending}
                description={
                    <>
                        Deactivate <strong>{revertTarget?.label_en || revertTarget?.slug}</strong> and return its proposal to the
                        human queue? Mappings unwind on the next sweep; affected users are queued for recompute.
                    </>
                }
                onConfirm={() => revertTarget && revert.mutate(revertTarget.id, { onSuccess: () => setRevertTarget(null) })}
            />
        </Card>
    );
}
