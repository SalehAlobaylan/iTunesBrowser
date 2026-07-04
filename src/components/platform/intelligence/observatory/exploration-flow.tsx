'use client';

import { cn } from '@/lib/utils';
import type { ObservatorySnapshot } from '@/types/platform/intelligence';

interface ExplorationFlowProps {
    snapshot?: ObservatorySnapshot;
}

// State colors — consistent with the spectrum: auditioning = sky, settled =
// gold, penalized = rose, not-yet-appraised = slate.
const C = {
    unscored: '#64748b',
    exploring: '#7dd3fc',
    established: '#e0a92e',
    demoted: '#fb7185',
};

const VW = 1000;
const VH = 240;

/**
 * The audition lifecycle — the engine's state machine made legible. Items enter
 * unscored, audition (exploring) while impressions accumulate, graduate to
 * settled (established), and a rank-down can demote one — which then decays back
 * toward settled. Node size encodes population; the arrows encode the real
 * transitions, so the left→right order carries meaning.
 */
export function ExplorationFlow({ snapshot }: ExplorationFlowProps) {
    const unscored = snapshot?.unscored_count ?? 0;
    const exploring = snapshot?.exploring_count ?? 0;
    const established = snapshot?.established_count ?? 0;
    const demoted = snapshot?.demoted_count ?? 0;
    const target = snapshot?.tuning?.explore_impression_target ?? 50;

    const maxN = Math.max(1, unscored, exploring, established, demoted);
    const r = (n: number) => 26 + 40 * Math.sqrt(n / maxN); // 26..66 px

    const yMid = 96;
    const nodes = {
        unscored: { x: 120, y: yMid, n: unscored, color: C.unscored, label: 'Unscored' },
        exploring: { x: 400, y: yMid, n: exploring, color: C.exploring, label: 'Auditioning' },
        established: { x: 680, y: yMid, n: established, color: C.established, label: 'Settled' },
        demoted: { x: 900, y: 196, n: demoted, color: C.demoted, label: 'Demoted' },
    };

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className="font-editorial">The audition lifecycle</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                How an item earns durable worth: it auditions until it has seen{' '}
                <span className="font-mono">{target}</span> impressions, graduates to settled, and a rank-down demotes
                it — then decays back.
            </p>

            <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-3 w-full" role="img" aria-label="Exploration lifecycle state flow">
                <defs>
                    <marker id="ef-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--muted-foreground))" />
                    </marker>
                    <marker id="ef-arrow-gold" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill={C.established} />
                    </marker>
                </defs>
                {/* edges */}
                <Edge from={nodes.unscored} to={nodes.exploring} label="intake" rTo={r(nodes.exploring.n)} rFrom={r(nodes.unscored.n)} />
                <Edge from={nodes.exploring} to={nodes.established} label={`graduates`} rTo={r(nodes.established.n)} rFrom={r(nodes.exploring.n)} />
                {/* established -> demoted (down) */}
                <Edge from={nodes.established} to={nodes.demoted} label="rank-down" rTo={r(nodes.demoted.n)} rFrom={r(nodes.established.n)} curve />
                {/* demoted -> established (decays back, dashed arc) */}
                <ReturnArc from={nodes.demoted} to={nodes.established} rFrom={r(nodes.demoted.n)} rTo={r(nodes.established.n)} />

                {/* nodes */}
                {Object.values(nodes).map((nd) => (
                    <Node key={nd.label} node={nd} radius={r(nd.n)} />
                ))}
            </svg>

            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <Legend color={C.exploring} text="protected from rank-down + purge while auditioning" />
                <Legend color={C.demoted} text="demotion decays over the configured half-life" />
            </div>
        </section>
    );
}

type NodeT = { x: number; y: number; n: number; color: string; label: string };

function Node({ node, radius }: { node: NodeT; radius: number }) {
    return (
        <g>
            <circle cx={node.x} cy={node.y} r={radius} fill={node.color} fillOpacity={0.16} stroke={node.color} strokeWidth={1.5} />
            <text x={node.x} y={node.y - 2} textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                {node.n.toLocaleString()}
            </text>
            <text x={node.x} y={node.y + radius + 16} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 13 }}>
                {node.label}
            </text>
        </g>
    );
}

function Edge({ from, to, label, rFrom, rTo, curve }: { from: NodeT; to: NodeT; label: string; rFrom: number; rTo: number; curve?: boolean }) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const x1 = from.x + ux * (rFrom + 4);
    const y1 = from.y + uy * (rFrom + 4);
    const x2 = to.x - ux * (rTo + 10);
    const y2 = to.y - uy * (rTo + 10);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const d = curve
        ? `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
        : `M ${x1} ${y1} L ${x2} ${y2}`;
    return (
        <g>
            <path d={d} fill="none" stroke="hsl(var(--border))" strokeWidth={2} markerEnd="url(#ef-arrow)" />
            <text x={curve ? x1 + 8 : midX} y={curve ? midY : midY - 8} textAnchor={curve ? 'start' : 'middle'} className="fill-muted-foreground" style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                {label}
            </text>
        </g>
    );
}

function ReturnArc({ from, to, rFrom, rTo }: { from: NodeT; to: NodeT; rFrom: number; rTo: number }) {
    const x1 = from.x - rFrom;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y + rTo + 2;
    const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2 - 30} ${(y1 + y2) / 2 + 30} ${x2} ${y2}`;
    return (
        <g>
            <path d={d} fill="none" stroke={C.established} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} markerEnd="url(#ef-arrow-gold)" />
            <text x={(x1 + x2) / 2 - 40} y={(y1 + y2) / 2 + 34} className="fill-muted-foreground" style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                decays back
            </text>
        </g>
    );
}

function Legend({ color, text }: { color: string; text: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={cn('inline-block h-2 w-2 rounded-sm')} style={{ background: color }} />
            {text}
        </span>
    );
}
