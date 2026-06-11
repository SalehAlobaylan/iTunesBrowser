'use client';

import { RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    useRankingConfig,
    useUpdateRankingConfig,
    useRefreshNewsSnapshot,
} from '@/hooks/use-intelligence';

/**
 * Admin control for the NEWS (stories) feed.
 *
 * The product is LIVE assembly ("write-time intelligence, read-time
 * freshness"): every request reflects current story state, short-circuited by
 * a freshness-bounded cache (≤60s, invalidated the moment a story gains a
 * member). "Cached only" is the emergency escape hatch that disables the live
 * path and serves the cache exclusively.
 *
 * The reranker toggle is an independent QUALITY knob: when on, related-story
 * order is cross-encoder reranked at WRITE time (when a story changes) — it
 * never touches read latency in either state.
 */
export function NewsFeedModeCard() {
    const { data: config } = useRankingConfig();
    const updateConfig = useUpdateRankingConfig();
    const refreshSnapshot = useRefreshNewsSnapshot();

    // Legacy values (precompute/on_demand) render as their modern equivalents.
    const rawMode = config?.news_feed_mode ?? 'live';
    const mode = rawMode === 'cached_only' ? 'cached_only' : 'live';
    const rerankEnabled = config?.news_rerank_enabled ?? false;

    const setMode = (next: 'live' | 'cached_only') => {
        if (!config || next === mode) return;
        updateConfig.mutate({ ...config, news_feed_mode: next });
    };

    const toggleRerank = () => {
        if (!config) return;
        updateConfig.mutate({ ...config, news_rerank_enabled: !rerankEnabled });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>News Feed Serving</CardTitle>
                <CardDescription>
                    Live (default): every request assembles from current story state, with a
                    ≤60s cache that invalidates the moment new content joins a story. Cached
                    only: emergency switch — serve the cache exclusively, no live assembly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={mode === 'live' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('live')}
                        disabled={updateConfig.isPending || !config}
                    >
                        Live
                    </Button>
                    <Button
                        variant={mode === 'cached_only' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('cached_only')}
                        disabled={updateConfig.isPending || !config}
                    >
                        Cached only
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Related-story reranker — cross-encoder ordering computed at write
                        time (quality knob, no read-latency cost).
                    </p>
                    <Button
                        variant={rerankEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={toggleRerank}
                        disabled={updateConfig.isPending || !config}
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        {rerankEnabled ? 'Reranker on' : 'Reranker off'}
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Force-rebuild the feed cache now (normally self-refreshing).
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshSnapshot.mutate()}
                        disabled={refreshSnapshot.isPending}
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${refreshSnapshot.isPending ? 'animate-spin' : ''}`}
                        />
                        Refresh cache
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
