'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAISpendRollups, useAISpendRuns, useAISpendStatus, useRunAISpendGovernor } from '@/hooks/use-ai-spend';

const usd = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
}).format(value || 0);

export default function EconomicsPage() {
    const status = useAISpendStatus();
    const rollups = useAISpendRollups();
    const runs = useAISpendRuns();
    const run = useRunAISpendGovernor();

    if (status.isLoading) {
        return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>;
    }
    if (status.isError || !status.data) {
        return <Card><CardContent className="p-5 text-destructive">Could not load AI spend economics.</CardContent></Card>;
    }

    const rows = rollups.data?.rollups ?? [];
    const runRows = runs.data?.runs ?? [];
    const spend = rows.reduce((sum, row) => sum + row.cost_usd, 0);
    const saved = rows.reduce((sum, row) => sum + row.avoided_cost_usd, 0);
    const rolledEventCount = rows.reduce((sum, row) => sum + row.events, 0);
    const evidence = status.data.evidence ?? { event_count: 0, rollup_count: 0, run_count: 0 };
    const eventCount = Math.max(evidence.event_count, rolledEventCount);
    const rollupCount = Math.max(evidence.rollup_count, rows.length);
    const runCount = Math.max(evidence.run_count, runRows.length);

    return <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Spend &amp; Economics</h1>
                <p className="text-muted-foreground">Metering is always on. Governance is {status.data.policy.enabled ? 'enabled' : 'observe-only'}.</p>
            </div>
            <Button onClick={() => run.mutate()} disabled={run.isPending}>{run.isPending ? 'Updating…' : 'Refresh ledger'}</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card><CardHeader><CardDescription>Metered spend</CardDescription><CardTitle>{usd(spend)}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Current retained rollups</CardContent></Card>
            <Card><CardHeader><CardDescription>Avoided spend</CardDescription><CardTitle>{usd(saved)}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Estimated cache savings</CardContent></Card>
            <Card><CardHeader><CardDescription>Captured events</CardDescription><CardTitle>{eventCount.toLocaleString()}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Raw provider usage records received by CMS.</CardContent></Card>
            <Card><CardHeader><CardDescription>Read-model rollups</CardDescription><CardTitle>{rollupCount.toLocaleString()}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Rebuilt automatically in observe mode.</CardContent></Card>
            <Card><CardHeader><CardDescription>Ledger runs</CardDescription><CardTitle>{runCount.toLocaleString()}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Scheduled and manual folds</CardContent></Card>
        </div>

        {eventCount > 0 && rollupCount === 0 ? <Card className="border-amber-500/50"><CardContent className="p-4 text-sm"><span className="font-medium">Events are arriving, but the read model has not caught up.</span> Refresh the ledger or wait for the observe-mode runner.</CardContent></Card> : null}

        <Card>
            <CardHeader><CardTitle>Ledger activity</CardTitle><CardDescription>Recent daily rollups by operation and provider.</CardDescription></CardHeader>
            <CardContent>
                {rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="px-2 py-2">Day</th><th className="px-2 py-2">Class</th><th className="px-2 py-2">Operation</th><th className="px-2 py-2">Provider / model</th><th className="px-2 py-2 text-right">Events</th><th className="px-2 py-2 text-right">Cost</th></tr></thead><tbody>{rows.slice(0, 20).map((row) => <tr key={row.id} className="border-b last:border-0"><td className="whitespace-nowrap px-2 py-2">{row.day.slice(0, 10)}</td><td className="px-2 py-2">{row.spend_class || 'unknown'}</td><td className="px-2 py-2">{row.operation || 'unknown'}</td><td className="px-2 py-2">{row.provider || 'unknown'}{row.model ? ` / ${row.model}` : ''}</td><td className="px-2 py-2 text-right">{row.events.toLocaleString()}</td><td className="px-2 py-2 text-right">{usd(row.cost_usd)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No rollups yet. Captured events will appear here after the next ledger run.</p>}
            </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Budget authority</CardTitle><CardDescription>A bounded operational stop, not provider invoice enforcement.</CardDescription></CardHeader><CardContent className="space-y-3">{status.data.budgets.length ? status.data.budgets.map(b => <div key={b.id} className="flex justify-between border-b pb-2 text-sm"><span>{b.scope}</span><span>{usd(b.spend_usd)} / {b.cap_usd == null ? 'watch only' : usd(b.cap_usd)}</span></div>) : <p className="text-sm text-muted-foreground">No budget scopes configured. The ledger is observing only.</p>}</CardContent></Card>

        <Card><CardHeader><CardTitle>Recent ledger runs</CardTitle></CardHeader><CardContent className="space-y-2">{runRows.slice(0, 8).map(r => <div key={r.id} className="flex justify-between text-sm"><span>{r.headline || r.status} · {r.trigger}</span><span>{r.events_folded.toLocaleString()} events</span></div>)}{!runRows.length && <p className="text-sm text-muted-foreground">No aggregation run yet.</p>}</CardContent></Card>
    </div>;
}
