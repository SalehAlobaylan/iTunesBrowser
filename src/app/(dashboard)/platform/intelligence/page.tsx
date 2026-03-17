'use client';

import Link from 'next/link';
import { Activity, Brain, Flag, TrendingUp, BarChart3, Settings2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalHealthRadar, ScoreDistributionChart } from '@/components/platform/intelligence';
import {
    useRankingConfig,
    useSignalHealth,
    useScoreDistribution,
    useEmbeddingStats,
    useContentFlags,
    useTrendingItems,
} from '@/hooks/use-intelligence';

export default function IntelligencePage() {
    const { data: config, isLoading: configLoading } = useRankingConfig();
    const { data: signalHealth, isLoading: healthLoading } = useSignalHealth();
    const { data: scoreDist, isLoading: distLoading } = useScoreDistribution();
    const { data: embedStats, isLoading: embedLoading } = useEmbeddingStats();
    const { data: flags, isLoading: flagsLoading } = useContentFlags({ limit: 1 });
    const { data: trending, isLoading: trendingLoading } = useTrendingItems();

    const embeddingCoverage = embedStats
        ? Math.round(embedStats.percentage)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Intelligence</h1>
                <p className="text-muted-foreground">
                    Control how content is ranked, flagged, and distributed across feeds
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Algorithm Status</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {configLoading ? (
                            <Skeleton className="h-7 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {config?.is_active ? (
                                        <span className="text-green-600">Active</span>
                                    ) : (
                                        <span className="text-muted-foreground">Inactive</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {config?.is_active
                                        ? '7-signal ranking enabled'
                                        : 'Feeds are chronological'}
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
                                <p className="text-xs text-muted-foreground">
                                    Content with vector embeddings
                                </p>
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
                                <p className="text-xs text-muted-foreground">
                                    Boosted, suppressed, or pinned
                                </p>
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
                                <p className="text-xs text-muted-foreground">
                                    Items with interaction spikes
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Signal Health</CardTitle>
                        <CardDescription>
                            Data coverage percentage for each ranking signal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {healthLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : signalHealth ? (
                            <SignalHealthRadar data={signalHealth} />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                                No signal health data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Score Distribution</CardTitle>
                        <CardDescription>
                            How content scores are distributed across the catalog
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {distLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : scoreDist ? (
                            <ScoreDistributionChart data={scoreDist} />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                                No score data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/platform/intelligence/ranking">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-sm">Ranking Config</CardTitle>
                                <CardDescription className="text-xs">Tune signal weights</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
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
