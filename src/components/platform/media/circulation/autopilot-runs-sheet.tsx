'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MediaCirculationRun } from '@/types/platform/media-circulation';
import { useMediaAutopilotRun, useMediaAutopilotRuns } from '@/hooks/use-media-circulation';

const RUN_STATUS_STYLES: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
    running: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

const ACTION_STATUS_STYLES: Record<string, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    would_apply: 'text-sky-600 dark:text-sky-400',
    would_skip: 'text-muted-foreground',
    skipped: 'text-muted-foreground',
    approval_required: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
};

function formatWhen(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface AutopilotRunsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AutopilotRunsSheet({ open, onOpenChange }: AutopilotRunsSheetProps) {
    const [selectedRunID, setSelectedRunID] = useState<string | null>(null);
    const runsQuery = useMediaAutopilotRuns(20);
    const detailQuery = useMediaAutopilotRun(open ? selectedRunID : null);

    const runs = runsQuery.data ?? [];
    const detail = detailQuery.data;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-2xl">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Autopilot runs & ledger</SheetTitle>
                </SheetHeader>

                {runsQuery.isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                ) : runs.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No runs yet. Enable Autopilot (Observe) or trigger “Run now” — every run lands here with a
                        full action ledger.
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
                        ) : !detail || detail.actions.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                                This run recorded no actions.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Tool</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                            <th className="px-3 py-2 font-medium">Guardrail</th>
                                            <th className="px-3 py-2 font-medium">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.actions.map((action) => (
                                            <tr key={action.id} className="border-t border-border align-top">
                                                <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                                                    {action.tool_name}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'whitespace-nowrap px-3 py-2 font-medium',
                                                        ACTION_STATUS_STYLES[action.status] ?? ''
                                                    )}
                                                >
                                                    {action.status}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                                    {action.guardrail || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {action.error || action.reason || '—'}
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

function RunRow({ run, expanded, onToggle }: { run: MediaCirculationRun; expanded: boolean; onToggle: () => void }) {
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
                    {run.mode === 'observe' ? 'Observe (dry-run)' : 'Safe Auto'}
                    {run.elevated_mode ? ` · ${run.elevated_mode.replace(/_/g, ' ')}` : ''}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                    {formatWhen(run.started_at)} · {run.trigger}
                </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{run.error || run.summary || '—'}</p>
        </button>
    );
}
