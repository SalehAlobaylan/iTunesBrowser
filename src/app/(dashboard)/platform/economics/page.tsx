'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAISpendRollups, useAISpendRuns, useAISpendStatus, useRunAISpendGovernor } from '@/hooks/use-ai-spend';

const usd = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value || 0);

export default function EconomicsPage() {
    const status = useAISpendStatus(); const rollups = useAISpendRollups(); const runs = useAISpendRuns(); const run = useRunAISpendGovernor();
    if (status.isLoading) return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>;
    if (status.isError || !status.data) return <Card><CardContent className="p-5 text-destructive">Could not load AI spend economics.</CardContent></Card>;
    const rows = rollups.data?.rollups ?? []; const spend = rows.reduce((sum, row) => sum + row.cost_usd, 0); const saved = rows.reduce((sum, row) => sum + row.avoided_cost_usd, 0);
    return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold tracking-tight">AI Spend & Economics</h1><p className="text-muted-foreground">Metering is always on. Governance is {status.data.policy.enabled ? 'enabled' : 'observe-only'}.</p></div><Button onClick={() => run.mutate()} disabled={run.isPending}>{run.isPending ? 'Updating…' : 'Refresh ledger'}</Button></div>
        <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardDescription>Metered spend</CardDescription><CardTitle>{usd(spend)}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Current retained rollups</CardContent></Card><Card><CardHeader><CardDescription>Measured cache avoidance</CardDescription><CardTitle>{usd(saved)}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Estimated legacy hits are marked in the ledger.</CardContent></Card><Card><CardHeader><CardDescription>Open attention</CardDescription><CardTitle>{status.data.episodes.length}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Budget and ledger-quality episodes</CardContent></Card></div>
        <Card><CardHeader><CardTitle>Budget authority</CardTitle><CardDescription>A bounded operational stop, not provider invoice enforcement.</CardDescription></CardHeader><CardContent className="space-y-3">{status.data.budgets.length ? status.data.budgets.map(b => <div key={b.id} className="flex justify-between border-b pb-2 text-sm"><span>{b.scope}</span><span>{usd(b.spend_usd)} / {b.cap_usd == null ? 'watch only' : usd(b.cap_usd)}</span></div>) : <p className="text-sm text-muted-foreground">No budget scopes configured. The ledger is observing only.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Recent ledger runs</CardTitle></CardHeader><CardContent className="space-y-2">{(runs.data?.runs ?? []).slice(0, 8).map(r => <div key={r.id} className="flex justify-between text-sm"><span>{r.headline || r.status} · {r.trigger}</span><span>{r.events_folded} events</span></div>)}{!(runs.data?.runs ?? []).length && <p className="text-sm text-muted-foreground">No aggregation run yet.</p>}</CardContent></Card>
    </div>;
}
