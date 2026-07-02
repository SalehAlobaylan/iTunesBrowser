'use client';

import { Check, MousePointerClick, Undo2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type { MediaCirculationCockpitRecommendation } from '@/types/platform/media-circulation';
import { isRevertible } from './decision-queue';
import { laneChipClass, statusChipClass } from './verdict-styles';

interface InspectorProps {
    rec?: MediaCirculationCockpitRecommendation;
    engineEnabled: boolean;
    acting: boolean;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
    onRevert: (id: string) => void;
}

/** Score factors surfaced as bars — only when the engine actually computed them. */
const SCORE_FACTORS: Array<{ key: string; label: string }> = [
    { key: 'quality_prior', label: 'Quality prior' },
    { key: 'bucket_demand_match', label: 'Bucket demand' },
    { key: 'freshness', label: 'Freshness' },
    { key: 'cost_headroom', label: 'Cost headroom' },
];

/** Metrics that already render elsewhere in the panel and would be noise here. */
const HIDDEN_METRICS = new Set([
    'quality_prior',
    'bucket_demand_match',
    'freshness',
    'cost_headroom',
    'source_name',
]);

export function Inspector({ rec, engineEnabled, acting, onApply, onDismiss, onRevert }: InspectorProps) {
    if (!rec) {
        return (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
                <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                    Select a recommendation to read its proof.
                </p>
            </div>
        );
    }

    const proofPoints = rec.proof_points?.length ? rec.proof_points : rec.reasons ?? [];
    const scoreFactors = SCORE_FACTORS.map(({ key, label }) => ({
        label,
        value: typeof rec.metrics?.[key] === 'number' ? (rec.metrics[key] as number) : undefined,
    })).filter((f) => f.value !== undefined);
    const extraMetrics = Object.entries(rec.metrics ?? {}).filter(
        ([key, value]) => !HIDDEN_METRICS.has(key) && value !== null && value !== undefined && value !== ''
    );

    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
                <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide', laneChipClass(rec.action_lane))}>
                        {rec.verdict.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px] capitalize', statusChipClass(rec.status))}>
                        {rec.status}
                    </Badge>
                </div>
                <h2 className="mt-2 text-base font-semibold leading-snug" dir="auto">
                    {rec.display_title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground" dir="auto">
                    {rec.display_subtitle}
                </p>
                <div className="mt-3 flex items-baseline justify-between rounded-lg border border-border bg-background px-3 py-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{rec.priority_label}</span>
                    <span className="text-lg font-semibold tabular-nums">{rec.primary_metric}</span>
                </div>
            </div>

            <div className="space-y-5 p-4">
                <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Why the engine says this</h3>
                    <ul className="mt-2 space-y-1.5">
                        {proofPoints.map((point, index) => (
                            <li key={`${index}-${point.slice(0, 24)}`} className="flex gap-2 text-sm leading-5">
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-news" />
                                <span dir="auto">{point}</span>
                            </li>
                        ))}
                        {proofPoints.length === 0 && (
                            <li className="text-sm text-muted-foreground">No proof points were recorded.</li>
                        )}
                    </ul>
                </section>

                {scoreFactors.length > 0 && (
                    <section>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Score factors · {rec.score.toFixed(3)}
                        </h3>
                        <div className="mt-2 space-y-2">
                            {scoreFactors.map(({ label, value }) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium tabular-nums">{Math.round((value ?? 0) * 100)}%</span>
                                    </div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-news transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, (value ?? 0) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {extraMetrics.length > 0 && (
                    <section>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence</h3>
                        <dl className="mt-2 divide-y divide-border/60">
                            {extraMetrics.slice(0, 10).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                                    <dt className="truncate text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                                    <dd className="max-w-[55%] truncate font-medium tabular-nums" dir="auto">
                                        {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}

                {rec.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" disabled={acting} onClick={() => onDismiss(rec.id)}>
                            <X className="mr-2 h-4 w-4" />
                            Dismiss
                        </Button>
                        <Button
                            disabled={acting || !engineEnabled}
                            onClick={() => onApply(rec.id)}
                            className="bg-news text-news-foreground hover:bg-news/90 active:scale-[0.98]"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Apply
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-lg border border-border bg-background p-3 text-sm">
                        <p>
                            Outcome: <span className="font-medium capitalize">{(rec.outcome ?? rec.status).replace(/_/g, ' ')}</span>
                        </p>
                        {rec.applied_at && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatRelativeTime(rec.applied_at)}
                                {rec.applied_by ? ` by ${rec.applied_by}` : ''}
                            </p>
                        )}
                    </div>
                )}
                {isRevertible(rec) && (
                    <Button className="w-full" variant="outline" disabled={acting} onClick={() => onRevert(rec.id)}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Revert this action
                    </Button>
                )}
            </div>
        </div>
    );
}
