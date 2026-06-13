'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useContentStats, useMediaSizeStats, contentKeys } from '@/hooks/use-content';
import { formatRelativeTime } from '@/lib/utils/format';
import { ContentKpiBand } from '@/components/platform/content/monitor/content-kpi-band';
import { IngestionVelocityChart } from '@/components/platform/content/monitor/ingestion-velocity-chart';
import { PipelineHealthCard } from '@/components/platform/content/monitor/pipeline-health-card';
import { DomainMonitorPanel } from '@/components/platform/content/monitor/domain-monitor-panel';
import { StorageSummary } from '@/components/platform/content/monitor/storage-summary';
import type { ContentType } from '@/types/platform/content';

const NEWS_TYPES_FILTER = 'in:NEWS,ARTICLE,TWEET,COMMENT';
const MEDIA_TYPES_FILTER = 'in:VIDEO,PODCAST';
const NEWS_TYPES: ContentType[] = ['NEWS', 'ARTICLE', 'TWEET', 'COMMENT'];
const MEDIA_TYPES: ContentType[] = ['VIDEO', 'PODCAST'];

// Drill-down builders. The News/Media pages honor `view`/`type` params; the
// `source_name` param is forward-looking (harmlessly ignored today) and at least
// lands the operator on the right browsing surface.
const newsSourceHref = (name: string) =>
    `/platform/news?view=library&source_name=${encodeURIComponent(name)}`;
const mediaSourceHref = (name: string) =>
    `/platform/media?source_name=${encodeURIComponent(name)}`;

export default function ContentPage() {
    const queryClient = useQueryClient();
    const [rangeDays, setRangeDays] = useState(30);

    // Global (all-content) aggregates power the KPI band, velocity + pipeline health.
    const allStats = useContentStats({ range_days: rangeDays });
    // Media storage totals for the KPI band (deduped with the Media panel's own call).
    const media = useMediaSizeStats({ type: MEDIA_TYPES_FILTER });

    const isRefreshing = allStats.isFetching || media.isFetching;
    const lastUpdated = allStats.dataUpdatedAt ? new Date(allStats.dataUpdatedAt) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content</h1>
                    <p className="text-muted-foreground">
                        General content monitoring. News and Media are tracked separately —
                        drill in to manage each.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? 'animate-pulse bg-info' : 'bg-success'}`}
                            />
                            Updated {formatRelativeTime(lastUpdated)}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: contentKeys.all })}
                        disabled={isRefreshing}
                        aria-label="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {allStats.isError && !allStats.data ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                        <p className="text-sm text-muted-foreground">Couldn&apos;t load content statistics.</p>
                        <Button variant="outline" size="sm" onClick={() => allStats.refetch()} className="gap-1">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Global KPI band */}
                    <ContentKpiBand stats={allStats.data} media={media.data} isLoading={allStats.isLoading} />

                    {/* Velocity + pipeline health */}
                    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                        <IngestionVelocityChart
                            daily={allStats.data?.daily ?? []}
                            rangeDays={rangeDays}
                            onRangeChange={setRangeDays}
                            isLoading={allStats.isLoading}
                        />
                        <PipelineHealthCard stats={allStats.data} isLoading={allStats.isLoading} />
                    </div>

                    {/* News / Media split */}
                    <div className="grid gap-5 xl:grid-cols-2">
                        <DomainMonitorPanel
                            title="News"
                            overline="Editorial · Social"
                            accentClass="text-news"
                            railClass="bg-news"
                            accentColor="hsl(var(--news))"
                            href="/platform/news"
                            typeFilter={NEWS_TYPES_FILTER}
                            types={NEWS_TYPES}
                            rangeDays={rangeDays}
                            coverageMode="embedding"
                            sourceHref={newsSourceHref}
                        />
                        <DomainMonitorPanel
                            title="Media"
                            overline="Video · Podcast"
                            accentClass="text-info"
                            railClass="bg-info"
                            accentColor="hsl(var(--info))"
                            href="/platform/media"
                            typeFilter={MEDIA_TYPES_FILTER}
                            types={MEDIA_TYPES}
                            rangeDays={rangeDays}
                            coverageMode="caption"
                            sourceHref={mediaSourceHref}
                            extra={<StorageSummary />}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
