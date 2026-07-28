'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeCard } from '../mode-card';
import { AdvancedSettingsDialog } from '../advanced-settings-dialog';
import { NewsFeedModeCard } from '../news-feed-mode-card';
import {
    useModes,
    useSetMode,
    useRankingConfig,
    useUpdateRankingConfig,
    useEmbeddingStats,
    useContentFlags,
    useTrendingItems,
} from '@/hooks/use-intelligence';
import { cn } from '@/lib/utils';

const MODE_LABELS: Record<string, string> = {
    fresh_first: 'Fresh First',
    trending: 'Trending',
    most_relevant: 'Most Relevant',
    ai_curated: 'AI Curated',
    balanced: 'Balanced',
    custom: 'Custom',
};

/**
 * Feed ordering — the legacy Content Intelligence controls (how a Pods/News
 * page is ORDERED right now), demoted to a secondary section beneath the
 * media-value control room. Distinct from the durable value engine above: this
 * tunes read-time ordering, that tunes the durable cache currency.
 */
export function FeedOrderingSection() {
    const { data: modes, isLoading: modesLoading } = useModes();
    const { data: config } = useRankingConfig();
    const { data: embedStats } = useEmbeddingStats();
    const { data: flags } = useContentFlags({ limit: 1 });
    const { data: trending } = useTrendingItems();

    const setModeMutation = useSetMode();
    const updateConfigMutation = useUpdateRankingConfig();

    const currentMode = config?.mode || 'balanced';
    const embeddingCoverage = embedStats ? Math.round(embedStats.percentage) : 0;

    return (
        <section id="feed-ordering" className="space-y-4 scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Feed ordering
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        How feeds are <span className="font-medium">ordered</span> at read time — separate from the
                        durable value engine above.
                    </p>
                </div>
                <AdvancedSettingsDialog
                    config={config}
                    onSave={(data) => updateConfigMutation.mutate(data)}
                    isSaving={updateConfigMutation.isPending}
                />
            </div>

            {/* Compact stat strip (replaces the old four big stat cards) */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-4">
                <MiniStat
                    label="Current mode"
                    value={config?.is_active ? MODE_LABELS[currentMode] || currentMode : 'Inactive'}
                    accent={config?.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}
                />
                <MiniStat label="Embedding coverage" value={`${embeddingCoverage}%`} />
                <MiniStat label="Flagged items" value={`${flags?.total ?? 0}`} />
                <MiniStat label="Trending now" value={`${trending?.length ?? 0}`} />
            </div>

            {/* News feed mode */}
            <NewsFeedModeCard />

            {/* Mode grid */}
            {modesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {modes?.map((mode) => (
                        <ModeCard
                            key={mode.mode}
                            mode={mode}
                            isActive={currentMode === mode.mode && config?.is_active === true}
                            isLoading={setModeMutation.isPending}
                            onClick={() => setModeMutation.mutate(mode.mode)}
                        />
                    ))}
                    {currentMode === 'custom' && config?.is_active && (
                        <Card className="border-primary bg-primary/5 ring-2 ring-primary">
                            <CardHeader className="flex flex-row items-start gap-3 pb-2">
                                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">Custom</CardTitle>
                                        <Badge variant="default" className="text-xs">Active</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm">
                                    Custom weight configuration set via Advanced Settings.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </section>
    );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={cn('mt-0.5 truncate text-sm font-semibold', accent)}>{value}</p>
        </div>
    );
}
