'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PrefLatestFlow } from '@/types/platform/preference-autopilot';

// Maintenance decision-flow hero — hand-built SVG mirroring the Media Studio
// clearance flow. One frame answers "what did the last run actually do":
// candidates enter, the run fans out into its maintenance lanes, and outcomes
// land in auto-approved / held-for-human / skipped / errored. Dashed edges in
// Observe (dry-run).

const C = {
    source: 'hsl(var(--muted-foreground))',
    lane: 'hsl(var(--foreground))',
    auto: '#34d399',
    held: 'hsl(var(--primary))',
    skip: 'hsl(var(--muted-foreground))',
    error: 'hsl(var(--destructive))',
};

interface FlowNode {
    id: string;
    label: string;
    count: number;
    color: string;
    x: number;
    y: number;
}

function radius(n: number, maxN: number): number {
    if (maxN <= 0) return 20;
    return 18 + 22 * Math.sqrt(Math.max(n, 0) / maxN);
}

function Node({ node, maxN, dashed }: { node: FlowNode; maxN: number; dashed: boolean }) {
    const r = radius(node.count, maxN);
    return (
        <g>
            <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={node.color}
                fillOpacity={node.count > 0 ? 0.18 : 0.06}
                stroke={node.color}
                strokeWidth={1.5}
                strokeDasharray={dashed ? '5 4' : undefined}
            />
            <text x={node.x} y={node.y + 1} textAnchor="middle" className="fill-foreground" fontSize={15} fontWeight={700}>
                {node.count}
            </text>
            <text x={node.x} y={node.y + r + 15} textAnchor="middle" className="fill-muted-foreground" fontSize={10.5}>
                {node.label}
            </text>
        </g>
    );
}

function Edge({ from, to, color, dashed, maxN }: { from: FlowNode; to: FlowNode; color: string; dashed: boolean; maxN: number }) {
    const r1 = radius(from.count, maxN);
    const r2 = radius(to.count, maxN);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const x1 = from.x + (dx / len) * (r1 + 4);
    const y1 = from.y + (dy / len) * (r1 + 4);
    const x2 = to.x - (dx / len) * (r2 + 6);
    const y2 = to.y - (dy / len) * (r2 + 6);
    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeOpacity={to.count > 0 ? 0.65 : 0.18}
            strokeWidth={to.count > 0 ? 1.75 : 1}
            strokeDasharray={dashed ? '6 5' : undefined}
        />
    );
}

export function AutopilotFlow({ flow }: { flow: PrefLatestFlow | null | undefined }) {
    if (!flow) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Latest run flow</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    No completed run yet — run the Autopilot to see the maintenance flow.
                </CardContent>
            </Card>
        );
    }
    const b = flow.buckets;
    const dashed = flow.observe;

    const laneY = [55, 105, 155, 205, 255];
    const lanes: FlowNode[] = [
        { id: 'map', label: 'Mapping sweep', count: b.map_sweep + b.dirty_sweep, color: C.lane, x: 400, y: laneY[0] },
        { id: 'centroid', label: 'Centroid + members', count: b.centroid_refresh + b.member_refresh, color: C.lane, x: 400, y: laneY[1] },
        { id: 'recompute', label: 'Affinity recompute', count: b.recompute, color: C.lane, x: 400, y: laneY[2] },
        { id: 'mine', label: 'Mining', count: b.mine, color: C.lane, x: 400, y: laneY[3] },
        { id: 'enrich', label: 'Proposal scoring', count: b.proposal_enrich, color: C.lane, x: 400, y: laneY[4] },
    ];
    const totalLane = lanes.reduce((s, l) => s + l.count, 0) + b.baseline;
    const source: FlowNode = { id: 'in', label: dashed ? 'Run (dry-run)' : 'Run', count: totalLane, color: C.source, x: 110, y: 155 };
    const outcomes: FlowNode[] = [
        { id: 'auto', label: dashed ? 'Would auto-approve' : 'Auto-approved', count: b.auto_approve, color: C.auto, x: 720, y: 60 },
        { id: 'held', label: 'Held for you', count: b.merge_suggest, color: C.held, x: 720, y: 125 },
        { id: 'skip', label: 'Skipped', count: b.skipped, color: C.skip, x: 720, y: 195 },
        { id: 'err', label: 'Errored', count: b.errored, color: C.error, x: 720, y: 260 },
    ];
    const maxN = Math.max(source.count, ...lanes.map((l) => l.count), ...outcomes.map((o) => o.count), 1);

    return (
        <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Latest run flow</CardTitle>
                {dashed && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        Observe — dry run
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <svg viewBox="0 0 840 300" className="min-w-[640px]" role="img" aria-label="Autopilot maintenance flow">
                        {lanes.map((l) => (
                            <Edge key={`e-in-${l.id}`} from={source} to={l} color={C.source} dashed={dashed} maxN={maxN} />
                        ))}
                        {/* Enrich feeds the outcome column; the other lanes complete internally. */}
                        {outcomes.map((o) => (
                            <Edge key={`e-out-${o.id}`} from={lanes[4]} to={o} color={o.color} dashed={dashed} maxN={maxN} />
                        ))}
                        <Node node={source} maxN={maxN} dashed={dashed} />
                        {lanes.map((l) => (
                            <Node key={l.id} node={l} maxN={maxN} dashed={dashed} />
                        ))}
                        {outcomes.map((o) => (
                            <Node key={o.id} node={o} maxN={maxN} dashed={dashed} />
                        ))}
                    </svg>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <LegendSwatch color={C.lane} label="maintenance" />
                    <LegendSwatch color={C.auto} label="auto-handled" />
                    <LegendSwatch color={C.held} label="needs human" />
                    <LegendSwatch color={C.skip} label="skipped" />
                    <LegendSwatch color={C.error} label="errored" />
                </div>
            </CardContent>
        </Card>
    );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
        </span>
    );
}
