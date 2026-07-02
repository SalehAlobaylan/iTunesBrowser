'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Check,
    ChevronRight,
    CirclePause,
    FileText,
    Filter,
    Gauge,
    History,
    Loader2,
    Radio,
    RefreshCw,
    Search,
    Settings2,
    ShieldCheck,
    Snowflake,
    X,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/hooks/use-storage';
import type {
    MediaCirculationCockpit,
    MediaCirculationCockpitBucket,
    MediaCirculationCockpitRecommendation,
    MediaCirculationPolicy,
    RecommendationActionLane,
} from '@/types/platform/media-circulation';
import { SettingsForm } from './settings-form';
import { bucketStateClass, headlineClass, verdictClass } from './verdict-styles';

type LaneFilter = 'attention' | 'all' | RecommendationActionLane;
type UnitFilter = 'all' | 'source' | 'item_family';

interface MediaCirculationCockpitProps {
    cockpit?: MediaCirculationCockpit;
    loading: boolean;
    fetching: boolean;
    generating: boolean;
    acting: boolean;
    savingPolicy: boolean;
    onGenerate: () => void;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
    onSavePolicy: (data: Partial<MediaCirculationPolicy>) => void;
}

const LANES: Array<{ value: LaneFilter; label: string; icon: typeof Zap }> = [
    { value: 'attention', label: 'Needs attention', icon: Zap },
    { value: 'all', label: 'All', icon: History },
    { value: 'pull', label: 'Pull', icon: ArrowDownRight },
    { value: 'limit_skip', label: 'Limit / Skip', icon: CirclePause },
    { value: 'protect', label: 'Protect', icon: ShieldCheck },
    { value: 'cool', label: 'Cool', icon: Snowflake },
    { value: 'downrank', label: 'Downrank', icon: ArrowUpRight },
    { value: 'review', label: 'Review', icon: AlertTriangle },
];

const STATUS_FILTERS = ['all', 'pending', 'applied', 'dismissed', 'superseded'] as const;
const PRESS_TEXT = 'text-[#c1121f] dark:text-[#ff6b6b]';
const PRESS_SUBTLE = 'border-[#e63946]/50 bg-[#e63946]/10 text-[#c1121f] dark:text-[#ff6b6b]';
const PRESS_SELECTED = 'border-[#e63946] bg-[#e63946]/10';
const PRESS_BUTTON = 'border-[#e63946] bg-[#e63946] text-white hover:bg-[#c1121f] hover:text-white';

function laneLabel(lane: string): string {
    return LANES.find((l) => l.value === lane)?.label ?? lane.replace(/_/g, ' ');
}

