'use client';

import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useRankingConfig,
    useUpdateRankingConfig,
    useRefreshNewsSnapshot,
} from '@/hooks/use-intelligence';

/**
 * Phase 13 — admin control for the NEWS (stories) feed.
 *
 * Precompute: serve a static story-slide snapshot off the read path (no ML on
 * the request). On-demand: assemble each request live and enable the
 * cross-encoder reranker for related stories. The reranker is coupled to the
 * mode (precompute never reranks).
 */
export function NewsFeedModeCard() {
    const { data: config } = useRankingConfig();
    const updateConfig = useUpdateRankingConfig();
    const refreshSnapshot = useRefreshNewsSnapshot();

    const mode = config?.news_feed_mode ?? 'precompute';
    const rerankEnabled = config?.news_rerank_enabled ?? false;

    const setMode = (next: 'precompute' | 'on_demand') => {
        if (!config || next === mode) return;
        updateConfig.mutate({
            ...config,
            news_feed_mode: next,
            // Coupling: on_demand enables the reranker; precompute never reranks.
            news_rerank_enabled: next === 'on_demand',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>News Feed Mode</CardTitle>
                <CardDescription>
                    How the News (stories) feed is assembled. Precompute serves a static
                    snapshot off the read path; On-demand assembles each request live and
                    enables the cross-encoder reranker for related stories.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={mode === 'precompute' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('precompute')}
                        disabled={updateConfig.isPending || !config}
                    >
                        Precompute
                    </Button>
                    <Button
                        variant={mode === 'on_demand' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('on_demand')}
                        disabled={updateConfig.isPending || !config}
                    >
                        On-demand
                    </Button>
                    <Badge variant={rerankEnabled ? 'default' : 'secondary'}>
                        Reranker {rerankEnabled ? 'on' : 'off'}
                    </Badge>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Rebuild the precomputed story-slide snapshot now.
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
                        Refresh snapshot
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
