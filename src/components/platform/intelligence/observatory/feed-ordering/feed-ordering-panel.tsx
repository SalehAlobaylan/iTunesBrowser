'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    useModes,
    useSetMode,
    useRankingConfig,
    useUpdateRankingConfig,
    useRefreshNewsSnapshot,
    useEmbeddingStats,
    useContentFlags,
    useTrendingItems,
} from '@/hooks/use-intelligence';
import type { RankingConfig } from '@/types/platform/intelligence';

// The seven read-time ordering weights (distinct from the value engine's four).
const WEIGHTS: { key: keyof RankingConfig; label: string }[] = [
    { key: 'freshness_weight', label: 'Freshness' },
    { key: 'engagement_weight', label: 'Engagement' },
    { key: 'velocity_weight', label: 'Velocity' },
    { key: 'similarity_weight', label: 'Similarity' },
    { key: 'quality_weight', label: 'Quality' },
    { key: 'diversity_weight', label: 'Diversity' },
    { key: 'trending_weight', label: 'Trending' },
];

/**
 * Read-time feed ordering — the distinct sub-system beneath the value engine.
 * The value engine decides an item's durable *worth*; this decides how a feed
 * page is *ordered* right now. Rebuilt fresh for the observatory: a mode
 * selector, news-serving controls, and a compact weight editor — driven by the
 * existing ranking hooks, none of the old components.
 */
export function FeedOrderingPanel() {
    const { data: modes } = useModes();
    const { data: config } = useRankingConfig();
    const { data: embedStats } = useEmbeddingStats();
    const { data: flags } = useContentFlags({ limit: 1 });
    const { data: trending } = useTrendingItems();
    const setMode = useSetMode();
    const updateConfig = useUpdateRankingConfig();
    const refreshNews = useRefreshNewsSnapshot();

    const activeMode = config?.mode ?? 'balanced';
    const newsLive = config?.news_feed_mode !== 'cached_only';

    return (
        <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
                <h2 className="font-editorial text-lg font-semibold">Read-time feed ordering</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    A separate sub-system: the value engine sets each item&apos;s durable worth; this sets how a feed
                    page is ordered as it&apos;s served.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
                    <Stat label="Active mode" value={config?.is_active ? prettyMode(activeMode) : 'inactive'} highlight={config?.is_active} />
                    <Stat label="Embedding coverage" value={`${embedStats ? Math.round(embedStats.percentage) : 0}%`} />
                    <Stat label="Flagged" value={`${flags?.total ?? 0}`} />
                    <Stat label="Trending" value={`${trending?.length ?? 0}`} />
                </div>
            </div>

            <div className="grid gap-5 p-4 lg:grid-cols-2">
                {/* Mode selector */}
                <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Ranking mode</p>
                    <div className="space-y-1.5">
                        {modes?.map((m) => {
                            const active = activeMode === m.mode && config?.is_active;
                            return (
                                <button
                                    key={m.mode}
                                    type="button"
                                    disabled={setMode.isPending}
                                    onClick={() => setMode.mutate(m.mode)}
                                    className={cn(
                                        'flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-colors',
                                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                            active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                                        )}
                                    >
                                        {active && <Check className="h-3 w-3" />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium">{m.name}</span>
                                        <span className="block text-xs leading-4 text-muted-foreground">{m.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* News serving + weights */}
                <div className="space-y-5">
                    <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">News serving</p>
                        <div className="space-y-3 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-2">
                                <Segmented
                                    options={[
                                        { value: 'live', label: 'Live' },
                                        { value: 'cached_only', label: 'Cached only' },
                                    ]}
                                    value={newsLive ? 'live' : 'cached_only'}
                                    disabled={updateConfig.isPending}
                                    onChange={(v) => updateConfig.mutate({ news_feed_mode: v as 'live' | 'cached_only' })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rerank" className="text-xs text-muted-foreground">
                                    Related-story reranker
                                </Label>
                                <Switch
                                    id="rerank"
                                    checked={config?.news_rerank_enabled ?? false}
                                    disabled={updateConfig.isPending}
                                    onCheckedChange={(checked) => updateConfig.mutate({ news_rerank_enabled: checked })}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled={refreshNews.isPending}
                                onClick={() => refreshNews.mutate()}
                            >
                                {refreshNews.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Rebuild news cache
                            </Button>
                        </div>
                    </div>

                    <RankingWeights config={config} saving={updateConfig.isPending} onSave={(w) => updateConfig.mutate({ ...w, mode: 'custom' })} />
                </div>
            </div>
        </section>
    );
}

function RankingWeights({
    config,
    saving,
    onSave,
}: {
    config?: RankingConfig;
    saving: boolean;
    onSave: (weights: Partial<RankingConfig>) => void;
}) {
    const [weights, setWeights] = useState<Record<string, number>>({});
    useEffect(() => {
        if (config) {
            setWeights(Object.fromEntries(WEIGHTS.map((w) => [w.key, Number(config[w.key]) || 0])));
        }
    }, [config]);

    const total = WEIGHTS.reduce((s, w) => s + (weights[w.key] || 0), 0);

    const change = (key: string, raw: number) => {
        const next = { ...weights, [key]: raw };
        const nt = WEIGHTS.reduce((s, w) => s + (next[w.key] || 0), 0);
        if (nt <= 0) return;
        const norm: Record<string, number> = {};
        for (const w of WEIGHTS) norm[w.key] = Math.round(((next[w.key] || 0) / nt) * 1000) / 1000;
        const rt = WEIGHTS.reduce((s, w) => s + norm[w.key], 0);
        norm[key] = Math.round((norm[key] + (1 - rt)) * 1000) / 1000;
        setWeights(norm);
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Ordering weights</p>
                <span className={cn('font-mono text-[10px]', Math.abs(total - 1) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                    Σ {total.toFixed(2)}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {WEIGHTS.map((w) => (
                    <div key={String(w.key)}>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{w.label}</span>
                            <span className="font-mono tabular-nums">{Math.round((weights[w.key] || 0) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round((weights[w.key] || 0) * 100)}
                            disabled={saving}
                            onChange={(e) => change(String(w.key), parseInt(e.target.value) / 100)}
                            className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                        />
                    </div>
                ))}
            </div>
            <Button size="sm" className="mt-3 w-full" disabled={saving} onClick={() => onSave(weights)}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as custom mode
            </Button>
        </div>
    );
}

function Segmented({
    options,
    value,
    onChange,
    disabled,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="inline-flex rounded-lg border border-border p-0.5">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
                {value}
            </p>
        </div>
    );
}

function prettyMode(mode: string): string {
    const map: Record<string, string> = {
        fresh_first: 'Fresh First',
        trending: 'Trending',
        most_relevant: 'Most Relevant',
        ai_curated: 'AI Curated',
        balanced: 'Balanced',
        custom: 'Custom',
    };
    return map[mode] || mode;
}
