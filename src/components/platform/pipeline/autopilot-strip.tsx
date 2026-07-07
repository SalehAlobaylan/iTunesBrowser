'use client';

import { useMemo, useState } from 'react';
import { Bot, ListChecks, Pause, Play, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PipelineAutopilotPolicy, PipelineAutopilotStatus } from '@/types/platform/pipeline';
import {
    useBulkStatusChange,
    useElevatePipelineAutopilot,
    usePausePipelineAutopilot,
    usePipelineAutopilot,
    useRetryFailed,
    useRunPipelineAutopilotNow,
    useUpdatePipelineAutopilotPolicy,
} from '@/hooks/use-pipeline';
import { PipelineAutopilotRunsSheet } from './autopilot-runs-sheet';

const STATE_STYLES: Record<string, string> = {
    off: 'bg-muted text-muted-foreground',
    observe: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    safe_auto: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    elevated: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    paused: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

const STATE_LABELS: Record<string, string> = {
    off: 'Off',
    observe: 'Observe',
    safe_auto: 'Safe Auto',
    elevated: 'Elevated',
    paused: 'Paused',
};

const TRUST_STYLES: Record<string, string> = {
    trusted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    probation: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    demoted: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
};

function formatWhen(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function PipelineAutopilotStrip() {
    const { data: autopilot, isLoading } = usePipelineAutopilot();
    const savePolicy = useUpdatePipelineAutopilotPolicy();
    const runNow = useRunPipelineAutopilotNow();
    const pause = usePausePipelineAutopilot();
    const elevate = useElevatePipelineAutopilot();
    const retryFailed = useRetryFailed();
    const bulkStatus = useBulkStatusChange();

    const [runsOpen, setRunsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const exhausted = useMemo(
        () => autopilot?.attention.find((item) => item.lane === 'failed_exhausted'),
        [autopilot]
    );
    const exhaustedIds = exhausted?.item_ids ?? [];

    if (isLoading || !autopilot) {
        return <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />;
    }

    const paused = autopilot.state === 'paused';
    const earned = autopilot.trust.filter((t) => t.earned);
    const patch = (data: Partial<PipelineAutopilotPolicy>) => savePolicy.mutate(data);
    const enableObserve = () => patch({ enabled: true, mode: 'observe' });
    const enableSafeAuto = () => patch({ enabled: true, mode: 'safe_auto' });
    const backToObserve = () => patch({ mode: 'observe' });
    const disable = () => patch({ enabled: false });

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Pipeline Autopilot</span>
                    <Badge className={cn('border-transparent', STATE_STYLES[autopilot.state] ?? STATE_STYLES.off)}>
                        {STATE_LABELS[autopilot.state] ?? autopilot.state}
                        {autopilot.state === 'elevated' && autopilot.elevated_mode
                            ? ` · ${autopilot.elevated_mode.replace(/_/g, ' ')}`
                            : ''}
                    </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                        Last run:{' '}
                        {autopilot.last_run
                            ? `${formatWhen(autopilot.last_run.started_at)} - ${autopilot.last_run.summary || autopilot.last_run.status}`
                            : 'never'}
                    </span>
                    {autopilot.enabled && !paused && <span>Next: {formatWhen(autopilot.next_run_at)}</span>}
                    {paused && <span>Paused until {formatWhen(autopilot.paused_until)}</span>}
                    <span>Trust: {earned.length}/{autopilot.trust.length || 0} lanes allowed</span>
                    {autopilot.attention.length > 0 && <span>{autopilot.attention.length} attention signals</span>}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRunsOpen(true)}>
                        <ListChecks className="mr-1 h-4 w-4" />
                        Runs &amp; ledger
                    </Button>
                    {autopilot.enabled && (
                        <>
                            <Button variant="outline" size="sm" disabled={runNow.isPending} onClick={() => runNow.mutate()}>
                                <Play className="mr-1 h-4 w-4" />
                                {runNow.isPending ? 'Running...' : 'Run now'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pause.isPending}
                                onClick={() => pause.mutate(paused ? 0 : 360)}
                            >
                                <Pause className="mr-1 h-4 w-4" />
                                {paused ? 'Resume' : 'Pause 6h'}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={elevate.isPending || savePolicy.isPending}>
                                        More
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>Elevated mode</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => elevate.mutate({ mode: 'backlog_drain', minutes: 720 })}>
                                        <div>
                                            <div className="text-sm">Backlog drain</div>
                                            <div className="text-xs text-muted-foreground">Item and batch caps x3 for 12h</div>
                                        </div>
                                    </DropdownMenuItem>
                                    {autopilot.elevated_mode ? (
                                        <DropdownMenuItem onClick={() => elevate.mutate({ mode: '' })}>
                                            Clear elevated mode
                                        </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Settings &amp; trust
                                    </DropdownMenuItem>
                                    {autopilot.mode === 'safe_auto' ? (
                                        <DropdownMenuItem onClick={backToObserve}>Drop to Observe</DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem className="text-destructive" onClick={disable}>
                                        Disable Autopilot
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    {!autopilot.enabled && (
                        <Button size="sm" disabled={savePolicy.isPending} onClick={enableObserve}>
                            Enable Observe
                        </Button>
                    )}
                    {autopilot.enabled && autopilot.mode === 'observe' && (
                        <Button size="sm" disabled={savePolicy.isPending} onClick={enableSafeAuto}>
                            Enable Safe Auto
                        </Button>
                    )}
                </div>
            </div>

            {autopilot.recommended_action ? (
                <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Recommended:</span> {autopilot.recommended_action}
                </p>
            ) : null}

            {autopilot.trust.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {autopilot.trust.map((t) => (
                        <span
                            key={t.lane}
                            title={`${t.outcomes} outcomes · ${t.recovered} recovered · ${t.success_pct.toFixed(0)}% success`}
                            className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', TRUST_STYLES[t.state] ?? 'border-border bg-muted/40 text-muted-foreground')}
                        >
                            {t.lane.replace(/_/g, ' ')}
                            <span className="opacity-70">{t.state === 'trusted' ? 'ok' : t.state === 'demoted' ? 'held' : `${t.outcomes}`}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            {exhausted && exhausted.count > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                        {exhausted.count} exhausted failed item{exhausted.count === 1 ? '' : 's'} need eyes.
                    </span>
                    <span className="text-muted-foreground">Showing actions for the first {exhaustedIds.length}.</span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={exhaustedIds.length === 0 || retryFailed.isPending}
                        onClick={() => retryFailed.mutate({ ids: exhaustedIds, limit: exhaustedIds.length })}
                    >
                        Retry anyway
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={exhaustedIds.length === 0 || bulkStatus.isPending}
                        onClick={() => bulkStatus.mutate({ ids: exhaustedIds, to_status: 'ARCHIVED', dry_run: false })}
                    >
                        Archive selected
                    </Button>
                </div>
            ) : null}

            <PipelineAutopilotRunsSheet open={runsOpen} onOpenChange={setRunsOpen} />
            <SettingsSheet
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                autopilot={autopilot}
                saving={savePolicy.isPending}
                onSave={patch}
            />
        </div>
    );
}

const KNOBS: { key: keyof PipelineAutopilotPolicy; label: string; hint: string }[] = [
    { key: 'interval_minutes', label: 'Interval', hint: 'Minutes between scheduled runs.' },
    { key: 'max_items_per_run', label: 'Items / run', hint: 'Total exact-ID retries per run.' },
    { key: 'max_batches_per_run', label: 'Batches / run', hint: 'Distinct lane/source/queue batches.' },
    { key: 'max_attempts', label: 'Attempt cap', hint: 'Autopilot retries per item lifetime.' },
    { key: 'retry_backoff_hours', label: 'Backoff hours', hint: 'Hours before the same item is eligible again.' },
    { key: 'pending_age_floor_minutes', label: 'Pending age floor', hint: 'Minutes before PENDING can be retried.' },
    { key: 'processing_stuck_hours', label: 'Processing stuck hours', hint: 'Hours before PROCESSING is reset.' },
    { key: 'max_queue_depth', label: 'Queue depth cap', hint: 'Skip when target queue is above this.' },
    { key: 'per_source_daily_retries', label: 'Source daily cap', hint: 'Rolling 24h retry ceiling per source.' },
    { key: 'recovery_cooldown_minutes', label: 'Recovery cooldown', hint: 'Hold retries after service recovery.' },
    { key: 'trust_min_outcomes', label: 'Trust outcomes', hint: 'Resolved outcomes before demotion/trust.' },
    { key: 'trust_min_success_pct', label: 'Trust success %', hint: 'Minimum success rate for calm operation.' },
];

function SettingsSheet({
    open,
    onOpenChange,
    autopilot,
    saving,
    onSave,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    autopilot: PipelineAutopilotStatus;
    saving: boolean;
    onSave: (data: Partial<PipelineAutopilotPolicy>) => void;
}) {
    const [draft, setDraft] = useState<Partial<PipelineAutopilotPolicy>>({});
    const value = (key: keyof PipelineAutopilotPolicy) =>
        (draft[key] as number | undefined) ?? (autopilot.policy[key] as number);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Pipeline Autopilot settings</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3">
                    {KNOBS.map((k) => (
                        <div key={k.key} className="space-y-1">
                            <Label htmlFor={k.key} className="text-xs">{k.label}</Label>
                            <Input
                                id={k.key}
                                type="number"
                                value={value(k.key)}
                                onChange={(e) => setDraft((d) => ({ ...d, [k.key]: Number(e.target.value) }))}
                            />
                            <p className="text-[11px] text-muted-foreground">{k.hint}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDraft({})}>Reset</Button>
                    <Button
                        size="sm"
                        disabled={saving || Object.keys(draft).length === 0}
                        onClick={() => {
                            onSave(draft);
                            setDraft({});
                        }}
                    >
                        Save settings
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
