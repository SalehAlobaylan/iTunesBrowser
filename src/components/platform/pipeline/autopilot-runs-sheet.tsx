'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PipelineAutopilotRun } from '@/types/platform/pipeline';
import { usePipelineAutopilotRun, usePipelineAutopilotRuns } from '@/hooks/use-pipeline';

const RUN_STATUS_STYLES: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
    running: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

const ACTION_STATUS_STYLES: Record<string, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    would_execute: 'text-sky-600 dark:text-sky-400',
    would_skip: 'text-muted-foreground',
    skipped: 'text-muted-foreground',
    attention: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
};

const HEADLINE_LABELS: Record<string, string> = {
    flowing: 'Flowing',
    repairing: 'Repairing',
    backlogged: 'Backlogged',
    clogged: 'Needs attention',
    degraded: 'Degraded',
};

function formatWhen(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusDelta(run: PipelineAutopilotRun): string | null {
    const before = run.health_before?.status_counts;
    const after = run.health_after?.status_counts;
    if (!before || !after) return null;
    return `failed ${before.FAILED} -> ${after.FAILED}, pending ${before.PENDING} -> ${after.PENDING}`;
}

interface AutopilotRunsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PipelineAutopilotRunsSheet({ open, onOpenChange }: AutopilotRunsSheetProps) {
    const [selectedRunID, setSelectedRunID] = useState<string | null>(null);
    const runsQuery = usePipelineAutopilotRuns(20);
    const detailQuery = usePipelineAutopilotRun(open ? selectedRunID : null);

    const runs = Array.isArray(runsQuery.data?.items) ? runsQuery.data.items : [];
    const detail = detailQuery.data;
    const actions = Array.isArray(detail?.actions) ? detail.actions : [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-2xl">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Pipeline Autopilot runs &amp; ledger</SheetTitle>
                </SheetHeader>

                {runsQuery.isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                ) : runs.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No runs yet. Enable Observe or trigger a manual run to create the first dry-run ledger.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {runs.map((run) => (
                            <RunRow
                                key={run.id}
                                run={run}
                                expanded={selectedRunID === run.id}
                                onToggle={() => setSelectedRunID(selectedRunID === run.id ? null : run.id)}
                            />
                        ))}
                    </div>
                )}

                {selectedRunID && (
                    <div className="mt-4">
                        <h3 className="mb-2 text-sm font-semibold">Action ledger</h3>
                        {detailQuery.isLoading ? (
                            <Skeleton className="h-40 w-full rounded-lg" />
                        ) : !detail || actions.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                                This run recorded no actions.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Lane</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                            <th className="px-3 py-2 font-medium">Outcome</th>
                                            <th className="px-3 py-2 font-medium">Guardrail</th>
                                            <th className="px-3 py-2 font-medium">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actions.map((action) => (
                                            <tr key={action.id} className="border-t border-border align-top">
                                                <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                                                    {action.lane}
                                                </td>
                                                <td className={cn('whitespace-nowrap px-3 py-2 font-medium', ACTION_STATUS_STYLES[action.status] ?? '')}>
                                                    {action.status}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                                    {action.outcome || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                                    {action.guardrail || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {action.reason || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function RunRow({
    run,
    expanded,
    onToggle,
}: {
    run: PipelineAutopilotRun;
    expanded: boolean;
    onToggle: () => void;
}) {
    const delta = statusDelta(run);
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'w-full rounded-lg border p-3 text-left transition-colors',
                expanded ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
            )}
        >
            <div className="flex items-center gap-2">
                <Badge className={cn('border-transparent', RUN_STATUS_STYLES[run.status] ?? 'bg-muted text-muted-foreground')}>
                    {run.status}
                </Badge>
                <span className="text-xs font-medium">
                    {run.mode === 'observe' ? 'Observe' : 'Safe Auto'}
                    {run.elevated_mode ? ` · ${run.elevated_mode.replace(/_/g, ' ')}` : ''}
                </span>
                {run.headline ? (
                    <span className="text-[11px] text-muted-foreground">
                        · {HEADLINE_LABELS[run.headline] ?? run.headline}
                    </span>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">
                    {formatWhen(run.started_at)} · {run.trigger}
                </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                {run.error || run.summary || '-'}
                {delta ? ` · ${delta}` : ''}
            </p>
        </button>
    );
}
