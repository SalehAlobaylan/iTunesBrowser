'use client';

import { useState } from 'react';
import { AlertTriangle, ListRestart, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    useClearRecomputeRow,
    useRecomputeQueue,
    useRequeueRecompute,
    useResetCursors,
} from '@/hooks/use-preference-autopilot';
import type { PrefClassBreaker, PreferenceAutopilotPolicy, RecomputeQueueRow } from '@/types/platform/preference-autopilot';
import { ConfirmDialog } from '../confirm-dialog';

// Ops panel — the "under the hood" management surface: the durable recompute
// queue (view/requeue/clear), per-class breaker state, and sweep-cursor
// checkpoints with a reset. All actions are audited server-side.

export function AutopilotOps({
    breakers,
    policy,
}: {
    breakers: PrefClassBreaker[];
    policy: PreferenceAutopilotPolicy;
}) {
    const queue = useRecomputeQueue(50);
    const requeue = useRequeueRecompute();
    const clearRow = useClearRecomputeRow();
    const resetCursors = useResetCursors();
    const [confirmReset, setConfirmReset] = useState(false);
    const [clearTarget, setClearTarget] = useState<RecomputeQueueRow | null>(null);

    const rows = queue.data?.items ?? [];
    const total = queue.data?.total ?? 0;
    const tripped = breakers.filter((b) => b.tripped);

    const cursors: { key: string; label: string; value: number }[] = [
        { key: 'item_map', label: 'Item sweep', value: policy.item_map_cursor ?? 0 },
        { key: 'story_map', label: 'Story sweep', value: policy.story_map_cursor ?? 0 },
        { key: 'dirty_item', label: 'Dirty items', value: policy.dirty_item_cursor ?? 0 },
        { key: 'dirty_story', label: 'Dirty stories', value: policy.dirty_story_cursor ?? 0 },
    ];

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-base">Operations</CardTitle>
                    <CardDescription>Recompute queue, class breakers, and sweep checkpoints.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Class breakers */}
                <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">Class breakers</div>
                    {breakers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No action history yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {breakers.map((b) => (
                                <span
                                    key={b.class}
                                    title={`last: ${b.last_status} · ${new Date(b.at).toLocaleString()}`}
                                    className={cn(
                                        'rounded-full border px-2.5 py-0.5 font-mono text-[11px]',
                                        b.tripped
                                            ? 'border-destructive/50 bg-destructive/10 text-destructive'
                                            : 'border-border text-muted-foreground'
                                    )}
                                >
                                    {b.tripped && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                                    {b.class}
                                </span>
                            ))}
                        </div>
                    )}
                    {tripped.length > 0 && (
                        <p className="mt-1.5 text-[11px] text-destructive">
                            {tripped.length} class(es) quarantined after a failure. A manual run retries them after remediation.
                        </p>
                    )}
                </div>

                {/* Recompute queue */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Recompute queue <span className="tabular-nums">({total})</span>
                        </span>
                    </div>
                    {queue.isLoading ? (
                        <Skeleton className="h-16 w-full rounded" />
                    ) : queue.isError ? (
                        <div className="flex items-center justify-between gap-3 rounded border border-destructive/40 bg-destructive/5 p-3 text-xs">
                            <span className="text-destructive">Recompute queue unavailable.</span>
                            <Button variant="outline" size="sm" onClick={() => queue.refetch()}>
                                Retry
                            </Button>
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
                            Queue drained — no pending affinity repairs.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <th className="px-2 py-1 font-medium">User</th>
                                        <th className="px-2 py-1 font-medium">Reason</th>
                                        <th className="px-2 py-1 font-medium">Attempts</th>
                                        <th className="px-2 py-1 font-medium">Last error</th>
                                        <th className="px-2 py-1 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.user_id} className="border-b border-border/60">
                                            <td className="max-w-[160px] truncate px-2 py-1.5 font-mono text-[11px]">{r.user_id}</td>
                                            <td className="px-2 py-1.5">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {r.reason}
                                                </Badge>
                                            </td>
                                            <td className={cn('px-2 py-1.5 tabular-nums', r.attempts > 2 && 'text-destructive')}>{r.attempts}</td>
                                            <td className="max-w-[220px] truncate px-2 py-1.5 text-muted-foreground">{r.last_error || '—'}</td>
                                            <td className="px-2 py-1.5 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 gap-1 px-1.5 text-[11px]"
                                                    disabled={requeue.isPending}
                                                    onClick={() => requeue.mutate(r.user_id)}
                                                >
                                                    <RefreshCw className="h-3 w-3" /> Requeue
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 gap-1 px-1.5 text-[11px] text-destructive hover:text-destructive"
                                                    disabled={clearRow.isPending}
                                                    onClick={() => setClearTarget(r)}
                                                >
                                                    <Trash2 className="h-3 w-3" /> Clear
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sweep cursors */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Sweep checkpoints</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 gap-1 px-2 text-[11px]"
                            onClick={() => setConfirmReset(true)}
                        >
                            <ListRestart className="h-3 w-3" /> Reset all
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {cursors.map((cur) => (
                            <div key={cur.key} className="rounded-lg border border-border px-2.5 py-1.5">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{cur.label}</div>
                                <div className="font-mono text-sm tabular-nums">{cur.value.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            <ConfirmDialog
                open={confirmReset}
                onOpenChange={setConfirmReset}
                title="Reset sweep cursors?"
                confirmLabel="Reset"
                pending={resetCursors.isPending}
                description="Sweeps restart from the head of the corpus on the next run. Safe — cursors only control where bounded sweeps resume; nothing is deleted."
                onConfirm={() => resetCursors.mutate([], { onSettled: () => setConfirmReset(false) })}
            />
            <ConfirmDialog
                open={!!clearTarget}
                onOpenChange={(open) => !open && setClearTarget(null)}
                title="Clear recompute repair?"
                destructive
                confirmLabel="Clear row"
                pending={clearRow.isPending}
                description={
                    <>
                        Remove <strong className="font-mono">{clearTarget?.user_id}</strong> from the durable repair queue? This
                        does not recompute affinity and should only be used when the row is invalid or repaired elsewhere.
                    </>
                }
                onConfirm={() =>
                    clearTarget && clearRow.mutate(clearTarget.user_id, { onSuccess: () => setClearTarget(null) })
                }
            />
        </Card>
    );
}
