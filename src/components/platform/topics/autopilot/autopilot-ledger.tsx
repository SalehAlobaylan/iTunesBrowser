'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePreferenceAutopilotActions } from '@/hooks/use-preference-autopilot';
import type { PreferenceActionFilters } from '@/types/platform/preference-autopilot';

// Deep ledger explorer — cross-RUN, filterable, paged. This deliberately exceeds
// the family's per-run-sheet standard: every action the autopilot ever considered
// is queryable by class / status / guardrail / subject without leaving the tab.

const ALL = '__all__';

const CLASSES = [
    'map_sweep',
    'dirty_sweep',
    'centroid_refresh',
    'member_refresh',
    'recompute',
    'mine',
    'proposal_enrich',
    'auto_approve',
    'merge_suggest',
    'snapshot',
];

const STATUSES = ['success', 'error', 'skipped', 'would_trigger', 'would_skip', 'baseline_success', 'baseline_error'];

const GUARDRAILS = [
    'run_cap',
    'pending_ceiling',
    'breaker_tripped',
    'class_breaker',
    'empty_catalog',
    'enrichment_down',
    'already_mapped',
    'stale_stats',
    'trust_gate',
    'blocker_flag',
    'slug_exists',
];

const STATUS_TONE: Record<string, string> = {
    success: 'text-emerald-500',
    baseline_success: 'text-emerald-500',
    would_trigger: 'text-primary',
    would_skip: 'text-muted-foreground',
    skipped: 'text-muted-foreground',
    error: 'text-destructive',
    baseline_error: 'text-destructive',
};

const PAGE_SIZE = 25;

function FilterSelect({
    value,
    onChange,
    placeholder,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    options: string[];
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL}>{placeholder}</SelectItem>
                {options.map((o) => (
                    <SelectItem key={o} value={o}>
                        {o}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function AutopilotLedger() {
    const [actionClass, setActionClass] = useState(ALL);
    const [status, setStatus] = useState(ALL);
    const [guardrail, setGuardrail] = useState(ALL);
    const [subject, setSubject] = useState('');
    const [offset, setOffset] = useState(0);
    const debouncedSubject = useDebouncedValue(subject, 300);

    const filters: PreferenceActionFilters = {
        limit: PAGE_SIZE,
        offset,
        ...(actionClass !== ALL && { action_class: actionClass }),
        ...(status !== ALL && { status }),
        ...(guardrail !== ALL && { guardrail }),
        ...(debouncedSubject.trim() && { subject_ref: debouncedSubject.trim() }),
    };
    const { data, isLoading, isFetching, isError, refetch } = usePreferenceAutopilotActions(filters);
    const items = data?.items ?? [];

    const setFilter = (setter: (v: string) => void) => (v: string) => {
        setter(v);
        setOffset(0);
    };
    const clearFilters = () => {
        setActionClass(ALL);
        setStatus(ALL);
        setGuardrail(ALL);
        setSubject('');
        setOffset(0);
    };
    const filtered = actionClass !== ALL || status !== ALL || guardrail !== ALL || subject.trim() !== '';

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div>
                    <CardTitle className="text-base">Ledger explorer</CardTitle>
                    <CardDescription>Every action across every run — filter by class, outcome, guardrail, or subject.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <FilterSelect value={actionClass} onChange={setFilter(setActionClass)} placeholder="All classes" options={CLASSES} />
                    <FilterSelect value={status} onChange={setFilter(setStatus)} placeholder="All outcomes" options={STATUSES} />
                    <FilterSelect value={guardrail} onChange={setFilter(setGuardrail)} placeholder="All guardrails" options={GUARDRAILS} />
                    <Input
                        value={subject}
                        onChange={(e) => {
                            setSubject(e.target.value);
                            setOffset(0);
                        }}
                        placeholder="Subject (proposal id / topic uuid)…"
                        className="h-8 w-[220px] text-xs"
                    />
                    {filtered && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
                            <RotateCcw className="h-3 w-3" /> Clear
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full rounded" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
                        <span className="text-destructive">Ledger rows could not be loaded.</span>
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : items.length === 0 ? (
                    <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No ledger rows match these filters.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <th className="px-2 py-1.5 font-medium">When</th>
                                    <th className="px-2 py-1.5 font-medium">Class</th>
                                    <th className="px-2 py-1.5 font-medium">Subject</th>
                                    <th className="px-2 py-1.5 font-medium">Outcome</th>
                                    <th className="px-2 py-1.5 font-medium">Guardrail</th>
                                    <th className="px-2 py-1.5 font-medium">Reason</th>
                                    <th className="px-2 py-1.5 text-right font-medium">ms</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((a) => (
                                    <tr key={a.id} className="border-b border-border/60 align-top">
                                        <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                                            {new Date(a.started_at).toLocaleString()}
                                        </td>
                                        <td className="px-2 py-1.5 font-mono text-[11px]">{a.action_class}</td>
                                        <td className="max-w-[140px] truncate px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                                            {a.subject_ref || '—'}
                                        </td>
                                        <td className={cn('px-2 py-1.5 font-medium', STATUS_TONE[a.status] ?? '')}>{a.status}</td>
                                        <td className="px-2 py-1.5 text-muted-foreground">{a.guardrail || '—'}</td>
                                        <td className="max-w-[380px] px-2 py-1.5 text-muted-foreground">{a.reason || '—'}</td>
                                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{a.duration_ms}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        rows {items.length === 0 ? 0 : offset + 1}–{offset + items.length}
                        {isFetching && ' · updating…'}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                        >
                            <ChevronLeft className="h-3 w-3" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={!data?.has_more}
                            onClick={() => setOffset(offset + PAGE_SIZE)}
                        >
                            Next <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