function laneTone(lane: string): string {
    switch (lane) {
        case 'pull':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
        case 'limit_skip':
            return 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300';
        case 'protect':
            return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300';
        case 'cool':
            return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';
        case 'downrank':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        case 'review':
            return PRESS_SUBTLE;
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

function statusTone(status: string): string {
    switch (status) {
        case 'pending':
            return PRESS_SUBTLE;
        case 'applied':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
        case 'dismissed':
            return 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300';
        case 'superseded':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

function metricNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function metricString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
}

function metricArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        : [];
}

function pct(value?: number): string {
    if (value === undefined) return '0%';
    return `${Math.round(value * 100)}%`;
}

function updateParam(params: URLSearchParams, key: string, value?: string) {
    if (!value || value === 'all' || value === '') params.delete(key);
    else params.set(key, value);
}

export function MediaCirculationCockpitView({
    cockpit,
    loading,
    fetching,
    generating,
    acting,
    savingPolicy,
    onGenerate,
    onApply,
    onDismiss,
    onSavePolicy,
}: MediaCirculationCockpitProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const lane = (searchParams.get('lane') || 'attention') as LaneFilter;
    const status = searchParams.get('status') || 'all';
    const unit = (searchParams.get('unit') || 'all') as UnitFilter;
    const verdict = searchParams.get('verdict') || 'all';
    const bucket = searchParams.get('bucket') || 'all';
    const query = searchParams.get('q') || '';
    const selectedID = searchParams.get('selected') || '';
    const detailsOpen = searchParams.get('details') === '1';
    const policyOpen = searchParams.get('policy') === '1';

    const setParams = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(changes).forEach(([key, value]) => {
            if (key === 'lane') {
                if (!value || value === 'attention') next.delete(key);
                else next.set(key, value);
                return;
            }
            updateParam(next, key, value);
        });
        router.replace(`/platform/media/circulation?${next.toString()}`, { scroll: false });
    };

    const verdictOptions = useMemo(() => {
        const values = new Set<string>();
        cockpit?.recommendations.forEach((r) => values.add(r.verdict));
        return Array.from(values).sort();
    }, [cockpit]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (cockpit?.recommendations ?? []).filter((rec) => {
            if (lane === 'attention') {
                if (rec.status !== 'pending') return false;
                if (!['pull', 'downrank', 'cool', 'review'].includes(rec.action_lane)) return false;
            } else if (lane !== 'all' && rec.action_lane !== lane) {
                return false;
            }
            if (status !== 'all' && rec.status !== status) return false;
            if (unit !== 'all' && rec.unit_type !== unit) return false;
            if (verdict !== 'all' && rec.verdict !== verdict) return false;
            if (bucket !== 'all') {
                const buckets = metricArray(rec.metrics?.matched_thin_buckets);
                const direct = metricString(rec.metrics?.duration_bucket);
                if (!buckets.includes(bucket) && direct !== bucket) return false;
            }
            if (q) {
                const haystack = [
                    rec.display_title,
                    rec.display_subtitle,
                    rec.verdict,
                    rec.status,
                    rec.priority_label,
                    ...(rec.proof_points ?? []),
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [bucket, cockpit, lane, query, status, unit, verdict]);

    const selected = useMemo(() => {
        if (!cockpit?.recommendations.length) return undefined;
        return cockpit.recommendations.find((r) => r.id === selectedID) ?? filtered[0] ?? cockpit.recommendations[0];
    }, [cockpit, filtered, selectedID]);

    const selectRecommendation = (id: string, openDetails = false) =>
        setParams({ selected: id, details: openDetails ? '1' : undefined });

    if (loading) {
        return <CockpitSkeleton />;
    }

    if (!cockpit) {
        return (
            <div className="p-6">
                <EmptyState
                    title="Media circulation is not available"
                    detail="The cockpit could not load the circulation read model."
                    actionLabel="Try again"
                    onAction={onGenerate}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
                <CommandBar
                    cockpit={cockpit}
                    fetching={fetching}
                    generating={generating}
                    onGenerate={onGenerate}
                    onOpenPolicy={() => setParams({ policy: '1' })}
                />
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:p-6">
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <LibraryRail cockpit={cockpit} bucket={bucket} onBucket={(value) => setParams({ bucket: value })} />
                </aside>

                <main className="min-w-0 space-y-4">
                    <CirculationMap cockpit={cockpit} activeLane={lane} onLane={(value) => setParams({ lane: value })} />
                    <FilterBar
                        cockpit={cockpit}
                        lane={lane}
                        status={status}
                        unit={unit}
                        verdict={verdict}
                        bucket={bucket}
                        query={query}
                        verdictOptions={verdictOptions}
                        onChange={setParams}
                    />
                    <PriorityQueue
                        rows={filtered}
                        selectedID={selected?.id}
                        engineEnabled={cockpit.health.enabled}
                        acting={acting}
                        onSelect={selectRecommendation}
                        onApply={onApply}
                        onDismiss={onDismiss}
                        onGenerate={onGenerate}
                        onOpenPolicy={() => setParams({ policy: '1' })}
                    />
                </main>

                <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                    <RecommendationInspector
                        rec={selected}
                        engineEnabled={cockpit.health.enabled}
                        acting={acting}
                        onApply={onApply}
                        onDismiss={onDismiss}
                    />
                </aside>
            </div>

            <Sheet open={detailsOpen && Boolean(selected)} onOpenChange={(open) => setParams({ details: open ? '1' : undefined })}>
                <SheetContent side="bottom" className="max-h-[86vh] overflow-y-auto rounded-t-md border-border p-4 lg:hidden">
                    <SheetHeader className="mb-4 text-left">
                        <SheetTitle>Recommendation proof</SheetTitle>
                    </SheetHeader>
                    <RecommendationInspector
                        rec={selected}
                        engineEnabled={cockpit.health.enabled}
                        acting={acting}
                        onApply={onApply}
                        onDismiss={onDismiss}
                    />
                </SheetContent>
            </Sheet>

            <Sheet open={policyOpen} onOpenChange={(open) => setParams({ policy: open ? '1' : undefined })}>
                <SheetContent side="right" className="w-full overflow-y-auto border-border p-5 sm:max-w-xl">
                    <SheetHeader className="mb-5 text-left">
                        <SheetTitle>Circulation policy</SheetTitle>
                    </SheetHeader>
                    <SettingsForm policy={cockpit.policy} saving={savingPolicy} onSave={onSavePolicy} />
                </SheetContent>
            </Sheet>
        </div>
    );
}

function CommandBar({
    cockpit,
    fetching,
    generating,
    onGenerate,
    onOpenPolicy,
}: {
    cockpit: MediaCirculationCockpit;
    fetching: boolean;
    generating: boolean;
    onGenerate: () => void;
    onOpenPolicy: () => void;
}) {
    const health = cockpit.health;
    return (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                    <Radio className={cn('h-5 w-5', PRESS_TEXT)} />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-xl font-semibold tracking-normal md:text-2xl">
                            Media Circulation
                        </h1>
                        <Badge variant="outline" className={cn('uppercase', headlineClass(health.headline))}>
                            {health.headline.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className={health.enabled ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : PRESS_SUBTLE}>
                            {health.enabled ? 'Engine on' : 'Engine off'}
                        </Badge>
                    </div>
                    <p className="mt-1 max-w-4xl text-sm leading-5 text-muted-foreground">
                        {health.summary}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                    Updated {new Date(health.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {fetching ? ' · refreshing' : ''}
                </span>
                <Button variant="outline" size="sm" onClick={onOpenPolicy}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Policy
                </Button>
                <Button size="sm" onClick={onGenerate} disabled={generating || !health.enabled} className={PRESS_BUTTON}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Generate
                </Button>
            </div>
        </div>
    );
}

function LibraryRail({
    cockpit,
    bucket,
    onBucket,
}: {
    cockpit: MediaCirculationCockpit;
    bucket: string;
    onBucket: (bucket: string) => void;
}) {
    const storage = cockpit.storage;
    const utilization = Math.min(100, Math.max(0, storage.utilization_pct || 0));
    return (
        <>
            <section className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Library state</p>
                        <h2 className="mt-1 text-lg font-semibold">Storage pressure</h2>
                    </div>
                    <Gauge className={cn('h-5 w-5', PRESS_TEXT)} />
                </div>
                <div className="mt-4">
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-semibold tabular-nums">{utilization.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(storage.used_bytes)} used</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-sm border border-border bg-background">
                        <div className={cn('h-full', utilization >= 90 ? 'bg-[#e63946]' : utilization >= 75 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${utilization}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <Metric label="Quota" value={formatBytes(storage.quota_bytes)} />
                        <Metric label="Protected" value={`${storage.protected_count}`} />
                        <Metric label="Candidates" value={`${storage.candidate_count}`} />
                        <Metric label="Cold tier" value={storage.cold_enabled ? 'ready' : 'off'} />
                    </div>
                </div>
            </section>

            <section className="rounded-md border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration demand</p>
                        <h2 className="mt-1 text-lg font-semibold">Bucket inventory</h2>
                    </div>
                    <Button size="sm" variant={bucket === 'all' ? 'secondary' : 'ghost'} onClick={() => onBucket('all')}>
                        All
                    </Button>
                </div>
                <div className="space-y-2">
                    {cockpit.buckets.map((b) => (
                        <BucketRow key={b.bucket} bucket={b} selected={bucket === b.bucket} onClick={() => onBucket(bucket === b.bucket ? 'all' : b.bucket)} />
                    ))}
                </div>
            </section>
        </>
    );
}

function BucketRow({ bucket, selected, onClick }: { bucket: MediaCirculationCockpitBucket; selected: boolean; onClick: () => void }) {
    const max = Math.max(bucket.saturated_ceil, 1);
    const width = Math.min(100, Math.max(3, (bucket.visible_units / max) * 100));
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full rounded-md border p-2 text-left transition-colors',
                selected ? PRESS_SELECTED : 'border-border bg-background hover:bg-muted'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{bucket.bucket}m</span>
                <Badge variant="outline" className={cn('text-[10px]', bucketStateClass(bucket.state))}>
                    {bucket.state}
                </Badge>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-sm bg-muted">
                <div className={cn('h-full', bucket.state === 'thin' ? 'bg-amber-500' : bucket.state === 'saturated' ? 'bg-slate-500' : 'bg-emerald-500')} style={{ width: `${width}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{bucket.visible_units} visible</span>
                <span>{bucket.share_pct.toFixed(0)}% share</span>
            </div>
        </button>
    );
}

function CirculationMap({
    cockpit,
    activeLane,
    onLane,
}: {
    cockpit: MediaCirculationCockpit;
    activeLane: LaneFilter;
    onLane: (lane: LaneFilter) => void;
}) {
    const laneCounts = cockpit.summary.by_action_lane ?? {};
    const maxLane = Math.max(1, ...Object.values(laneCounts));
    return (
        <section className="rounded-md border border-border bg-card p-4">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Circulation map</p>
                    <h2 className="text-lg font-semibold">Pressure, demand, and action lanes</h2>
                </div>
                <p className="text-xs text-muted-foreground">{cockpit.summary.pending} pending · {cockpit.summary.needs_attention} need attention</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                <MapPanel label="Storage" value={`${cockpit.storage.utilization_pct.toFixed(1)}%`} detail={`${formatBytes(cockpit.storage.used_bytes)} of ${formatBytes(cockpit.storage.quota_bytes)}`} />
                <MapPanel label="Thin buckets" value={`${cockpit.buckets.filter((b) => b.state === 'thin').length}`} detail={cockpit.buckets.filter((b) => b.state === 'thin').map((b) => `${b.bucket}m`).join(', ') || 'none'} />
                <MapPanel label="Actionable" value={`${cockpit.summary.needs_attention}`} detail="pending pull, cool, downrank, review" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {LANES.filter((l) => !['attention', 'all'].includes(l.value)).map((lane) => {
                    const count = laneCounts[lane.value] ?? 0;
                    const width = Math.max(4, (count / maxLane) * 100);
                    const Icon = lane.icon;
                    return (
                        <button
                            key={lane.value}
                            type="button"
                            onClick={() => onLane(activeLane === lane.value ? 'attention' : lane.value)}
                            className={cn(
                                'rounded-md border p-3 text-left transition-colors',
                                activeLane === lane.value ? PRESS_SELECTED : 'border-border bg-background hover:bg-muted'
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                    <Icon className="h-4 w-4" />
                                    {lane.label}
                                </span>
                                <span className="shrink-0 text-sm tabular-nums">{count}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-sm bg-muted">
                                <div className={cn('h-full', laneTone(lane.value))} style={{ width: `${width}%` }} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function MapPanel({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{detail || 'none'}</p>
        </div>
    );
}

function FilterBar({
    cockpit,
    lane,
    status,
    unit,
    verdict,
    bucket,
    query,
    verdictOptions,
    onChange,
}: {
    cockpit: MediaCirculationCockpit;
    lane: LaneFilter;
    status: string;
    unit: UnitFilter;
    verdict: string;
    bucket: string;
    query: string;
    verdictOptions: string[];
    onChange: (changes: Record<string, string | undefined>) => void;
}) {
    return (
        <section className="rounded-md border border-border bg-card p-3">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => onChange({ q: e.target.value })}
                        placeholder="Search source, item, verdict, or proof"
                        className="pl-9"
                    />
                </div>
                <div className="grid gap-2 sm:grid-cols-3 2xl:w-[520px]">
                    <Select value={unit} onValueChange={(value) => onChange({ unit: value })}>
                        <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All units</SelectItem>
                            <SelectItem value="source">Sources</SelectItem>
                            <SelectItem value="item_family">Items / families</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={verdict} onValueChange={(value) => onChange({ verdict: value })}>
                        <SelectTrigger><SelectValue placeholder="Verdict" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All verdicts</SelectItem>
                            {verdictOptions.map((v) => (
                                <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={bucket} onValueChange={(value) => onChange({ bucket: value })}>
                        <SelectTrigger><SelectValue placeholder="Bucket" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All durations</SelectItem>
                            {cockpit.buckets.map((b) => (
                                <SelectItem key={b.bucket} value={b.bucket}>{b.bucket}m</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {LANES.map((l) => {
                    const Icon = l.icon;
                    const active = lane === l.value;
                    const count = l.value === 'attention'
                        ? cockpit.summary.needs_attention
                        : l.value === 'all'
                            ? cockpit.summary.total
                            : cockpit.summary.by_action_lane?.[l.value] ?? 0;
                    return (
                        <Button
                            key={l.value}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onChange({ lane: l.value })}
                            className={cn('gap-1.5', active && PRESS_BUTTON)}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {l.label}
                            <span className="tabular-nums opacity-70">{count}</span>
                        </Button>
                    );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_FILTERS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onChange({ status: s })}
                        className={cn(
                            'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                            status === s ? PRESS_SUBTLE : 'border-border hover:bg-muted'
                        )}
                    >
                        {s} {s === 'all' ? cockpit.summary.total : cockpit.summary.by_status?.[s] ?? 0}
                    </button>
                ))}
            </div>
        </section>
    );
}

function PriorityQueue({
    rows,
    selectedID,
    engineEnabled,
    acting,
    onSelect,
    onApply,
    onDismiss,
    onGenerate,
    onOpenPolicy,
}: {
    rows: MediaCirculationCockpitRecommendation[];
    selectedID?: string;
    engineEnabled: boolean;
    acting: boolean;
    onSelect: (id: string, openDetails?: boolean) => void;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
    onGenerate: () => void;
    onOpenPolicy: () => void;
}) {
    if (!engineEnabled) {
        return (
            <EmptyState
                title="Circulation is off"
                detail="Enable the engine before generating or applying recommendations."
                actionLabel="Open policy"
                onAction={onOpenPolicy}
            />
        );
    }
    if (rows.length === 0) {
        return (
            <EmptyState
                title="No recommendations match this view"
                detail="Clear filters or generate a fresh recommendation set."
                actionLabel="Generate recommendations"
                onAction={onGenerate}
            />
        );
    }
    return (
        <section className="space-y-3">
            {rows.map((rec) => (
                <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    selected={selectedID === rec.id}
                    engineEnabled={engineEnabled}
                    acting={acting}
                    onSelect={(openDetails) => onSelect(rec.id, openDetails)}
                    onApply={onApply}
                    onDismiss={onDismiss}
                />
            ))}
        </section>
    );
}

function RecommendationCard({
    rec,
    selected,
    engineEnabled,
    acting,
    onSelect,
    onApply,
    onDismiss,
}: {
    rec: MediaCirculationCockpitRecommendation;
    selected: boolean;
    engineEnabled: boolean;
    acting: boolean;
    onSelect: (openDetails?: boolean) => void;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const quality = metricNumber(rec.metrics?.quality_prior);
    const demand = metricNumber(rec.metrics?.bucket_demand_match);
    const freshness = metricNumber(rec.metrics?.freshness);
    const cost = metricNumber(rec.metrics?.cost_headroom);
    return (
        <article
            className={cn(
                'rounded-md border bg-card p-4 transition-colors',
                selected ? 'border-[#e63946] ring-1 ring-[#e63946]/30' : 'border-border hover:border-foreground/40'
            )}
        >
            <button type="button" className="w-full text-left" onClick={() => onSelect(false)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn('capitalize', laneTone(rec.action_lane))}>
                                {laneLabel(rec.action_lane)}
                            </Badge>
                            <Badge variant="outline" className={cn('capitalize', statusTone(rec.status))}>
                                {rec.status}
                            </Badge>
                            <Badge variant="outline" className={cn('capitalize', verdictClass(rec.verdict))}>
                                {rec.verdict.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        <h3 className="truncate text-base font-semibold">{rec.display_title}</h3>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{rec.display_subtitle}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{rec.priority_label}</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{rec.primary_metric}</p>
                    </div>
                </div>
            </button>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <ScoreBar label="quality" value={quality} />
                <ScoreBar label="demand" value={demand} />
                <ScoreBar label="freshness" value={freshness} />
                <ScoreBar label="headroom" value={cost} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {rec.proof_points?.[0] ?? rec.reasons?.[0] ?? 'Recommendation proof is available in the inspector.'}
                </p>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onSelect(true)}>
                        Proof
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    {rec.status === 'pending' && (
                        <>
                            <Button size="sm" variant="outline" disabled={acting} onClick={() => onDismiss(rec.id)}>
                                <X className="mr-1 h-3.5 w-3.5" />
                                Dismiss
                            </Button>
                            <Button size="sm" disabled={acting || !engineEnabled} onClick={() => onApply(rec.id)} className={PRESS_BUTTON}>
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Apply
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

function RecommendationInspector({
    rec,
    engineEnabled,
    acting,
    onApply,
    onDismiss,
}: {
    rec?: MediaCirculationCockpitRecommendation;
    engineEnabled: boolean;
    acting: boolean;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    if (!rec) {
        return (
            <section className="rounded-md border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Select a recommendation to inspect its proof.</p>
            </section>
        );
    }
    const metrics = Object.entries(rec.metrics ?? {}).filter(([, value]) => value !== null && value !== undefined);
    return (
        <section className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <Badge variant="outline" className={cn('mb-2 capitalize', laneTone(rec.action_lane))}>
                        {laneLabel(rec.action_lane)}
                    </Badge>
                    <h2 className="text-lg font-semibold leading-6">{rec.display_title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{rec.display_subtitle}</p>
                </div>
                <Badge variant="outline" className={cn('capitalize', statusTone(rec.status))}>
                    {rec.status}
                </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Metric label="Verdict" value={rec.verdict.replace(/_/g, ' ')} />
                <Metric label="Score" value={rec.score.toFixed(3)} />
                <Metric label="Priority" value={rec.priority_label} />
                <Metric label="Metric" value={rec.primary_metric} />
            </div>

            <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proof</p>
                {(rec.proof_points?.length ? rec.proof_points : rec.reasons ?? []).map((point, index) => (
                    <div key={`${point}-${index}`} className="rounded-md border border-border bg-background p-2 text-sm leading-5">
                        {point}
                    </div>
                ))}
            </div>

            {metrics.length > 0 && (
                <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metrics</p>
                    <div className="grid gap-2">
                        {metrics.slice(0, 10).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between gap-3 border-b border-border/50 pb-1 text-xs">
                                <span className="truncate text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                                <span className="max-w-[170px] truncate font-medium tabular-nums">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {rec.status === 'pending' ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" disabled={acting} onClick={() => onDismiss(rec.id)}>
                        <X className="mr-2 h-4 w-4" />
                        Dismiss
                    </Button>
                    <Button disabled={acting || !engineEnabled} onClick={() => onApply(rec.id)} className={PRESS_BUTTON}>
                        <Check className="mr-2 h-4 w-4" />
                        Apply
                    </Button>
                </div>
            ) : (
                <div className="mt-5 rounded-md border border-border bg-background p-3 text-sm">
                    Outcome: <span className="font-medium">{rec.outcome ?? rec.status}</span>
                </div>
            )}
        </section>
    );
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
    const width = value === undefined ? 0 : Math.min(100, Math.max(0, value * 100));
    return (
        <div className="rounded-md border border-border bg-background p-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>{label}</span>
                <span className="tabular-nums">{value === undefined ? 'n/a' : pct(value)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
                <div className="h-full bg-[#e63946]" style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-border bg-background p-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-medium tabular-nums">{value}</p>
        </div>
    );
}

function EmptyState({
    title,
    detail,
    actionLabel,
    onAction,
}: {
    title: string;
    detail: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <section className="rounded-md border border-border bg-card p-8 text-center">
            <Filter className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>
            <Button className={cn('mt-5', PRESS_BUTTON)} onClick={onAction}>{actionLabel}</Button>
        </section>
    );
}

function CockpitSkeleton() {
    return (
        <div className="space-y-4 p-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
                <Skeleton className="h-[520px]" />
                <Skeleton className="h-[620px]" />
                <Skeleton className="h-[520px]" />
            </div>
        </div>
    );
}
