'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AggregationHealthPanel } from '@/components/platform/aggregation-health-panel';
import { OverallStatusHeader } from '@/components/platform/system-health/overall-status-header';
import { ServiceCard } from '@/components/platform/system-health/service-card';
import { DependencyGrid } from '@/components/platform/system-health/dependency-grid';
import { ModelLoadPanel } from '@/components/platform/system-health/model-load-panel';
import { MediaWorkerPanel } from '@/components/platform/system-health/media-worker-panel';
import { AiMetricsPanel } from '@/components/platform/system-health/ai-metrics-panel';
import { LlmStackPanel } from '@/components/platform/system-health/llm-stack-panel';
import { EnvAuditPanel } from '@/components/platform/system-health/env-audit-panel';
import { IssuesPanel } from '@/components/platform/system-health/issues-panel';
import { SystemAutopilotPanel } from '@/components/platform/system-health/system-autopilot-panel';
import { useSystemHealth } from '@/hooks/use-system-health';

export default function SystemHealthPage() {
    const { data, isLoading, isFetching, isError, error, refetch } = useSystemHealth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                <p className="text-muted-foreground">
                    Live status across every service, dependency, queue, and model. Auto-refreshes every 15s.
                </p>
            </div>

            <OverallStatusHeader
                snapshot={data}
                isFetching={isFetching}
                onRefresh={() => refetch()}
            />

            <SystemAutopilotPanel />

            {isError ? (
                <Card>
                    <CardContent className="p-4 text-sm text-destructive">
                        {error instanceof Error ? error.message : 'Failed to load system health.'}
                    </CardContent>
                </Card>
            ) : null}

            {isLoading || !data ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data.services.map((svc) => (
                            <ServiceCard
                                key={svc.name}
                                service={svc}
                                onRecheck={() => refetch()}
                                isRechecking={isFetching}
                            />
                        ))}
                    </div>

                    <DependencyGrid services={data.services} />

                    <AggregationHealthPanel />

                    <MediaWorkerPanel services={data.services} />

                    <AiMetricsPanel />

                    <LlmStackPanel />

                    <ModelLoadPanel services={data.services} />

                    <div className="grid gap-4 md:grid-cols-2">
                        <EnvAuditPanel envAudit={data.envAudit} />
                        <IssuesPanel issues={data.issues} />
                    </div>
                </>
            )}
        </div>
    );
}
