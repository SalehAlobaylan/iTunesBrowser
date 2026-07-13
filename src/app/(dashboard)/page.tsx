'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOpsAttention, useOpsStatus } from '@/hooks/use-operations-command-center';
import { useSystemHealth } from '@/hooks/use-system-health';
import { useFeedIntegrityStatus } from '@/hooks/use-feed-integrity';
import { useExperienceStatus } from '@/hooks/use-real-experience';
import { useAISpendStatus } from '@/hooks/use-ai-spend';
import { useStatusCounts } from '@/hooks/use-pipeline';
import { useStorageHealth } from '@/hooks/use-storage';
import { useSources } from '@/hooks/use-sources';
import type { RuxVerdict } from '@/types/platform/real-experience';

type BadgeTone = 'success' | 'warning' | 'destructive' | 'secondary';

const GOOD = ['healthy', 'all_clear', 'within', 'ok', 'running', 'idle', 'completed'];
const BAD = ['degraded_major', 'broken', 'critical', 'unhealthy', 'incident', 'errored', 'stalled', 'failed', 'over_budget', 'bounded_stop'];
const WATCH = ['watching', 'watch', 'warning', 'degraded', 'degraded_minor', 'minor', 'attention', 'paused', 'pressure', 'over_pace', 'recovering', 'telemetry_degraded'];

function tone(value?: string | null): BadgeTone {
    if (!value) return 'secondary';
    const v = value.toLowerCase();
    if (GOOD.includes(v)) return 'success';
    if (BAD.includes(v)) return 'destructive';
    if (WATCH.includes(v)) return 'warning';
    return 'secondary';
}

const label = (value?: string | null) => (value ? value.replaceAll('_', ' ') : 'unknown');

const relative = (value?: string | null) => {
    if (!value) return 'never';
    const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60_000);
    if (Math.abs(minutes) >= 60 * 24) return new Intl.RelativeTimeFormat('en').format(Math.round(minutes / (60 * 24)), 'day');
    if (Math.abs(minutes) >= 60) return new Intl.RelativeTimeFormat('en').format(Math.round(minutes / 60), 'hour');
    return new Intl.RelativeTimeFormat('en').format(minutes, 'minute');
};

const RUX_ORDER: RuxVerdict[] = ['critical', 'degraded', 'telemetry_degraded', 'watching', 'insufficient_data', 'healthy'];

