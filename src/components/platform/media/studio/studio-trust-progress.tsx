'use client';

import { Badge } from '@/components/ui/badge';
import type {
    MediaStudioAutopilotPolicy,
    StudioReasonCodeTrust,
} from '@/types/platform/media-studio-autopilot';

interface Props {
    trust: StudioReasonCodeTrust[];
    policy: MediaStudioAutopilotPolicy;
}

/**
 * How close each reason code is to earning auto-publish. A code auto-publishes
 * only when all three thresholds are met. The bars turn the trust table into a
 * progress story: "merged_short is 3/20 human decisions in — not there yet."
 */
export function StudioTrustProgress({ trust, policy }: Props) {
    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">
                <span className="font-editorial">Trust to auto-publish</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                A code auto-publishes only after enough human decisions prove the call is safe.
            </p>

            <div className="mt-3 space-y-4">
                {trust.map((t) => {
                    const decisionsPct = clamp((t.decisions / policy.trust_min_decisions) * 100);
                    const approveOk = t.decisions > 0 && t.approve_pct >= policy.trust_min_approve_pct;
                    const reversalOk = t.reversal_pct < policy.trust_max_reversal_pct;
                    const decisionsOk = t.decisions >= policy.trust_min_decisions;
                    return (
                        <div key={t.code}>
                            <div className="mb-1.5 flex items-center gap-2">
                                <span className="font-mono text-xs">{t.code}</span>
                                <Badge
                                    className={
                                        t.earned
                                            ? 'bg-emerald-500/15 text-emerald-300'
                                            : 'bg-muted text-muted-foreground'
                                    }
                                >
                                    {t.earned ? 'earned' : 'earning'}
                                </Badge>
                            </div>
                            <Bar
                                label={`Human decisions ${t.decisions}/${policy.trust_min_decisions}`}
                                pct={decisionsPct}
                                ok={decisionsOk}
                            />
                            <Bar
                                label={`Approve rate ${t.approve_pct.toFixed(0)}% (need ≥${policy.trust_min_approve_pct}%)`}
                                pct={clamp(t.approve_pct)}
                                ok={approveOk}
                                threshold={policy.trust_min_approve_pct}
                            />
                            <Bar
                                label={`Reversal ${t.reversal_pct.toFixed(0)}% (need <${policy.trust_max_reversal_pct}%)`}
                                pct={clamp(t.reversal_pct)}
                                ok={reversalOk}
                                invert
                                threshold={policy.trust_max_reversal_pct}
                            />
                        </div>
                    );
                })}
                {trust.length === 0 && (
                    <p className="text-xs text-muted-foreground">No auto-publish candidate codes.</p>
                )}
            </div>
        </section>
    );
}

function Bar({ label, pct, ok, threshold, invert }: { label: string; pct: number; ok: boolean; threshold?: number; invert?: boolean }) {
    const fill = ok ? '#34d399' : invert && pct > 0 ? '#fb7185' : '#e0a92e';
    return (
        <div className="mb-1.5">
            <div className="mb-0.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{label}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: fill }} />
                {threshold != null && (
                    <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${clamp(threshold)}%` }} />
                )}
            </div>
        </div>
    );
}

function clamp(n: number): number {
    return Math.max(0, Math.min(100, n));
}
