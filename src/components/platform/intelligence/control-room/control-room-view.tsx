'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { ObservatorySnapshot } from '@/types/platform/intelligence';
import { IntelligenceHero } from './intelligence-hero';
import { ExplorationPipelineCard } from './exploration-pipeline-card';
import { ScoreFreshnessCard } from './score-freshness-card';
import { TopicDemandTable } from './topic-demand-table';
import { FeedOrderingSection } from './feed-ordering-section';

interface ControlRoomViewProps {
    snapshot?: ObservatorySnapshot;
    loading: boolean;
    fetching: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onTune: () => void;
}

/**
 * Control-room view — the tile-based design: a dark cockpit hero with the
 * engine's vitals, exploration/freshness cards, the topic-demand table, and the
 * legacy feed-ordering section. Fed by the shared observatory snapshot (a
 * superset of the diagnostics shape the tiles expect).
 */
export function ControlRoomView({ snapshot, loading, fetching, refreshing, onRefresh, onTune }: ControlRoomViewProps) {
    return (
        <div className="space-y-4">
            <IntelligenceHero
                diagnostics={snapshot}
                fetching={fetching}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onOpenTuning={onTune}
            />

            {loading ? (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-44 rounded-xl" />
                        <Skeleton className="h-44 rounded-xl" />
                    </div>
                    <Skeleton className="h-72 w-full rounded-xl" />
                </div>
            ) : snapshot ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ExplorationPipelineCard diagnostics={snapshot} />
                        <ScoreFreshnessCard diagnostics={snapshot} />
                    </div>
                    <TopicDemandTable diagnostics={snapshot} />
                </>
            ) : (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <h2 className="text-base font-semibold">Value engine diagnostics unavailable</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        The read model could not load. Check that the CMS is reachable, then reload.
                    </p>
                </div>
            )}

            <FeedOrderingSection />
        </div>
    );
}
