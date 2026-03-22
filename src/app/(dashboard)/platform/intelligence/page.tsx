'use client';

import Link from 'next/link';
import { Activity, Brain, Flag, TrendingUp, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeCard, AdvancedSettingsDialog } from '@/components/platform/intelligence';
import {
    useModes,
    useSetMode,
    useRankingConfig,
    useUpdateRankingConfig,
    useEmbeddingStats,
    useContentFlags,
    useTrendingItems,
} from '@/hooks/use-intelligence';

const MODE_LABELS: Record<string, string> = {
    fresh_first: 'Fresh First',
    trending: 'Trending',
    most_relevant: 'Most Relevant',
    ai_curated: 'AI Curated',
    balanced: 'Balanced',
    custom: 'Custom',
};

export default function IntelligencePage() {
    const { data: modes, isLoading: modesLoading } = useModes();
    const { data: config, isLoading: configLoading } = useRankingConfig();
    const { data: embedStats, isLoading: embedLoading } = useEmbeddingStats();
    const { data: flags, isLoading: flagsLoading } = useContentFlags({ limit: 1 });
    const { data: trending, isLoading: trendingLoading } = useTrendingItems();

    const setModeMutation = useSetMode();
    const updateConfigMutation = useUpdateRankingConfig();

    const embeddingCoverage = embedStats ? Math.round(embedStats.percentage) : 0;
    const currentMode = config?.mode || 'balanced';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Intelligence</h1>
                    <p className="text-muted-foreground">
                        Choose how content is ranked and distributed across feeds
                    </p>
                </div>
                <AdvancedSettingsDialog
                    config={config}
                    onSave={(data) => updateConfigMutation.mutate(data)}
                    isSaving={updateConfigMutation.isPending}
                />
            </div>

            {/* Mode Selector */}
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
                    {/* Custom mode indicator */}
                    {currentMode === 'custom' && config?.is_active && (
                        <Card className="ring-2 ring-primary border-primary bg-primary/5">
                            <CardHeader className="flex flex-row items-start gap-3 pb-2">
                                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                                    <Brain className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
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

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Mode</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {configLoading ? (
                            <Skeleton className="h-7 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {config?.is_active ? (
                                        <span className="text-green-600">{MODE_LABELS[currentMode] || currentMode}</span>
                                    ) : (
                                        <span className="text-muted-foreground">Inactive</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {config?.is_active ? 'Ranked feed active' : 'Feeds are chronological'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Embedding Coverage</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {embedLoading ? (
                            <Skeleton className="h-7 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{embeddingCoverage}%</div>
                                <p className="text-xs text-muted-foreground">Content with vector embeddings</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                        <Flag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {flagsLoading ? (
                            <Skeleton className="h-7 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{flags?.total ?? 0}</div>
                                <p className="text-xs text-muted-foreground">Boosted, suppressed, or pinned</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Currently Trending</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {trendingLoading ? (
                            <Skeleton className="h-7 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{trending?.length ?? 0}</div>
                                <p className="text-xs text-muted-foreground">Items with interaction spikes</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/platform/intelligence/flags">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <Flag className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-sm">Content Flags</CardTitle>
                                <CardDescription className="text-xs">Boost, suppress, pin content</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/platform/intelligence/analytics">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-sm">Analytics</CardTitle>
                                <CardDescription className="text-xs">Performance & embeddings</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/platform/intelligence/preview">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <Eye className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-sm">Feed Preview</CardTitle>
                                <CardDescription className="text-xs">Test ranking live</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
