'use client';

import { CheckCircle2, CircleDashed, Clock3, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type { MediaCirculationDeliveryProof, MediaCirculationDeliveryProofItem } from '@/types/platform/media-circulation';

const STATE_META: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    verified: {
        label: 'Verified in Pods',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icon: CheckCircle2,
    },
    pending: {
        label: 'Observing delivery',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        icon: Clock3,
    },
    degraded: {
        label: 'Delivery evidence degraded',
        className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        icon: TriangleAlert,
    },
    not_observed: {
        label: 'No delivery proof',
        className: 'border-border bg-muted/60 text-muted-foreground',
        icon: CircleDashed,
    },
};

function stateMeta(state: string) {
    return STATE_META[state] ?? STATE_META.not_observed;
}

function ProofRow({ item, onInspect }: { item: MediaCirculationDeliveryProofItem; onInspect?: (requestID: string) => void }) {
    const meta = stateMeta(item.delivery_state);
    const Icon = meta.icon;
    const observedAt = item.pods_observed_at ?? item.ingest_observed_at;

    return (
        <li className="border-t border-border/70 py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.source_name || 'Unnamed media source'}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={cn('gap-1 border', meta.className)}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                    </Badge>
                    {onInspect ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onInspect(item.request_id)}>
                            Trace
                        </Button>
                    ) : null}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>Source run: {item.request_state.replace(/_/g, ' ')}</span>
                {item.ingest_verdict ? <span>CMS ingest: {item.ingest_verdict}</span> : null}
                {item.pods_verdict ? <span>Pods: {item.pods_verdict}</span> : null}
                {observedAt ? <span>Observed {formatRelativeTime(observedAt)}</span> : null}
                {item.next_observation_at ? <span>Next check {formatRelativeTime(item.next_observation_at)}</span> : null}
            </div>
        </li>
    );
}

export function DeliveryProof({ proof, onInspect }: { proof?: MediaCirculationDeliveryProof; onInspect?: (requestID: string) => void }) {
    if (!proof) {
        return (
            <section className="rounded-xl border border-dashed border-border bg-card/40 p-4">
                <p className="text-sm font-semibold">Pods delivery proof</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    The CMS has not provided this evidence view yet. No delivery state is inferred from worker activity.
                </p>
            </section>
        );
    }

    const items = proof.items.slice(0, 6);
    return (
        <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="pods-delivery-proof-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="brand-overline text-muted-foreground">Consumer boundary</p>
                    <h2 id="pods-delivery-proof-title" className="mt-1 text-base font-semibold tracking-tight">
                        Pods delivery proof
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        CMS verifies source-run media against the same predicate used to serve Pods.
                    </p>
                </div>
                {proof.last_verified_at ? (
                    <span className="text-xs text-muted-foreground">Last verified {formatRelativeTime(proof.last_verified_at)}</span>
                ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ProofCount label="Verified" value={proof.verified} className="text-emerald-600 dark:text-emerald-400" />
                <ProofCount label="Observing" value={proof.pending} className="text-amber-600 dark:text-amber-300" />
                <ProofCount label="Degraded" value={proof.degraded} className="text-rose-600 dark:text-rose-300" />
                <ProofCount label="Not observed" value={proof.not_observed} className="text-muted-foreground" />
            </div>

            {items.length > 0 ? (
                <ul className="mt-4">{items.map((item) => <ProofRow key={item.request_id} item={item} onInspect={onInspect} />)}</ul>
            ) : (
                <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                    No recent media source runs have reached this delivery boundary.
                </p>
            )}
        </section>
    );
}

function ProofCount({ label, value, className }: { label: string; value: number; className: string }) {
    return (
        <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={cn('mt-0.5 text-xl font-semibold tabular-nums', className)}>{value}</p>
        </div>
    );
}
