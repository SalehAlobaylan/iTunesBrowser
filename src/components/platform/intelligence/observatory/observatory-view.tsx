'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { ObservatorySnapshot } from '@/types/platform/intelligence';
import { ValueSpectrum } from './value-spectrum';
import { ExplorationFlow } from './exploration-flow';
import { DemandEconomics } from './demand-economics';
import { ModelMechanics } from './model-mechanics';
import { FeedOrderingPanel } from './feed-ordering/feed-ordering-panel';

interface ObservatoryViewProps {
    snapshot?: ObservatorySnapshot;
    loading: boolean;
    fetching: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onTune: () => void;
}

/**
 * Observatory view — the visualization-first design: the value spectrum
 * signature, the audition lifecycle flow, supply-vs-demand economics, the live
 * model-mechanics curves, and the freshly-rebuilt read-time feed-ordering panel.
 */
export function ObservatoryView({ snapshot, loading, fetching, refreshing, onRefresh, onTune }: ObservatoryViewProps) {
    return (
        <div className="space-y-4">
            <ValueSpectrum
                snapshot={snapshot}
                fetching={fetching}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onTune={onTune}
            />

            {loading ? (
                <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Skeleton className="h-64 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            ) : snapshot ? (
                <>
                    <div className="grid items-start gap-4 lg:grid-cols-2">
                        <ExplorationFlow snapshot={snapshot} />
                        <DemandEconomics snapshot={snapshot} />
                    </div>
                    <ModelMechanics snapshot={snapshot} />
                </>
            ) : (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <h2 className="text-base font-semibold">Observatory unavailable</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        The read model could not load. Check that the CMS is reachable, then reload.
                    </p>
                </div>
            )}

            <FeedOrderingPanel />
        </div>
    );
}