export default function DashboardPage() {
    const ops = useOpsStatus();
    const attention = useOpsAttention();
    const systemHealth = useSystemHealth();
    const feedIntegrity = useFeedIntegrityStatus();
    const experience = useExperienceStatus();
    const spend = useAISpendStatus();
    const statusCounts = useStatusCounts();
    const storage = useStorageHealth();
    const sources = useSources({ page: 1, limit: 1 });

    const attentionItems = useMemo(
        () => (attention.data?.items ?? []).filter((item) => !item.snoozed).slice(0, 6),
        [attention.data],
    );

    // Services verdict
    const unhealthyServices = (systemHealth.data?.services ?? []).filter((s) => s.status !== 'healthy');

    // Feed integrity verdicts per feed (worst consumer verdict shown as badge)
    const feedResults = Object.values(feedIntegrity.data?.latest_run?.feed_results ?? {});
    const openEpisodes = feedIntegrity.data?.open_episodes?.length ?? 0;

    // Experience: worst surface verdict
    const ruxVerdicts = Object.values(experience.data?.surface_verdicts ?? {}).map((s) => s.verdict);
    const worstRux = RUX_ORDER.find((v) => ruxVerdicts.includes(v)) ?? (experience.data ? 'insufficient_data' : undefined);

    // Spend: worst budget state + month total
    const budgets = spend.data?.budgets ?? [];
    const spendTotal = budgets.reduce((sum, b) => sum + b.spend_usd, 0);
    const spendState = budgets.some((b) => b.paused_until && new Date(b.paused_until) > new Date())
        ? 'paused'
        : budgets.some((b) => b.cap_usd && b.spend_usd >= b.cap_usd * (b.hard_pct / 100))
            ? 'over_budget'
            : budgets.some((b) => b.cap_usd && b.spend_usd >= b.cap_usd * (b.warn_pct / 100))
                ? 'warning'
                : budgets.length
                    ? 'within'
                    : undefined;

    // Fleet: lane states from ops
    const fleet = ops.data?.fleet ?? [];
    const stalled = fleet.filter((f) => f.state === 'stalled' || f.state === 'errored').length;
    const pausedLanes = fleet.filter((f) => f.state === 'paused').length;
    const fleetState = fleet.length ? (stalled ? 'stalled' : pausedLanes ? 'paused' : 'all_clear') : undefined;

    const counts = statusCounts.data;
    const proof = storage.data?.proof;

    return (
        <div className="space-y-8">
            {/* What is happening */}
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                    {ops.data ? <Badge variant={tone(ops.data.headline)}>{label(ops.data.headline)}</Badge> : null}
                </div>
                <p className="mt-1 text-muted-foreground">
                    {ops.data?.summary ?? 'Health, attention, and content flow across the platform.'}
                </p>
                {ops.data ? (
                    <p className="mt-1 text-xs text-muted-foreground">Snapshot {new Date(ops.data.as_of).toLocaleString()}</p>
                ) : null}
            </div>

            {/* Is it healthy — one tile per governance surface */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <VerdictTile
                    href="/platform/system-health"
                    title="Services"
                    loading={systemHealth.isLoading}
                    verdict={systemHealth.data?.overall}
                    detail={
                        systemHealth.data
                            ? unhealthyServices.length
                                ? `${unhealthyServices.map((s) => s.displayName).join(', ')} not healthy`
                                : `${systemHealth.data.services.length} services healthy`
                            : undefined
                    }
                />
                <VerdictTile
                    href="/platform/feed-integrity"
                    title="Feed Integrity"
                    loading={feedIntegrity.isLoading}
                    verdict={feedIntegrity.data?.latest_run?.headline}
                    detail={
                        feedIntegrity.data
                            ? feedResults.length
                                ? `${feedResults.map((f) => `${f.feed} ${label(f.consumer_verdict)}`).join(' · ')}${openEpisodes ? ` · ${openEpisodes} open episodes` : ''}`
                                : 'No runs yet'
                            : undefined
                    }
                />
                <VerdictTile
                    href="/platform/real-experience"
                    title="Real Experience"
                    loading={experience.isLoading}
                    verdict={worstRux}
                    detail={
                        experience.data
                            ? `${experience.data.open_incidents} open incidents${experience.data.telemetry_fresh ? '' : ' · telemetry stale'}`
                            : undefined
                    }
                />
                <VerdictTile
                    href="/platform/economics"
                    title="AI Spend"
                    loading={spend.isLoading}
                    verdict={spendState}
                    detail={spend.data ? `$${spendTotal.toFixed(2)} across ${budgets.length} budgets` : undefined}
                />
                <VerdictTile
                    href="/platform/operations"
                    title="Autopilot Fleet"
                    loading={ops.isLoading}
                    verdict={fleetState}
                    detail={
                        ops.data
                            ? `${fleet.length} lanes · ${stalled} stalled · ${pausedLanes} paused`
                            : undefined
                    }
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                {/* What needs me */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Needs attention
                        </CardTitle>
                        <CardDescription>Top open items across the fleet. Act on them from Operations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {attention.isLoading ? (
                            <Skeleton className="h-24" />
                        ) : attentionItems.length ? (
                            <>
                                {attentionItems.map((item) => (
                                    <div key={item.key} className="rounded-md border p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={tone(item.severity)}>{item.severity}</Badge>
                                            <Badge variant="outline">{item.system}</Badge>
                                            <span className="ml-auto text-xs text-muted-foreground">{relative(item.first_seen)}</span>
                                        </div>
                                        <Link href={item.href} className="mt-2 block font-medium hover:underline">
                                            {item.title}
                                        </Link>
                                        {item.detail ? <p className="text-sm text-muted-foreground">{item.detail}</p> : null}
                                    </div>
                                ))}
                                <Link
                                    href="/platform/operations"
                                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                    Open Operations
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </>
                        ) : (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-success" />
                                Nothing needs attention right now.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Is content flowing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Content flow</CardTitle>
                        <CardDescription>Pipeline, supply, and storage at a glance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <FlowRow href="/platform/pipeline" label="Pending" value={counts?.PENDING} loading={statusCounts.isLoading} toneOverride={counts && counts.PENDING > 0 ? 'warning' : undefined} />
                        <FlowRow href="/platform/pipeline" label="Processing" value={counts?.PROCESSING} loading={statusCounts.isLoading} />
                        <FlowRow href="/platform/content" label="Ready" value={counts?.READY} loading={statusCounts.isLoading} toneOverride="success" />
                        <FlowRow href="/platform/pipeline" label="Failed" value={counts?.FAILED} loading={statusCounts.isLoading} toneOverride={counts && counts.FAILED > 0 ? 'destructive' : undefined} />
                        <FlowRow href="/platform/content" label="Archived" value={counts?.ARCHIVED} loading={statusCounts.isLoading} />
                        <div className="my-3 border-t" />
                        <FlowRow href="/platform/sources" label="Sources" value={sources.data?.total} loading={sources.isLoading} />
                        <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                            <Link href="/platform/storage" className="text-muted-foreground hover:text-foreground hover:underline">
                                Storage
                            </Link>
                            {storage.isLoading ? (
                                <Skeleton className="h-4 w-16" />
                            ) : proof ? (
                                <span className="flex items-center gap-2">
                                    <Badge variant={tone(storage.data?.state)}>{label(storage.data?.state)}</Badge>
                                    <span className="font-medium tabular-nums">{proof.utilization_pct.toFixed(0)}%</span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function VerdictTile({
    href,
    title,
    verdict,
    detail,
    loading,
}: {
    href: string;
    title: string;
    verdict?: string | null;
    detail?: string;
    loading?: boolean;
}) {
    return (
        <Link href={href}>
            <Card className="h-full transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{title}</p>
                        {loading ? (
                            <Skeleton className="h-5 w-16" />
                        ) : (
                            <Badge variant={tone(verdict)}>{label(verdict ?? 'unavailable')}</Badge>
                        )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {loading ? '' : detail ?? 'Could not load status.'}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

function FlowRow({
    href,
    label: rowLabel,
    value,
    loading,
    toneOverride,
}: {
    href: string;
    label: string;
    value?: number;
    loading?: boolean;
    toneOverride?: BadgeTone;
}) {
    return (
        <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
            <Link href={href} className="text-muted-foreground hover:text-foreground hover:underline">
                {rowLabel}
            </Link>
            {loading ? (
                <Skeleton className="h-4 w-12" />
            ) : (
                <span
                    className={
                        toneOverride === 'destructive'
                            ? 'font-medium tabular-nums text-destructive'
                            : toneOverride === 'warning'
                                ? 'font-medium tabular-nums text-amber-600 dark:text-amber-500'
                                : toneOverride === 'success'
                                    ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-500'
                                    : 'font-medium tabular-nums'
                    }
                >
                    {value?.toLocaleString() ?? '—'}
                </span>
            )}
        </div>
    );
}
