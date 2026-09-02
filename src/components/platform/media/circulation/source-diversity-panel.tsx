'use client';

import { ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MediaSourceDiversity } from '@/types/platform/media-circulation';

export function SourceDiversityPanel({ data, isLoading, isError }: { data?: MediaSourceDiversity; isLoading: boolean; isError: boolean }) {
    if (isLoading) return <Card className="rounded-sm border-foreground/30 shadow-none"><CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Loading source yield evidence</CardContent></Card>;
    if (isError || !data) return <Card className="rounded-sm border-amber-500/40 shadow-none"><CardContent className="p-5 text-sm text-muted-foreground">Source diversity is not qualified yet. The CMS migration or tenant-scoped evidence may still be pending.</CardContent></Card>;
    const failing = data.sources.filter((source) => !source.producing).slice(0, 6);
    return <Card className="rounded-sm border-foreground/30 shadow-none">
        <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><CardTitle className="font-serif text-xl">Pods source readiness</CardTitle><CardDescription>Only active, scheduled, healthy sources with recent visible output count.</CardDescription></div>
                <Badge variant={data.qualified ? 'success' : 'warning'} className="rounded-sm"><ShieldCheck className="me-1 h-3 w-3" />{data.producing_source_count}/{data.target_producing_sources} producing</Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-foreground/20 bg-foreground/20 sm:grid-cols-4">
                <Metric label="Target" value={data.target_producing_sources} />
                <Metric label="Qualified" value={data.producing_source_count} />
                <Metric label="Gap" value={data.gap} />
                <Metric label="Inventory" value={data.sources.length} />
            </div>
            {failing.length > 0 ? <div className="divide-y divide-foreground/10 rounded-sm border border-foreground/15">{failing.map((source) => <div key={source.source_id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"><div><div className="font-medium">{source.source_name}</div><div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{source.failing_boundary}</div><div className="mt-1 text-xs text-muted-foreground">{source.fetched_candidates_30d} fetched → {source.filtered_candidates_30d} filtered → {source.legal_candidates_30d} legal → {source.ready_visible_units_30d} visible / 30d</div></div><div className="flex items-center gap-3 text-xs text-muted-foreground"><a className="inline-flex items-center gap-1 underline underline-offset-2" href={source.scheduling_diagnostics_url}>Schedule <ExternalLink className="h-3 w-3" /></a></div></div>)}</div> : <p className="text-sm text-emerald-700">All currently inventoried sources satisfy the producing definition.</p>}
            <p className="text-xs text-muted-foreground">Approval remains human-controlled. Discovery links recommend candidates; they do not approve or mutate sources.</p>
        </CardContent>
    </Card>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="bg-card p-3"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-mono text-lg">{value}</div></div>; }
