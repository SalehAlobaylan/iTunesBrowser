'use client';

import { Activity, AlertTriangle, Clock3, Pause, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    useCloseFeedIntegrityEpisode,
    useFeedIntegrityEpisodes,
    useFeedIntegrityFindings,
    useFeedIntegrityRuns,
    useFeedIntegrityStatus,
    usePauseFeedIntegritySchedule,
    useRunFeedIntegrity,
    useUpdateFeedIntegrityPolicy,
} from '@/hooks/use-feed-integrity';
import type { FeedIntegrityFeedResult } from '@/types/platform/feed-integrity';
import { FeedIntegrityAutopilotPanel } from '@/components/platform/feed-integrity/feed-integrity-autopilot-panel';
import { OperatorLaunchLink } from '@/components/operator/operator-launch-link';
import { createRouteVisibleContext } from '@/lib/operator/route-manifest';

function tone(value?: string) {
    if (value === 'healthy' || value === 'completed') return 'success' as const;
    if (value === 'broken' || value === 'failed' || value === 'critical') return 'destructive' as const;
    if (value === 'degraded_major' || value === 'degraded_minor' || value === 'partial') return 'warning' as const;
    return 'secondary' as const;
}

function FeedCard({ title, result }: { title: string; result?: FeedIntegrityFeedResult }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    {title}
                    <Badge variant={tone(result?.consumer_verdict)}>{result?.consumer_verdict ?? 'not checked'}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Metric label="Experience" value={result ? `${Math.round(result.consumer_score)}%` : '-'} />
                <Metric label="Readiness" value={result ? `${Math.round(result.readiness_score)}%` : '-'} />
                <Metric label="Readiness verdict" value={result?.readiness_verdict ?? '-'} />
                <Metric label="Violations" value={String(result?.violations ?? 0)} />
            </CardContent>
        </Card>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}

export default function FeedIntegrityPage() {
    const { data, isLoading, isFetching, refetch } = useFeedIntegrityStatus();
    const { data: runs } = useFeedIntegrityRuns();
    const { data: findings } = useFeedIntegrityFindings();
    const { data: episodes } = useFeedIntegrityEpisodes();
    const savePolicy = useUpdateFeedIntegrityPolicy();
    const run = useRunFeedIntegrity();
    const pause = usePauseFeedIntegritySchedule();
    const close = useCloseFeedIntegrityEpisode();
    const policy = data?.policy;
    const results = data?.latest_run?.feed_results;
    const isPaused = !!policy?.paused_until && new Date(policy.paused_until).getTime() > Date.now();
    const episodeItems = episodes?.items ?? data?.open_episodes ?? [];
    const operatorContext = useMemo(() => createRouteVisibleContext('/platform/feed-integrity', {
        subjects: [{ type: 'news_window', id: 'today', label: 'Today' }],
        selection: { mode: 'explicit', ids: ['today'], count: 1 },
    }), []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">Feed Integrity</h1><Badge variant="outline">CMS edge</Badge></div>
                    <p className="text-muted-foreground">CMS delivery edge</p>
                </div>
                <div className="flex gap-2">
                    {operatorContext ? <OperatorLaunchLink context={operatorContext} intent="resolve" size="sm">Inspect snapshot</OperatorLaunchLink> : null}
                    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
                    <Button variant="outline" onClick={() => run.mutate('light')} disabled={run.isPending}><Play className="mr-2 h-4 w-4" />Light run</Button>
                    <Button onClick={() => run.mutate('deep')} disabled={run.isPending}><ShieldCheck className="mr-2 h-4 w-4" />Deep run</Button>
                </div>
            </div>

            <Card>
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div><p className="font-medium">{data?.latest_run?.summary ?? 'No checks have run yet.'}</p><p className="text-sm text-muted-foreground">Latest run: {data?.latest_run?.started_at ? new Date(data.latest_run.started_at).toLocaleString() : 'never'}</p></div>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2"><Switch checked={policy?.scheduled_enabled ?? false} disabled={!policy || savePolicy.isPending} onCheckedChange={(scheduled_enabled) => savePolicy.mutate({ scheduled_enabled })} /><span className="text-sm">Scheduled checks</span><Badge variant={isPaused ? 'warning' : 'secondary'}>{isPaused ? 'paused' : `${policy?.light_interval_minutes ?? 15} min`}</Badge><Button size="sm" variant="ghost" disabled={pause.isPending} onClick={() => pause.mutate(isPaused ? 0 : 120)}><Pause className="h-4 w-4" /></Button></div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2"><FeedCard title="Pods" result={results?.pods} /><FeedCard title="News" result={results?.news} /></div>

            <FeedIntegrityAutopilotPanel />

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-destructive" />Attention</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {episodeItems.filter((episode) => episode.status === 'open' || episode.status === 'recovering').slice(0, 8).map((episode) => <div className="flex items-start justify-between gap-3 rounded-md border p-3" key={episode.id}><div><div className="flex gap-2"><Badge variant={tone(episode.severity)}>{episode.severity}</Badge><Badge variant="outline">{episode.feed} - {episode.variant}</Badge></div><p className="mt-2 text-sm font-medium">{episode.summary}</p><p className="text-xs text-muted-foreground">Last seen {new Date(episode.last_seen_at).toLocaleString()}</p></div><Button size="sm" variant="outline" disabled={close.isPending} onClick={() => close.mutate({ id: episode.id })}>Close</Button></div>)}
                        {!isLoading && !episodeItems.some((episode) => episode.status === 'open' || episode.status === 'recovering') ? <p className="text-sm text-muted-foreground">No open integrity episodes.</p> : null}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Recent runs</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {(runs?.items ?? []).slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"><div><span className="font-medium">{item.tier}</span><span className="ml-2 text-muted-foreground">{item.summary}</span></div><Badge variant={tone(item.status)}>{item.status}</Badge></div>)}
                        {!runs?.items?.length ? <p className="text-sm text-muted-foreground">No run history yet.</p> : null}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Recent findings</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {(findings?.items ?? []).filter((item) => item.status !== 'pass').slice(0, 20).map((item) => <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm" key={item.id}><Badge variant={tone(item.severity)}>{item.severity || item.status}</Badge><span className="font-medium">{item.check_key}</span><span className="text-muted-foreground">{item.feed} - {item.variant}</span>{item.target_ref ? <span className="truncate text-xs text-muted-foreground">{item.target_ref}</span> : null}</div>)}
                    {!findings?.items?.length ? <p className="text-sm text-muted-foreground">Run a check to populate the ledger.</p> : null}
                </CardContent>
            </Card>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading Feed Integrity...</p> : null}
        </div>
    );
}
