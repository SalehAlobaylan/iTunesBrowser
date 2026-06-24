'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAllSources, useSourceStats, sourceKeys } from '@/hooks/use-sources';
import { FleetStatRibbon } from '@/components/platform/sources/fleet/fleet-stat-ribbon';
import { SourceFleetGrid } from '@/components/platform/sources/fleet/source-fleet-grid';
import { SourceTypeChart } from '@/components/platform/sources/fleet/source-type-chart';
import { SourceOutputChart } from '@/components/platform/sources/fleet/source-output-chart';
import { FetchCadenceChart } from '@/components/platform/sources/fleet/fetch-cadence-chart';
import { SourcesManagement, type ManageTab } from '@/components/platform/sources/manage/sources-management';

const RETURN_TO = '/platform/sources';

// Clicking a Fleet-Grid lane jumps to the manager tab that owns that type.
const laneToTab = (type: string): ManageTab =>
    type === 'YOUTUBE' || type === 'PODCAST' ? 'media' : 'news';

/**
 * Sources — the fleet operations command center. A signature Fleet Grid (every
 * source as a health-colored tile) sits above focused charts and a tabbed
 * management section (News ingestion-flow table · Media card gallery).
 */
export default function SourcesPage() {
    const queryClient = useQueryClient();
    const [bulkBusy, setBulkBusy] = useState(false);
    const [tab, setTab] = useState<ManageTab>('news');

    const fleet = useAllSources({ paused: bulkBusy });
    const stats = useSourceStats();

    const sources = fleet.data ?? [];
    const isRefreshing = fleet.isFetching || stats.isFetching;
    const lastUpdated = fleet.dataUpdatedAt ? new Date(fleet.dataUpdatedAt) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="brand-overline text-gold">Fleet operations</span>
                    <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
                    <p className="text-muted-foreground">
                        Monitor the whole ingestion fleet at a glance and act on what needs it.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: sourceKeys.all })}
                    disabled={isRefreshing}
                    aria-label="Refresh"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                </Button>
            </div>

            {fleet.isError && !fleet.data ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                        <p className="text-sm text-muted-foreground">Couldn&apos;t load sources.</p>
                        <Button variant="outline" size="sm" onClick={() => fleet.refetch()} className="gap-1">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Fleet summary ribbon */}
                    <FleetStatRibbon
                        sources={sources}
                        isLoading={fleet.isLoading}
                        lastUpdated={lastUpdated}
                        isRefreshing={isRefreshing}
                    />

                    {/* Signature — the Fleet Grid */}
                    <SourceFleetGrid
                        sources={sources}
                        isLoading={fleet.isLoading}
                        returnTo={RETURN_TO}
                        onLaneSelect={(type) => setTab(laneToTab(type))}
                    />

                    {/* Charts */}
                    <div className="grid gap-5 lg:grid-cols-3">
                        <SourceTypeChart sources={sources} isLoading={fleet.isLoading} />
                        <SourceOutputChart stats={stats.data} isLoading={stats.isLoading} />
                        <FetchCadenceChart sources={sources} isLoading={fleet.isLoading} />
                    </div>

                    {/* Tabbed management — News · Media */}
                    <SourcesManagement
                        allSources={sources}
                        isLoading={fleet.isLoading}
                        onBusyChange={setBulkBusy}
                        refetch={fleet.refetch}
                        returnTo={RETURN_TO}
                        value={tab}
                        onValueChange={setTab}
                    />
                </>
            )}
        </div>
    );
}
