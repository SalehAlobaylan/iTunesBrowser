'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    HardDrive,
    AlertTriangle,
    Trash2,
    RefreshCw,
    PlayCircle,
    RotateCcw,
    PieChart as PieChartIcon,
    Loader2,
    Snowflake,
    Shield,
    Clock,
    Sliders,
    Activity,
    Zap,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    AreaChart,
    Area,
    CartesianGrid,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    formatBytes,
    usePolicyOverrides,
    usePurgeStorage,
    useReconcileStorage,
    useRestoreStorageItem,
    useRunSweepNow,
    useStorageCandidates,
    useStorageOperations,
    useStoragePolicy,
    useStoragePreview,
    useStorageStats,
    useSweepRuns,
    useUpdateStoragePolicy,
    useDeletePolicyOverride,
} from '@/hooks/use-storage';
import type {
    OpClassStatus,
    StorageOperationsResponse,
} from '@/types/platform/storage-ops';
import { useQualityProfiles } from '@/hooks/use-quality';
import { getPreset } from '@/lib/constants/ingest-presets';
import type {
    StoragePolicy,
    UpdatePolicyRequest,
} from '@/types/platform/storage';

const ARTIFACT_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];

export default function StoragePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') ?? 'overview';

    function handleTabChange(value: string) {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set('tab', value);
        router.replace(`/platform/storage?${params.toString()}`);
    }

    const stats = useStorageStats();
    const sweepRuns = useSweepRuns();
    const runSweep = useRunSweepNow();
    const reconcile = useReconcileStorage();

    // Page-level status pill — what the operator sees at a glance.
    // Priority: aggregation error > over-quota > warn (>=80%) > ok.
    const utilization = stats.data?.utilization_pct ?? 0;
    const pageStatus: 'ok' | 'warn' | 'err' = stats.data?.aggregation_error
        ? 'err'
        : utilization >= 80
            ? 'warn'
            : 'ok';
    const pageStatusLabel = pageStatus === 'err' ? 'S3 UNREACHABLE' : pageStatus === 'warn' ? 'WARN' : 'OK';
    const pageStatusVariant = pageStatus === 'err' ? 'destructive' : pageStatus === 'warn' ? 'secondary' : 'success';

    return (
        <div className="space-y-6 p-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-semibold">Storage Management</h1>
                    <Badge variant={pageStatusVariant}>{pageStatusLabel}</Badge>
                </div>
            </header>

            {/* Persistent error banner — survives across all tabs */}
            {stats.data?.aggregation_error && (
                <div className="flex items-start gap-2 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500" />
                    <div>
                        <p className="font-medium">Live S3 stats unavailable</p>
                        <p className="text-muted-foreground">{stats.data.aggregation_error}</p>
                        <p className="text-muted-foreground">Showing DB-tracked totals as a fallback.</p>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="policy">Policy</TabsTrigger>
                    <TabsTrigger value="execute">Execute</TabsTrigger>
                </TabsList>

                {/* ───────────────────────────── Overview (Track) ───────────────────────────── */}
                <TabsContent value="overview" className="mt-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Read-only health view. Use <strong>Policy</strong> to change behaviour or{' '}
                            <strong>Execute</strong> to take action.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => stats.refetch()}
                            disabled={stats.isFetching}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${stats.isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                    <UsageOverview />
                    <OperationsPanel />
                    <BreakdownCharts />
                    <RecentSweepsPreview />
                    <button
                        onClick={() => handleTabChange('policy')}
                        className="flex w-full items-center gap-3 rounded border border-border bg-muted/30 p-3 text-sm hover:bg-muted/50 transition text-left"
                    >
                        <Sliders className="h-5 w-5 text-cyan-400 shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Want to shrink files instead of deleting them?</p>
                            <p className="text-xs text-muted-foreground">
                                Set the archive action to <strong>Re-encode (shrink)</strong> in Policy — re-encodes
                                content to a smaller profile while keeping it playable. Often saves 40–60%.
                            </p>
                        </div>
                        <span className="text-cyan-400">→</span>
                    </button>
                </TabsContent>

                {/* ───────────────────────────── Policy (Configure) ───────────────────────────── */}
                <TabsContent value="policy" className="mt-4 space-y-6">
                    <p className="text-sm text-muted-foreground">
                        Configure what auto-circulation does. Edits here take effect on the next sweep tick;
                        click <strong>Execute → Run sweep now</strong> to apply immediately.
                    </p>
                    <PreviewBanner />
                    <PolicyCard />
                    <OverridesTable />
                </TabsContent>

                {/* ───────────────────────────── Execute (Act) ───────────────────────────── */}
                <TabsContent value="execute" className="mt-4 space-y-6">
                    <ExecuteActionBar
                        onRunSweep={() => runSweep.mutate()}
                        runSweepPending={runSweep.isPending}
                        lastSweep={sweepRuns.data?.data?.[0]}
                    />
                    <CandidatesTable />
                    <ToolsCard
                        onReconcile={() => reconcile.mutate()}
                        reconciling={reconcile.isPending}
                        reconcileResult={reconcile.data}
                    />
                    <ActivityLog />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview helpers — compact previews of data shown fully on Execute
// ─────────────────────────────────────────────────────────────────────────────

function RecentSweepsPreview() {
    const { data, isLoading } = useSweepRuns();
    if (isLoading) return <Skeleton className="h-24 w-full" />;
    const runs = (data?.data ?? []).slice(0, 5);
    if (runs.length === 0) return null;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Recent sweep activity</CardTitle>
                <span className="text-xs text-muted-foreground">
                    Last {runs.length} of {data?.total ?? 0}
                </span>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Started</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead className="text-right">Deleted</TableHead>
                            <TableHead className="text-right">Freed</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {runs.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="text-xs">{new Date(r.started_at).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={r.trigger === 'manual' ? 'default' : 'secondary'}>
                                        {r.trigger}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{r.deleted_count}</TableCell>
                                <TableCell className="text-right">{formatBytes(r.freed_bytes)}</TableCell>
                                <TableCell>
                                    {r.error
                                        ? <Badge variant="destructive" title={r.error}>error</Badge>
                                        : <Badge variant="success">ok</Badge>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <p className="mt-2 text-right text-xs text-muted-foreground">
                    Full history in <strong>Execute</strong> tab.
                </p>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute action bar — manual triggers + last-run summary
// ─────────────────────────────────────────────────────────────────────────────

function ExecuteActionBar({
    onRunSweep,
    runSweepPending,
    lastSweep,
}: {
    onRunSweep: () => void;
    runSweepPending: boolean;
    lastSweep?: { started_at: string; deleted_count: number; freed_bytes: number; error?: string };
}) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-medium">Manual sweep</p>
                    {lastSweep ? (
                        <p className="text-xs text-muted-foreground">
                            Last run {new Date(lastSweep.started_at).toLocaleString()} —{' '}
                            {lastSweep.error
                                ? <span className="text-red-400">error</span>
                                : <>deleted <strong>{lastSweep.deleted_count}</strong>, freed <strong>{formatBytes(lastSweep.freed_bytes)}</strong></>}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">No sweeps yet.</p>
                    )}
                </div>
                <Button onClick={onRunSweep} disabled={runSweepPending}>
                    {runSweepPending
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <PlayCircle className="mr-2 h-4 w-4" />}
                    Run sweep now
                </Button>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-purge preview banner
// ─────────────────────────────────────────────────────────────────────────────

function PreviewBanner() {
    const { data, isLoading } = useStoragePreview();
    if (isLoading || !data) return null;
    if (!data.enabled) {
        return (
            <div className="flex items-center gap-2 rounded border border-border bg-muted/40 p-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                    Auto-circulation is <strong>off</strong>. Enable it in the policy card below or use
                    the &ldquo;Run sweep now&rdquo; button for a one-shot pass.
                </span>
            </div>
        );
    }

    const nextRun = data.next_run_at ? new Date(data.next_run_at) : null;
    const minutesUntil = nextRun ? Math.max(0, Math.round((nextRun.getTime() - Date.now()) / 60_000)) : null;
    const willPurge = data.candidates_count > 0;
    const action =
        data.archive_action === 'move_to_cold' ? 'move to cold tier'
        : data.archive_action === 're_encode' ? 're-encode (shrink in place)'
        : 'delete from primary';

    return (
        <div
            className={`flex items-start gap-3 rounded border p-3 text-sm ${willPurge ? 'border-blue-500/40 bg-blue-500/10' : 'border-border bg-muted/40'
                }`}
        >
            <Clock className={`mt-0.5 h-4 w-4 ${willPurge ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <div className="flex-1">
                <p className="font-medium">
                    {willPurge ? (
                        <>
                            Next sweep will {action} <strong>{data.candidates_count}</strong> items
                            (~<strong>{formatBytes(data.bytes_to_free)}</strong>)
                        </>
                    ) : (
                        <>Next sweep will purge nothing — quota is comfortable.</>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">
                    {nextRun && (
                        <>Scheduled for {nextRun.toLocaleString()} ({minutesUntil}m from now). </>
                    )}
                    {data.protected_count > 0 && (
                        <>
                            <Shield className="mr-1 inline h-3 w-3" />
                            {data.protected_count} hot items ({formatBytes(data.protected_bytes)}) are
                            protected from purge.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage gauge
// ─────────────────────────────────────────────────────────────────────────────

function UsageOverview() {
    const { data, isLoading } = useStorageStats();

    if (isLoading || !data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    const pct = Math.min(100, data.utilization_pct);
    const overQuota = data.utilization_pct > 100;
    const fillColor = overQuota ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Storage usage</CardTitle>
                <CardDescription>
                    Live R2 bucket against your configured quota
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={180}>
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="100%"
                                data={[{ name: 'used', value: pct, fill: fillColor }]}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey="value" cornerRadius={6} angleAxisId={0} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                        <Stat label="Used" value={formatBytes(data.used_bytes)} />
                        <Stat label="Quota" value={formatBytes(data.quota_bytes)} />
                        <Stat
                            label="Utilization"
                            value={`${data.utilization_pct.toFixed(1)}%`}
                            color={overQuota ? 'text-red-500' : pct > 80 ? 'text-yellow-500' : 'text-green-500'}
                        />
                    </div>
                    <div className="space-y-2">
                        <Stat label="Objects" value={data.object_count.toLocaleString()} />
                        <Stat label="DB-tracked" value={formatBytes(data.db_tracked_bytes)} />
                        <Stat label="Updated" value={new Date(data.live_stats_at).toLocaleTimeString()} />
                    </div>
                </div>

                {data.cold_enabled && data.cold && (
                    <div className="mt-4 flex items-center gap-3 rounded border border-border bg-muted/30 p-3">
                        <Snowflake className="h-5 w-5 text-cyan-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Cold tier</p>
                            <p className="text-xs text-muted-foreground">
                                {formatBytes(data.cold.used_bytes)} across{' '}
                                {data.cold.object_count.toLocaleString()} objects in the secondary
                                bucket.
                            </p>
                        </div>
                    </div>
                )}
                {data.cold_enabled && !data.cold && (
                    <div className="mt-4 flex items-center gap-3 rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                        <Snowflake className="h-4 w-4" />
                        Cold tier is enabled but Aggregation could not query it. Check the cold
                        storage credentials.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex items-baseline justify-between border-b border-border/50 pb-1 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-base font-semibold ${color ?? ''}`}>{value}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations panel — Class A / Class B free-tier tracking
// ─────────────────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
    if (!n || n <= 0) return '0';
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`;
    if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n >= 100_000_000 ? 0 : 2)}M`;
    return `${(n / 1_000_000_000).toFixed(2)}B`;
}

function statusColor(status: OpClassStatus): string {
    switch (status) {
        case 'cap':  return 'bg-red-500';
        case 'warn': return 'bg-yellow-500';
        default:     return 'bg-emerald-500';
    }
}

function statusLabel(status: OpClassStatus): string {
    switch (status) {
        case 'cap':  return 'CAPPED';
        case 'warn': return 'WARN';
        default:     return 'OK';
    }
}

function OperationsPanel() {
    const { data, isLoading } = useStorageOperations(30);

    if (isLoading || !data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }

    const worstStatus: OpClassStatus =
        data.class_a.status === 'cap' || data.class_b.status === 'cap' ? 'cap'
        : data.class_a.status === 'warn' || data.class_b.status === 'warn' ? 'warn'
        : 'ok';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-cyan-400" />
                        <div>
                            <CardTitle>S3 operations — {data.month}</CardTitle>
                            <CardDescription>
                                Cloudflare R2 free-tier tracking. Auto-sweeps pause when a class hits its cap.
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={worstStatus === 'cap' ? 'destructive' : worstStatus === 'warn' ? 'secondary' : 'success'}>
                        {statusLabel(worstStatus)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {worstStatus === 'cap' && (
                    <div className="flex items-start gap-2 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-red-500" />
                        <div>
                            <p className="font-medium text-red-300">Free-tier cap reached</p>
                            <p className="text-muted-foreground">
                                Auto-sweeps and rule-driven re-encodes are paused until next month. Manual
                                actions (Run sweep now, Re-encode) still work but consume the same budget.
                            </p>
                        </div>
                    </div>
                )}

                {/* Two-up budget bars */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <BudgetBar title="Class A (writes, lists)" summary={data.class_a} />
                    <BudgetBar title="Class B (reads, heads)" summary={data.class_b} />
                </div>

                {/* Daily trend chart */}
                {data.daily.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                            Daily operations — last {data.daily.length} day(s)
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={data.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tickFormatter={(v) => formatCount(Number(v))} tick={{ fontSize: 10 }} />
                                <Tooltip
                                    formatter={(v) => formatCount(Number(v))}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="class_a" stackId="1" stroke="#f59e0b" fill="#f59e0b80" name="Class A" />
                                <Area type="monotone" dataKey="class_b" stackId="1" stroke="#0ea5e9" fill="#0ea5e980" name="Class B" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Per-op-type table + per-source chips — collapsed by default to
                    keep the dashboard scannable. Power users expand for detail. */}
                <details className="rounded border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                        Show op-type breakdown &amp; source contribution
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                            By operation type (this month)
                        </p>
                        {data.by_op_type.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No operations recorded yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Op type</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">% of class</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.by_op_type.slice(0, 10).map((r) => (
                                        <TableRow key={`${r.op_class}-${r.op_type}`}>
                                            <TableCell className="font-mono text-xs">{r.op_type}</TableCell>
                                            <TableCell>
                                                <Badge variant={r.op_class === 'A' ? 'destructive' : 'secondary'}>
                                                    {r.op_class}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCount(r.count)}</TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {r.pct_of_class.toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                            Source breakdown
                        </p>
                        <div className="space-y-2">
                            {data.by_source.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sources yet.</p>
                            ) : (
                                data.by_source.map((s) => (
                                    <div
                                        key={s.source}
                                        className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2"
                                    >
                                        <span className="text-sm capitalize">
                                            {s.source === 'cloudflare' ? (
                                                <span className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3 text-orange-400" /> Cloudflare
                                                </span>
                                            ) : 'Internal SDK'}
                                        </span>
                                        <span className="font-mono text-sm">{formatCount(s.count)}</span>
                                    </div>
                                ))
                            )}
                            <p className="text-xs text-muted-foreground">
                                <strong>Internal</strong> = ops we made via our S3 SDK.{' '}
                                <strong>Cloudflare</strong> = pulled from R2 Analytics, includes public CDN reads.
                            </p>
                        </div>
                    </div>
                    </div>
                </details>
            </CardContent>
        </Card>
    );
}

function BudgetBar({ title, summary }: { title: string; summary: StorageOperationsResponse['class_a'] }) {
    const isCapped = summary.status === 'cap';
    const noCap = summary.budget <= 0;
    return (
        <div className="rounded border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{title}</span>
                <Badge variant={isCapped ? 'destructive' : summary.status === 'warn' ? 'secondary' : 'success'}>
                    {statusLabel(summary.status)}
                </Badge>
            </div>
            <p className="text-2xl font-semibold">
                {formatCount(summary.used)}
                {!noCap && (
                    <span className="text-base font-normal text-muted-foreground">
                        {' '}/ {formatCount(summary.budget)} ({summary.pct.toFixed(1)}%)
                    </span>
                )}
            </p>
            {!noCap && (
                <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
                    <div
                        className={`h-full ${statusColor(summary.status)}`}
                        style={{ width: `${Math.min(100, summary.pct)}%` }}
                    />
                </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                {noCap
                    ? 'No budget cap configured (cost projection only).'
                    : (
                        <>
                            {formatCount(summary.remaining)} remaining this month.
                            {summary.projected_to_exceed_at && summary.pct < 100 && (
                                <>
                                    {' '}At current burn rate, projected to exceed budget on{' '}
                                    <strong>{summary.projected_to_exceed_at}</strong>.
                                </>
                            )}
                        </>
                    )}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy card (Global default)
// ─────────────────────────────────────────────────────────────────────────────

function PolicyCard() {
    const { data, isLoading } = useStoragePolicy('global');
    const { data: stats } = useStorageStats({ paused: true });
    const update = useUpdateStoragePolicy();

    if (isLoading || !data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <PolicyForm
            policy={data}
            scope="global"
            coldEnabled={stats?.cold_enabled ?? false}
            onSave={(req) => update.mutate(req)}
            saving={update.isPending}
        />
    );
}

interface PolicyFormProps {
    policy: StoragePolicy;
    scope: 'global' | 'tenant';
    tenantId?: string;
    coldEnabled?: boolean;
    onSave: (req: UpdatePolicyRequest) => void;
    saving: boolean;
}

function PolicyForm({ policy, scope, tenantId, coldEnabled = false, onSave, saving }: PolicyFormProps) {
    const [enabled, setEnabled] = useState(policy.enabled);
    const [maxGB, setMaxGB] = useState((policy.max_storage_bytes / (1024 * 1024 * 1024)).toFixed(2));
    const [target, setTarget] = useState(String(policy.target_utilization_pct));
    const [minAge, setMinAge] = useState(String(policy.min_age_days));
    const [minViews, setMinViews] = useState(String(policy.min_view_count_for_keep));
    const [interval, setInterval] = useState(String(policy.sweep_interval_minutes));
    const [deleteFailed, setDeleteFailed] = useState(policy.delete_failed_immediately);
    const [preserveThumbs, setPreserveThumbs] = useState(policy.preserve_thumbnails);
    const [protectN, setProtectN] = useState(String(policy.protect_top_n_by_views ?? 50));
    const [protectWindow, setProtectWindow] = useState(String(policy.protect_top_n_window_days ?? 30));
    const [archiveAction, setArchiveAction] = useState<'delete' | 'move_to_cold' | 're_encode'>(
        policy.archive_action ?? 'delete'
    );
    // re_encode target — null = "auto" (resolved per item by source_type).
    const [reEncodeTarget, setReEncodeTarget] = useState<string>(
        policy.re_encode_target_profile_id ? String(policy.re_encode_target_profile_id) : ''
    );
    // Pull profiles so the re-encode action can offer a target picker.
    const qualityProfiles = useQualityProfiles();
    // Operation budgets (Cloudflare R2 free-tier defaults).
    const [classABudget, setClassABudget] = useState(String(policy.class_a_free_budget ?? 1_000_000));
    const [classBBudget, setClassBBudget] = useState(String(policy.class_b_free_budget ?? 10_000_000));
    const [classAWarn, setClassAWarn] = useState(String(policy.class_a_warn_pct ?? 80));
    const [classACap, setClassACap] = useState(String(policy.class_a_cap_pct ?? 95));
    const [classBWarn, setClassBWarn] = useState(String(policy.class_b_warn_pct ?? 80));
    const [classBCap, setClassBCap] = useState(String(policy.class_b_cap_pct ?? 95));

    function resetBudgetsToR2Defaults() {
        setClassABudget('1000000');
        setClassBBudget('10000000');
        setClassAWarn('80');
        setClassACap('95');
        setClassBWarn('80');
        setClassBCap('95');
    }

    function handleSave() {
        const payload: UpdatePolicyRequest = {
            scope,
            enabled,
            max_storage_bytes: Math.round(parseFloat(maxGB) * 1024 * 1024 * 1024),
            target_utilization_pct: parseInt(target, 10),
            min_age_days: parseInt(minAge, 10),
            min_view_count_for_keep: parseInt(minViews, 10),
            sweep_interval_minutes: parseInt(interval, 10),
            delete_failed_immediately: deleteFailed,
            preserve_thumbnails: preserveThumbs,
            protect_top_n_by_views: parseInt(protectN, 10),
            protect_top_n_window_days: parseInt(protectWindow, 10),
            archive_action: archiveAction,
            re_encode_target_profile_id: archiveAction === 're_encode'
                ? (reEncodeTarget ? parseInt(reEncodeTarget, 10) : 0)
                : undefined,
            class_a_free_budget: parseInt(classABudget, 10) || 0,
            class_b_free_budget: parseInt(classBBudget, 10) || 0,
            class_a_warn_pct: parseInt(classAWarn, 10),
            class_a_cap_pct: parseInt(classACap, 10),
            class_b_warn_pct: parseInt(classBWarn, 10),
            class_b_cap_pct: parseInt(classBCap, 10),
        };
        if (scope === 'tenant' && tenantId) {
            payload.tenant_id = tenantId;
        }
        onSave(payload);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Auto-circulation {scope === 'global' ? '(Global default)' : `(Tenant: ${tenantId})`}
                </CardTitle>
                <CardDescription>
                    When enabled, the storage worker periodically deletes old/low-engagement
                    content from R2 while keeping the DB row so it can be restored.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded border border-border p-3">
                    <Checkbox
                        id={`enabled-${scope}-${tenantId ?? 'global'}`}
                        checked={enabled}
                        onCheckedChange={(v) => setEnabled(v === true)}
                    />
                    <Label htmlFor={`enabled-${scope}-${tenantId ?? 'global'}`}>
                        Enable auto-circulation
                    </Label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Max storage (GB)" hint="Hard cap before sweeping kicks in">
                        <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={maxGB}
                            onChange={(e) => setMaxGB(e.target.value)}
                        />
                    </Field>
                    <Field label="Target utilization %" hint="Sweep until usage <= this %">
                        <Input
                            type="number"
                            min="10"
                            max="100"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                        />
                    </Field>
                    <Field label="Sweep interval (minutes)" hint="How often the worker tick runs">
                        <Input
                            type="number"
                            min="1"
                            max="1440"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                        />
                    </Field>
                    <Field label="Min age (days)" hint="Never purge content younger than this">
                        <Input
                            type="number"
                            min="0"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                        />
                    </Field>
                    <Field label="Max view count" hint="Items at or below this count are eligible">
                        <Input
                            type="number"
                            min="0"
                            value={minViews}
                            onChange={(e) => setMinViews(e.target.value)}
                        />
                    </Field>
                    <div className="space-y-3 self-end">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={`failed-${scope}-${tenantId ?? 'global'}`}
                                checked={deleteFailed}
                                onCheckedChange={(v) => setDeleteFailed(v === true)}
                            />
                            <Label htmlFor={`failed-${scope}-${tenantId ?? 'global'}`}>
                                Purge FAILED items immediately
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={`thumbs-${scope}-${tenantId ?? 'global'}`}
                                checked={preserveThumbs}
                                onCheckedChange={(v) => setPreserveThumbs(v === true)}
                            />
                            <Label htmlFor={`thumbs-${scope}-${tenantId ?? 'global'}`}>
                                Keep thumbnails on archive
                            </Label>
                        </div>
                    </div>
                </div>

                <details className="rounded border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                        <Shield className="mr-2 inline h-4 w-4 text-emerald-500" />
                        Hot-content protection
                    </summary>
                    <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Top-viewed items in the recent window are exempt from purge regardless of
                            the age/view rules above. Set top-N to 0 to disable.
                        </p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="Protect top-N by views" hint="Most-viewed items kept regardless of age">
                                <Input
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={protectN}
                                    onChange={(e) => setProtectN(e.target.value)}
                                />
                            </Field>
                            <Field label="Window (days)" hint="Look-back range for the top-N ranking">
                                <Input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={protectWindow}
                                    onChange={(e) => setProtectWindow(e.target.value)}
                                />
                            </Field>
                        </div>
                    </div>
                </details>

                <div className="rounded border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Snowflake className="h-4 w-4 text-cyan-400" />
                        Archive action
                    </div>
                    <p className="text-xs text-muted-foreground">
                        What to do with eligible items. <strong>Move to cold</strong> requires the
                        secondary bucket to be configured (COLD_STORAGE_* env vars on Aggregation).
                    </p>
                    <div className="flex gap-3">
                        <label className="flex flex-1 cursor-pointer items-start gap-2 rounded border border-border p-2 hover:bg-muted/30">
                            <input
                                type="radio"
                                name={`action-${scope}-${tenantId ?? 'global'}`}
                                value="delete"
                                checked={archiveAction === 'delete'}
                                onChange={() => setArchiveAction('delete')}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm font-medium">Delete from primary</p>
                                <p className="text-xs text-muted-foreground">
                                    Mark ARCHIVED in DB, drop the bytes. Restore re-fetches.
                                </p>
                            </div>
                        </label>
                        <label
                            className={`flex flex-1 cursor-pointer items-start gap-2 rounded border p-2 hover:bg-muted/30 ${
                                archiveAction === 'move_to_cold' && !coldEnabled
                                    ? 'border-orange-500/60'
                                    : 'border-border'
                            }`}
                        >
                            <input
                                type="radio"
                                name={`action-${scope}-${tenantId ?? 'global'}`}
                                value="move_to_cold"
                                checked={archiveAction === 'move_to_cold'}
                                onChange={() => setArchiveAction('move_to_cold')}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm font-medium">Move to cold tier</p>
                                <p className="text-xs text-muted-foreground">
                                    Copy to secondary bucket, drop from primary. Item stays
                                    playable from cold URL.
                                </p>
                            </div>
                        </label>
                        <label className="flex flex-1 cursor-pointer items-start gap-2 rounded border border-border p-2 hover:bg-muted/30">
                            <input
                                type="radio"
                                name={`action-${scope}-${tenantId ?? 'global'}`}
                                value="re_encode"
                                checked={archiveAction === 're_encode'}
                                onChange={() => setArchiveAction('re_encode')}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm font-medium">Re-encode (shrink)</p>
                                <p className="text-xs text-muted-foreground">
                                    Encode eligible items to a smaller ingest profile. Item stays
                                    playable. Slower than delete/move; produces real byte savings.
                                </p>
                            </div>
                        </label>
                    </div>

                    {archiveAction === 're_encode' && (
                        <div className="space-y-2 rounded border border-cyan-500/40 bg-cyan-500/5 p-3">
                            <Label className="text-sm">Target profile</Label>
                            <select
                                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                                value={reEncodeTarget}
                                onChange={(e) => setReEncodeTarget(e.target.value)}
                            >
                                <option value="">
                                    Auto — use each item&apos;s resolved ingest profile by source type
                                </option>
                                {(qualityProfiles.data?.data ?? []).map((p) => {
                                    const preset = getPreset(p.preset_key);
                                    // Prefix the preset display name when known so operators can
                                    // identify "this is our Mobile Feed profile" at a glance.
                                    const presetPrefix = preset ? `[${preset.displayName}] ` : '';
                                    return (
                                        <option key={p.id} value={String(p.id)}>
                                            {presetPrefix}{p.name}
                                            {p.tenant_id ? ' · tenant' : ' · global'}
                                            {p.source_type ? ` · ${p.source_type}` : ''}
                                            {' · '}
                                            {p.max_height > 0 ? `${p.max_height}p` : 'no cap'}
                                            {' · '}
                                            {p.target_bitrate_kbps > 0 ? `${p.target_bitrate_kbps}kbps` : `CRF ${p.crf}`}
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                <strong>Auto</strong> uses the most-specific ingest profile for each
                                item (typically the global default). Pick an explicit profile to force
                                all eligible items down to e.g. <code>archival-480p</code>. Manage
                                profiles in <a className="text-cyan-400 underline" href="/platform/quality">Quality</a>.
                                Re-encodes happen async on the quality queue; sweep activity reports
                                the count enqueued (byte savings emerge as each item completes).
                            </p>
                            {(qualityProfiles.data?.data?.length ?? 0) === 0 && (
                                <div className="flex items-start gap-2 rounded border border-orange-500/40 bg-orange-500/10 p-2 text-xs">
                                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                                    <span>
                                        No ingest profiles exist yet. Re-encode needs at least one
                                        global profile to fall back on — create one in{' '}
                                        <a className="underline" href="/platform/quality">Quality</a>.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {archiveAction === 'move_to_cold' && !coldEnabled && (
                        <div className="flex items-start gap-2 rounded border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                            <div>
                                <p className="font-medium text-orange-400">Cold storage is not configured</p>
                                <p className="mt-0.5 text-muted-foreground">
                                    Without <code className="rounded bg-muted px-1 py-0.5 text-xs">COLD_STORAGE_*</code> environment
                                    variables set on Aggregation, eligible items will be{' '}
                                    <strong className="text-orange-300">permanently deleted</strong> from primary
                                    storage instead of moved. The app will continue to work, but restore will require
                                    re-fetching from the original source.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <details className="rounded border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                        <Activity className="mr-2 inline h-4 w-4 text-cyan-400" />
                        Operation budgets — Cloudflare R2 free-tier defaults
                    </summary>
                    <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Set the per-month free-tier cap for each operation class. When monthly usage
                            (internal SDK + Cloudflare Analytics) exceeds the warn % the Operations panel
                            shows a warning; at the cap %, auto-sweepers refuse to enqueue work. Manual
                            triggers always run. Set a budget to <strong>0</strong> to disable the cap (e.g.
                            paid AWS S3 plans).
                        </p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Field label="Class A budget / month" hint="Writes, lists, deletes — R2 free: 1M">
                                <Input type="number" min="0" value={classABudget}
                                    onChange={(e) => setClassABudget(e.target.value)} />
                            </Field>
                            <Field label="Class A warn %" hint="Yellow status above this">
                                <Input type="number" min="0" max="100" value={classAWarn}
                                    onChange={(e) => setClassAWarn(e.target.value)} />
                            </Field>
                            <Field label="Class A cap %" hint="Auto-sweeps refused above this">
                                <Input type="number" min="0" max="100" value={classACap}
                                    onChange={(e) => setClassACap(e.target.value)} />
                            </Field>
                            <Field label="Class B budget / month" hint="Reads, heads — R2 free: 10M">
                                <Input type="number" min="0" value={classBBudget}
                                    onChange={(e) => setClassBBudget(e.target.value)} />
                            </Field>
                            <Field label="Class B warn %" hint="Yellow status above this">
                                <Input type="number" min="0" max="100" value={classBWarn}
                                    onChange={(e) => setClassBWarn(e.target.value)} />
                            </Field>
                            <Field label="Class B cap %" hint="Auto-sweeps refused above this">
                                <Input type="number" min="0" max="100" value={classBCap}
                                    onChange={(e) => setClassBCap(e.target.value)} />
                            </Field>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={resetBudgetsToR2Defaults}>
                            Reset to R2 free-tier defaults
                        </Button>
                    </div>
                </details>

                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                        Last swept:{' '}
                        {policy.last_sweep_at
                            ? new Date(policy.last_sweep_at).toLocaleString()
                            : 'never'}
                    </p>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save policy
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm">{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown charts
// ─────────────────────────────────────────────────────────────────────────────

function BreakdownCharts() {
    const { data, isLoading } = useStorageStats();
    if (isLoading || !data) return null;

    const artifactData = Object.entries(data.by_artifact_type).map(([k, v]) => ({
        name: k,
        value: v,
    }));
    const contentData = Object.entries(data.by_content_type).map(([k, v]) => ({
        name: k,
        bytes: v.bytes,
        count: v.count,
    }));

    const hasArtifact = artifactData.length > 0;
    const hasContent = contentData.length > 0;

    if (!hasArtifact && !hasContent) {
        return (
            <Card>
                <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                    <PieChartIcon className="h-4 w-4" />
                    No storage breakdown yet — upload some content to populate this view.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {hasArtifact && (
                <Card>
                    <CardHeader>
                        <CardTitle>By artifact type</CardTitle>
                        <CardDescription>Live S3 totals grouped by key prefix</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={artifactData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    label={(e) => `${e.name}: ${formatBytes(e.value as number)}`}
                                >
                                    {artifactData.map((_, i) => (
                                        <Cell key={i} fill={ARTIFACT_COLORS[i % ARTIFACT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => formatBytes(v as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
            {hasContent && (
                <Card>
                    <CardHeader>
                        <CardTitle>By content type</CardTitle>
                        <CardDescription>DB-tracked sizes (excludes archived)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={contentData}>
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(v) => formatBytes(v)} />
                                <Tooltip formatter={(v) => formatBytes(v as number)} />
                                <Bar dataKey="bytes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidates tab
// ─────────────────────────────────────────────────────────────────────────────

function CandidatesTable() {
    const [params, setParams] = useState({
        min_age_days: undefined as number | undefined,
        max_view_count: undefined as number | undefined,
        status: '',
        limit: 100,
    });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [preserveThumbs, setPreserveThumbs] = useState(true);

    const candidates = useStorageCandidates({
        min_age_days: params.min_age_days,
        max_view_count: params.max_view_count,
        status: params.status || undefined,
        limit: params.limit,
    });
    const purge = usePurgeStorage();

    const items = useMemo(() => candidates.data?.data ?? [], [candidates.data]);
    const allSelected = items.length > 0 && selected.size === items.length;

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(items.map((i) => i.id)));
    }

    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const selectedBytes = useMemo(
        () => items.filter((i) => selected.has(i.id)).reduce((s, i) => s + i.file_size_bytes, 0),
        [items, selected]
    );

    function handleDryRun() {
        purge.mutate({
            ids: Array.from(selected),
            dry_run: true,
            preserve_thumbnails: preserveThumbs,
        });
    }

    function handlePurge() {
        purge.mutate(
            {
                ids: Array.from(selected),
                dry_run: false,
                preserve_thumbnails: preserveThumbs,
            },
            {
                onSuccess: () => {
                    setSelected(new Set());
                    setConfirmOpen(false);
                    candidates.refetch();
                },
            }
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Purge candidates</CardTitle>
                    <CardDescription>
                        Items eligible for storage purge, sorted worst-first.
                        {candidates.data && (
                            <> Total candidates: <strong>{candidates.data.total}</strong>, freeable:{' '}
                                <strong>{formatBytes(candidates.data.total_bytes)}</strong></>
                        )}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDryRun}
                        disabled={selected.size === 0 || purge.isPending}
                    >
                        Dry run ({selected.size})
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setConfirmOpen(true)}
                        disabled={selected.size === 0 || purge.isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Purge selected ({formatBytes(selectedBytes)})
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div>
                        <Label>Min age (days)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={params.min_age_days ?? ''}
                            onChange={(e) =>
                                setParams((p) => ({ ...p, min_age_days: e.target.value ? parseInt(e.target.value, 10) : undefined }))
                            }
                        />
                    </div>
                    <div>
                        <Label>Max view count</Label>
                        <Input
                            type="number"
                            min="0"
                            value={params.max_view_count ?? ''}
                            onChange={(e) =>
                                setParams((p) => ({ ...p, max_view_count: e.target.value ? parseInt(e.target.value, 10) : undefined }))
                            }
                        />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Input
                            placeholder="e.g. FAILED"
                            value={params.status}
                            onChange={(e) => setParams((p) => ({ ...p, status: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" className="w-full" onClick={() => candidates.refetch()}>
                            Apply filters
                        </Button>
                    </div>
                </div>

                <div className="mb-3 flex items-center gap-2">
                    <Checkbox
                        id="preserve-thumbs-purge"
                        checked={preserveThumbs}
                        onCheckedChange={(v) => setPreserveThumbs(v === true)}
                    />
                    <Label htmlFor="preserve-thumbs-purge" className="text-sm">
                        Keep thumbnails (recommended — they are tiny and let the placeholder render)
                    </Label>
                </div>

                {candidates.isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8">
                                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No candidates match the current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.has(c.id)}
                                                onCheckedChange={() => toggleOne(c.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{c.title || c.id}</TableCell>
                                        <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant={c.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{c.view_count}</TableCell>
                                        <TableCell className="text-right">{formatBytes(c.file_size_bytes)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm purge</DialogTitle>
                        <DialogDescription>
                            About to delete S3 objects for {selected.size} items, freeing approximately{' '}
                            <strong>{formatBytes(selectedBytes)}</strong>. The DB rows stay, with status set to
                            ARCHIVED. Restore is possible via the Activity tab.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handlePurge} disabled={purge.isPending}>
                            {purge.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Purge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant overrides tab
// ─────────────────────────────────────────────────────────────────────────────

function OverridesTable() {
    const { data, isLoading } = usePolicyOverrides();
    const { data: stats } = useStorageStats({ paused: true });
    const update = useUpdateStoragePolicy();
    const remove = useDeletePolicyOverride();
    const [newTenant, setNewTenant] = useState('');
    const [editing, setEditing] = useState<string | null>(null);

    if (isLoading || !data) {
        return <Skeleton className="h-32 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Per-tenant overrides</CardTitle>
                <CardDescription>
                    Overrides fully replace the global policy for the named tenant.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label>Add override for tenant</Label>
                        <Input
                            placeholder="tenant_id"
                            value={newTenant}
                            onChange={(e) => setNewTenant(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => {
                            if (!newTenant.trim()) return;
                            update.mutate(
                                { scope: 'tenant', tenant_id: newTenant.trim(), enabled: false },
                                { onSuccess: () => setNewTenant('') }
                            );
                        }}
                        disabled={!newTenant.trim() || update.isPending}
                    >
                        Create
                    </Button>
                </div>

                {data.overrides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tenant overrides yet — global default applies to all tenants.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Enabled</TableHead>
                                <TableHead className="text-right">Cap</TableHead>
                                <TableHead className="text-right">Target %</TableHead>
                                <TableHead className="text-right">Min age</TableHead>
                                <TableHead className="text-right">Interval</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.overrides.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.tenant_id}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.enabled ? 'success' : 'secondary'}>
                                            {p.enabled ? 'on' : 'off'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatBytes(p.max_storage_bytes)}</TableCell>
                                    <TableCell className="text-right">{p.target_utilization_pct}%</TableCell>
                                    <TableCell className="text-right">{p.min_age_days}d</TableCell>
                                    <TableCell className="text-right">{p.sweep_interval_minutes}m</TableCell>
                                    <TableCell className="space-x-2 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditing(editing === p.tenant_id ? null : p.tenant_id ?? null)}
                                        >
                                            {editing === p.tenant_id ? 'Close' : 'Edit'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => p.tenant_id && remove.mutate(p.tenant_id)}
                                            disabled={remove.isPending}
                                        >
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {editing && data.overrides.find((o) => o.tenant_id === editing) && (
                    <PolicyForm
                        scope="tenant"
                        tenantId={editing}
                        policy={data.overrides.find((o) => o.tenant_id === editing)!}
                        coldEnabled={stats?.cold_enabled ?? false}
                        onSave={(req) => update.mutate(req)}
                        saving={update.isPending}
                    />
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity log
// ─────────────────────────────────────────────────────────────────────────────

function ActivityLog() {
    const { data, isLoading } = useSweepRuns();
    const restore = useRestoreStorageItem();
    const [restoreId, setRestoreId] = useState('');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sweep activity</CardTitle>
                <CardDescription>Every circulation tick — auto and manual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-2 rounded border border-border p-3">
                    <div className="flex-1">
                        <Label>Restore by content ID</Label>
                        <Input
                            placeholder="UUID"
                            value={restoreId}
                            onChange={(e) => setRestoreId(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (restoreId.trim()) {
                                restore.mutate(restoreId.trim(), { onSuccess: () => setRestoreId('') });
                            }
                        }}
                        disabled={restore.isPending || !restoreId.trim()}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                    </Button>
                </div>

                {isLoading || !data ? (
                    <Skeleton className="h-32 w-full" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Started</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead className="text-right">Deleted</TableHead>
                                <TableHead className="text-right">Freed</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No sweep runs yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="text-xs">
                                            {new Date(r.started_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={r.trigger === 'manual' ? 'default' : 'secondary'}>
                                                {r.trigger}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{r.deleted_count}</TableCell>
                                        <TableCell className="text-right">{formatBytes(r.freed_bytes)}</TableCell>
                                        <TableCell>{r.tenant_id}</TableCell>
                                        <TableCell>
                                            {r.error ? (
                                                <Badge variant="destructive" title={r.error}>error</Badge>
                                            ) : (
                                                <Badge variant="success">ok</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

function ToolsCard({
    onReconcile,
    reconciling,
    reconcileResult,
}: {
    onReconcile: () => void;
    reconciling: boolean;
    reconcileResult?: { orphan_keys: string[]; missing_objects: string[]; orphan_count: number; missing_count: number };
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tools</CardTitle>
                <CardDescription>One-shot maintenance actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded border border-border p-3">
                    <div>
                        <p className="font-medium">Reconcile S3 ↔ DB</p>
                        <p className="text-xs text-muted-foreground">
                            Lists every object in the bucket and compares against CMS rows. Use this when you suspect drift.
                        </p>
                    </div>
                    <Button onClick={onReconcile} disabled={reconciling}>
                        {reconciling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run reconcile
                    </Button>
                </div>

                {reconcileResult && (
                    <div className="rounded border border-border p-3 text-sm">
                        <p>
                            <strong>{reconcileResult.orphan_count}</strong> orphan keys (in S3, not referenced by DB)
                        </p>
                        <p>
                            <strong>{reconcileResult.missing_count}</strong> missing objects (DB references missing in S3)
                        </p>
                        {reconcileResult.orphan_count > 0 && (
                            <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-muted-foreground">
                                    Show orphan keys
                                </summary>
                                <pre className="mt-1 max-h-48 overflow-auto bg-muted/30 p-2 text-xs">
                                    {reconcileResult.orphan_keys.slice(0, 200).join('\n')}
                                    {reconcileResult.orphan_keys.length > 200 ? '\n…' : ''}
                                </pre>
                            </details>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
