'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Activity,
    Clock3,
    EyeOff,
    History,
    Loader2,
    Pin,
    RefreshCw,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useApplyCirculationPreset,
    useApplySourceRecommendation,
    useCirculationAudit,
    useCirculationMetrics,
    useCirculationPolicy,
    useCirculationPreview,
    useDeleteStoryOverride,
    useGenerateSourceRecommendations,
    useSourceRecommendations,
    useStoryOverrides,
    useUpdateCirculationPolicy,
    useUpsertStoryOverride,
} from '@/hooks/use-intelligence';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type {
    CirculationStorySummary,
    NewsCirculationPolicy,
    NewsLifecycle,
    NewsWindow,
    SourceCadenceMode,
} from '@/types/platform/intelligence';

const WINDOWS: Array<{ value: NewsWindow; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

type PolicyDraft = Pick<
    NewsCirculationPolicy,
    'source_cadence_mode'
> & {
    min_today_stories: string;
    carryover_hours: string;
    carryover_min_score: string;
    breaking_max_age_minutes: string;
    breaking_min_members: string;
    recency_weight: string;
    importance_weight: string;
    momentum_weight: string;
    coverage_weight: string;
    source_quality_weight: string;
    diversity_weight: string;
    trending_weight: string;
    source_claim_interval_minutes: string;
    source_min_interval_minutes: string;
    source_max_interval_minutes: string;
    source_max_change_percent: string;
};

const emptyDraft: PolicyDraft = {
    min_today_stories: '8',
    carryover_hours: '72',
    carryover_min_score: '0.25',
    breaking_max_age_minutes: '180',
    breaking_min_members: '3',
    recency_weight: '0.55',
    importance_weight: '0.15',
    momentum_weight: '0.10',
    coverage_weight: '0.30',
    source_quality_weight: '0.10',
    diversity_weight: '0.05',
    trending_weight: '0.05',
    source_cadence_mode: 'suggest',
    source_claim_interval_minutes: '15',
    source_min_interval_minutes: '10',
    source_max_interval_minutes: '360',
    source_max_change_percent: '50',
};

function draftFromPolicy(policy?: NewsCirculationPolicy): PolicyDraft {
    if (!policy) return emptyDraft;
    return {
        min_today_stories: String(policy.min_today_stories),
        carryover_hours: String(policy.carryover_hours),
        carryover_min_score: String(policy.carryover_min_score),
        breaking_max_age_minutes: String(policy.breaking_max_age_minutes),
        breaking_min_members: String(policy.breaking_min_members),
        recency_weight: String(policy.recency_weight),
        importance_weight: String(policy.importance_weight),
        momentum_weight: String(policy.momentum_weight),
        coverage_weight: String(policy.coverage_weight),
        source_quality_weight: String(policy.source_quality_weight),
        diversity_weight: String(policy.diversity_weight),
        trending_weight: String(policy.trending_weight),
        source_cadence_mode: policy.source_cadence_mode,
        source_claim_interval_minutes: String(policy.source_claim_interval_minutes),
        source_min_interval_minutes: String(policy.source_min_interval_minutes),
        source_max_interval_minutes: String(policy.source_max_interval_minutes),
        source_max_change_percent: String(policy.source_max_change_percent),
    };
}

function numberValue(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function storyTitle(story: CirculationStorySummary): string {
    return story.title || story.label || story.excerpt || story.story_id;
}

function lifecycleClass(lifecycle: NewsLifecycle): string {
    switch (lifecycle) {
        case 'breaking':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'active':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'cooling':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-700';
    }
}

function minutesLabel(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function metricPercent(count: number, total: number): string {
    if (!total) return '0%';
    return `${Math.round((count / total) * 100)}%`;
}

export function NewsCirculationCard() {
    const [window, setWindow] = useState<NewsWindow>('today');
    const [draft, setDraft] = useState<PolicyDraft>(emptyDraft);
    const [manualStoryId, setManualStoryId] = useState('');
    const [manualNote, setManualNote] = useState('');

    const policyQuery = useCirculationPolicy();
    const metricsQuery = useCirculationMetrics();
    const previewQuery = useCirculationPreview(window);
    const overridesQuery = useStoryOverrides();
    const recommendationsQuery = useSourceRecommendations();
    const auditQuery = useCirculationAudit();

    const updatePolicy = useUpdateCirculationPolicy();
    const applyPreset = useApplyCirculationPreset();
    const upsertOverride = useUpsertStoryOverride();
    const deleteOverride = useDeleteStoryOverride();
    const generateRecommendations = useGenerateSourceRecommendations();
    const applyRecommendation = useApplySourceRecommendation();

    const policy = policyQuery.data;
    const previewStories = previewQuery.data?.slides.map((slide) => slide.featured) ?? [];
    const activeRecommendations = useMemo(
        () => (recommendationsQuery.data?.data ?? []).filter((rec) => !rec.applied),
        [recommendationsQuery.data?.data]
    );

    useEffect(() => {
        setDraft(draftFromPolicy(policy));
    }, [policy]);

    const setDraftValue = <K extends keyof PolicyDraft>(key: K, value: PolicyDraft[K]) => {
        setDraft((current) => ({ ...current, [key]: value }));
    };

    const handleSavePolicy = () => {
        if (!policy) return;
        updatePolicy.mutate({
            ...policy,
            min_today_stories: numberValue(draft.min_today_stories, policy.min_today_stories),
            carryover_hours: numberValue(draft.carryover_hours, policy.carryover_hours),
            carryover_min_score: numberValue(draft.carryover_min_score, policy.carryover_min_score),
            breaking_max_age_minutes: numberValue(draft.breaking_max_age_minutes, policy.breaking_max_age_minutes),
            breaking_min_members: numberValue(draft.breaking_min_members, policy.breaking_min_members),
            recency_weight: numberValue(draft.recency_weight, policy.recency_weight),
            importance_weight: numberValue(draft.importance_weight, policy.importance_weight),
            momentum_weight: numberValue(draft.momentum_weight, policy.momentum_weight),
            coverage_weight: numberValue(draft.coverage_weight, policy.coverage_weight),
            source_quality_weight: numberValue(draft.source_quality_weight, policy.source_quality_weight),
            diversity_weight: numberValue(draft.diversity_weight, policy.diversity_weight),
            trending_weight: numberValue(draft.trending_weight, policy.trending_weight),
            source_cadence_mode: draft.source_cadence_mode,
            source_claim_interval_minutes: numberValue(
                draft.source_claim_interval_minutes,
                policy.source_claim_interval_minutes
            ),
            source_min_interval_minutes: numberValue(
                draft.source_min_interval_minutes,
                policy.source_min_interval_minutes
            ),
            source_max_interval_minutes: numberValue(
                draft.source_max_interval_minutes,
                policy.source_max_interval_minutes
            ),
            source_max_change_percent: numberValue(
                draft.source_max_change_percent,
                policy.source_max_change_percent
            ),
        });
    };

    const quickOverride = (
        storyId: string,
        data: { pin_to_top?: boolean; suppress?: boolean; exclude_from_feed?: boolean; importance_boost?: number },
        note: string
    ) => {
        upsertOverride.mutate({
            storyId,
            data: {
                ...data,
                notes: note,
            },
        });
    };

    const submitManualOverride = (kind: 'pin' | 'suppress' | 'exclude') => {
        const storyId = manualStoryId.trim();
        if (!storyId) return;
        const data =
            kind === 'pin'
                ? { pin_to_top: true, importance_boost: 1.4 }
                : kind === 'suppress'
                    ? { suppress: true, importance_boost: 0.65 }
                    : { exclude_from_feed: true };
        quickOverride(storyId, data, manualNote.trim() || `Console ${kind} override`);
    };

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            News Circulation
                        </CardTitle>
                        <CardDescription>
                            Story freshness policy, source cadence, and circulation exceptions.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset.mutate('latest_plus')}
                            disabled={applyPreset.isPending}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            latest_plus
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSavePolicy}
                            disabled={!policy || updatePolicy.isPending}
                        >
                            {updatePolicy.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            Save policy
                        </Button>
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <StatusTile label="Preset" value={policy?.preset ?? 'latest_plus'} icon={<Sparkles className="h-4 w-4" />} />
                    <StatusTile label="Timezone" value={policy?.timezone ?? 'Asia/Riyadh'} icon={<Clock3 className="h-4 w-4" />} />
                    <StatusTile
                        label="Source cadence"
                        value={draft.source_cadence_mode.replace('_', ' ')}
                        icon={<SlidersHorizontal className="h-4 w-4" />}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <section className="rounded-md border p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold">Policy</h3>
                            <p className="text-xs text-muted-foreground">Today defaults, carryover, ranking mix, cadence guardrails.</p>
                        </div>
                        {policyQuery.isLoading && <Skeleton className="h-8 w-28" />}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <NumberField label="Today minimum" value={draft.min_today_stories} onChange={(v) => setDraftValue('min_today_stories', v)} />
                        <NumberField label="Carryover hours" value={draft.carryover_hours} onChange={(v) => setDraftValue('carryover_hours', v)} />
                        <NumberField label="Carryover min score" step="0.05" value={draft.carryover_min_score} onChange={(v) => setDraftValue('carryover_min_score', v)} />
                        <NumberField label="Breaking age minutes" value={draft.breaking_max_age_minutes} onChange={(v) => setDraftValue('breaking_max_age_minutes', v)} />
                        <NumberField label="Recency weight" step="0.05" value={draft.recency_weight} onChange={(v) => setDraftValue('recency_weight', v)} />
                        <NumberField label="Importance weight" step="0.05" value={draft.importance_weight} onChange={(v) => setDraftValue('importance_weight', v)} />
                        <NumberField label="Momentum weight" step="0.05" value={draft.momentum_weight} onChange={(v) => setDraftValue('momentum_weight', v)} />
                        <NumberField label="Coverage weight" step="0.05" value={draft.coverage_weight} onChange={(v) => setDraftValue('coverage_weight', v)} />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-2">
                            <Label className="text-xs">Cadence mode</Label>
                            <Select
                                value={draft.source_cadence_mode}
                                onValueChange={(value) => setDraftValue('source_cadence_mode', value as SourceCadenceMode)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="suggest">Suggest</SelectItem>
                                    <SelectItem value="auto_apply">Auto apply</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <NumberField label="Claim every min" value={draft.source_claim_interval_minutes} onChange={(v) => setDraftValue('source_claim_interval_minutes', v)} />
                        <NumberField label="Min source min" value={draft.source_min_interval_minutes} onChange={(v) => setDraftValue('source_min_interval_minutes', v)} />
                        <NumberField label="Max source min" value={draft.source_max_interval_minutes} onChange={(v) => setDraftValue('source_max_interval_minutes', v)} />
                        <NumberField label="Max change %" value={draft.source_max_change_percent} onChange={(v) => setDraftValue('source_max_change_percent', v)} />
                    </div>
                </section>

                <section className="rounded-md border p-4">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold">Window Preview</h3>
                            <p className="text-xs text-muted-foreground">Top stories from the selected Riyadh calendar window.</p>
                        </div>
                        <Tabs value={window} onValueChange={(value) => setWindow(value as NewsWindow)}>
                            <TabsList className="h-9">
                                {WINDOWS.map((item) => (
                                    <TabsTrigger key={item.value} value={item.value} className="h-7 text-xs">
                                        {item.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="space-y-2">
                        {previewQuery.isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-16 w-full" />
                            ))
                        ) : previewStories.length === 0 ? (
                            <p className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">No stories in this window yet.</p>
                        ) : (
                            previewStories.slice(0, 8).map((story, index) => (
                                <div key={story.story_id} className="flex flex-col gap-3 rounded-md border bg-background p-3 md:flex-row md:items-center">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{storyTitle(story)}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline" className={cn('capitalize', lifecycleClass(story.lifecycle))}>
                                                    {story.lifecycle}
                                                </Badge>
                                                {story.is_carryover && <Badge variant="warning">Carryover</Badge>}
                                                <span className="text-xs text-muted-foreground">
                                                    {story.member_count} posts
                                                    {story.source_count ? ` · ${story.source_count} sources` : ''}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Updated {formatRelativeTime(story.last_member_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => quickOverride(story.story_id, { pin_to_top: true, importance_boost: 1.4 }, 'Pinned from circulation preview')}
                                            disabled={upsertOverride.isPending}
                                        >
                                            <Pin className="mr-2 h-3.5 w-3.5" />
                                            Pin
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => quickOverride(story.story_id, { suppress: true, importance_boost: 0.65 }, 'Suppressed from circulation preview')}
                                            disabled={upsertOverride.isPending}
                                        >
                                            <EyeOff className="mr-2 h-3.5 w-3.5" />
                                            Suppress
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-md border p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold">Lifecycle Metrics</h3>
                                <p className="text-xs text-muted-foreground">Story counts by window and lifecycle.</p>
                            </div>
                            <Badge variant="secondary">{metricsQuery.data?.active_sources ?? 0} active sources</Badge>
                        </div>
                        <div className="space-y-3">
                            {metricsQuery.isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)
                            ) : (
                                metricsQuery.data?.windows.map((metric) => (
                                    <div key={metric.window} className="rounded-md border bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm font-semibold capitalize">{metric.window}</p>
                                            <span className="text-xs text-muted-foreground">{metric.stories} stories</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <MetricPill label="Breaking" value={metric.breaking} total={metric.stories} />
                                            <MetricPill label="Active" value={metric.active} total={metric.stories} />
                                            <MetricPill label="Cooling" value={metric.cooling} total={metric.stories} />
                                            <MetricPill label="Carryover" value={metric.carryover} total={metric.stories} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-md border p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold">Source Cadence</h3>
                                <p className="text-xs text-muted-foreground">Review interval recommendations before applying.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateRecommendations.mutate()}
                                disabled={generateRecommendations.isPending}
                            >
                                <RefreshCw className={cn('mr-2 h-4 w-4', generateRecommendations.isPending && 'animate-spin')} />
                                Refresh
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {recommendationsQuery.isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)
                            ) : activeRecommendations.length === 0 ? (
                                <p className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">No pending cadence recommendations.</p>
                            ) : (
                                activeRecommendations.slice(0, 5).map((rec) => (
                                    <div key={rec.id} className="rounded-md border bg-background p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{rec.source_name || rec.source_id}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {minutesLabel(rec.current_interval_minutes)} → {minutesLabel(rec.recommended_interval_minutes)}
                                                    {' · '}
                                                    score {rec.score.toFixed(2)}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{rec.reason}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => applyRecommendation.mutate(rec.id)}
                                                disabled={applyRecommendation.isPending}
                                            >
                                                <Wand2 className="mr-2 h-3.5 w-3.5" />
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-md border p-4">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold">Story Overrides</h3>
                            <p className="text-xs text-muted-foreground">Exceptions change circulation only, not content status.</p>
                        </div>
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto_auto]">
                            <Input
                                value={manualStoryId}
                                onChange={(event) => setManualStoryId(event.target.value)}
                                placeholder="Story UUID"
                                className="md:col-span-2"
                            />
                            <Input
                                value={manualNote}
                                onChange={(event) => setManualNote(event.target.value)}
                                placeholder="Note"
                                className="md:col-span-3"
                            />
                            <Button variant="outline" size="sm" onClick={() => submitManualOverride('pin')} disabled={upsertOverride.isPending}>
                                <Pin className="mr-2 h-3.5 w-3.5" />
                                Pin
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => submitManualOverride('suppress')} disabled={upsertOverride.isPending}>
                                <EyeOff className="mr-2 h-3.5 w-3.5" />
                                Suppress
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => submitManualOverride('exclude')} disabled={upsertOverride.isPending}>
                                Exclude
                            </Button>
                        </div>
                        <div className="mt-4 space-y-2">
                            {(overridesQuery.data?.data ?? []).slice(0, 5).map((override) => (
                                <div key={override.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-mono">{override.story_id}</p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {override.pin_to_top && <Badge>Pin</Badge>}
                                            {override.suppress && <Badge variant="warning">Suppress</Badge>}
                                            {override.exclude_from_feed && <Badge variant="destructive">Exclude</Badge>}
                                            <Badge variant="outline">×{override.importance_boost.toFixed(2)}</Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteOverride.mutate(override.story_id)}
                                        disabled={deleteOverride.isPending}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            {!overridesQuery.isLoading && (overridesQuery.data?.data ?? []).length === 0 && (
                                <p className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">No active overrides.</p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-md border p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Audit History</h3>
                        </div>
                        <div className="space-y-2">
                            {auditQuery.isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)
                            ) : (auditQuery.data?.data ?? []).length === 0 ? (
                                <p className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">No circulation audit entries yet.</p>
                            ) : (
                                auditQuery.data?.data.map((entry) => (
                                    <div key={entry.id} className="rounded-md border bg-background p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-medium">{entry.action.replace('circulation.', '').replaceAll('.', ' ')}</p>
                                            <Badge variant={entry.status === 'success' ? 'success' : 'destructive'}>{entry.status}</Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {entry.user_email || 'system'} · {formatRelativeTime(entry.created_at)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
            <div className="rounded-md bg-background p-2 text-muted-foreground">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-semibold capitalize">{value}</p>
            </div>
        </div>
    );
}

function NumberField({
    label,
    value,
    onChange,
    step = '1',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    step?: string;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs">{label}</Label>
            <Input
                type="number"
                value={value}
                step={step}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function MetricPill({ label, value, total }: { label: string; value: number; total: number }) {
    return (
        <div className="rounded-md bg-background p-2">
            <p className="font-medium">{value}</p>
            <p className="text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{metricPercent(value, total)}</p>
        </div>
    );
}
