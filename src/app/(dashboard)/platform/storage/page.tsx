'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
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
    useStoragePolicy,
    useStoragePreview,
    useStorageStats,
    useSweepRuns,
    useUpdateStoragePolicy,
    useDeletePolicyOverride,
} from '@/hooks/use-storage';
import type {
    StoragePolicy,
    UpdatePolicyRequest,
} from '@/types/platform/storage';

const ARTIFACT_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];

export default function StoragePage() {
    const stats = useStorageStats();
    const overrides = usePolicyOverrides();
    const sweepRuns = useSweepRuns();
    const runSweep = useRunSweepNow();
    const reconcile = useReconcileStorage();

    return (
        <div className="space-y-6 p-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-2xl font-semibold">Storage Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor R2 usage, set auto-circulation rules, and purge old content.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => stats.refetch()}
                        disabled={stats.isFetching}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${stats.isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => runSweep.mutate()}
                        disabled={runSweep.isPending}
                    >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Run sweep now
                    </Button>
                </div>
            </header>

            {stats.data?.aggregation_error && (
                <div className="flex items-start gap-2 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500" />
                    <div>
                        <p className="font-medium">Live S3 stats unavailable</p>
                        <p className="text-muted-foreground">{stats.data.aggregation_error}</p>
                        <p className="text-muted-foreground">
                            Showing DB-tracked totals as a fallback.
                        </p>
                    </div>
                </div>
            )}

            <PreviewBanner />
            <UsageOverview />

            {/* Cross-link to Quality Management */}
            <Link
                href="/platform/quality"
                className="flex items-center gap-3 rounded border border-border bg-muted/30 p-3 text-sm hover:bg-muted/50 transition"
            >
                <Sliders className="h-5 w-5 text-cyan-400" />
                <div className="flex-1">
                    <p className="font-medium">Want to shrink files instead of deleting them?</p>
                    <p className="text-xs text-muted-foreground">
                        Quality Management re-encodes content to a smaller profile while keeping it
                        playable. Often saves 40-60% with no visible difference on phones.
                    </p>
                </div>
                <span className="text-cyan-400">→</span>
            </Link>

            <PolicyCard />
            <BreakdownCharts />

            <Tabs defaultValue="candidates" className="w-full">
                <TabsList>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="overrides">Tenant overrides</TabsTrigger>
                    <TabsTrigger value="activity">
                        Activity ({sweepRuns.data?.total ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="candidates" className="mt-4">
                    <CandidatesTable />
                </TabsContent>

                <TabsContent value="overrides" className="mt-4">
                    <OverridesTable />
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                    <ActivityLog />
                </TabsContent>

                <TabsContent value="tools" className="mt-4">
                    <ToolsCard onReconcile={() => reconcile.mutate()} reconciling={reconcile.isPending} reconcileResult={reconcile.data} />
                </TabsContent>
            </Tabs>
        </div>
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
    const action = data.archive_action === 'move_to_cold' ? 'move to cold tier' : 'delete from primary';

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
    const [archiveAction, setArchiveAction] = useState<'delete' | 'move_to_cold'>(
        policy.archive_action ?? 'delete'
    );

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

                <div className="rounded border border-border p-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        Hot-content protection
                    </div>
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
                    </div>

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
