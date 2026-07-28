'use client';

import type { StudioLatestFlow } from '@/types/platform/media-studio-autopilot';

// Color = meaning, consistent across the studio cockpit.
const C = {
    queue: '#94a3b8', // slate — work waiting
    cleared: '#34d399', // emerald — autopilot handled it
    held: '#e0a92e', // gold — needs a human
    skip: '#64748b', // slate-dim — no-op / stale
    error: '#fb7185', // rose — failed
};

const VW = 1000;
const VH = 300;

interface Props {
    flow: StudioLatestFlow | null;
    mode: string;
}

/**
 * The clearance decision made legible: review cases enter, the autopilot
 * classifies each, and every case lands in exactly one outcome — auto-cleared
 * (reject/publish), held for a human (with the reason), skipped, or errored.
 * The pipeline is fixed; the counts are live from the latest run. In Observe the
 * edges are dashed — the autopilot would do this but changed nothing.
 */
export function StudioClearanceFlow({ flow, mode }: Props) {
    const observe = flow?.observe ?? mode === 'observe';

    const cleared = (flow?.rejected ?? 0) + (flow?.published ?? 0) + (flow?.stt ?? 0);
    const held = flow?.held_approval ?? 0;
    const skipped = flow?.skipped ?? 0;
    const errored = flow?.errored ?? 0;
    const total = cleared + held + skipped + errored;
    const queueIn = Math.max(total, flow?.cases_before ?? 0);

    const maxN = Math.max(1, queueIn, cleared, held, skipped, errored);
    const r = (n: number) => 22 + 34 * Math.sqrt(n / maxN); // 22..56px

    const source = { x: 130, y: 150, n: queueIn, color: C.queue, label: 'Review queue' };
    const outcomes = [
        { key: 'cleared', x: 760, y: 60, n: cleared, color: C.cleared, label: observe ? 'Would clear' : 'Auto-cleared', sub: subCleared(flow) },
        { key: 'held', x: 820, y: 150, n: held, color: C.held, label: 'Held pods', sub: subHeld(flow) },
        { key: 'skipped', x: 760, y: 235, n: skipped, color: C.skip, label: 'Skipped', sub: 'stale / no-op' },
        { key: 'errored', x: 620, y: 262, n: errored, color: C.error, label: 'Errors', sub: '' },
    ].filter((o) => o.n > 0 || o.key === 'cleared' || o.key === 'held');

    const classify = { x: 420, y: 150 };

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="font-editorial">What the autopilot did</span>
                </h2>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {observe ? 'Observe — dry run' : 'Safe Auto — live'}
                </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
                Every review case lands in exactly one outcome. Green = the autopilot handled it; gold =
                it needs your decision; slate = nothing to do; rose = an error.
            </p>

            <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-3 w-full" role="img" aria-label="Studio clearance decision flow">
                <defs>
                    {['cleared', 'held', 'skip', 'error'].map((k) => (
                        <marker key={k} id={`sf-arrow-${k}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6 Z" fill={C[k as keyof typeof C]} />
                        </marker>
                    ))}
                </defs>

                {/* queue -> classify */}
                <Edge x1={source.x + r(source.n) + 4} y1={source.y} x2={classify.x - 46} y2={classify.y}
                    color={C.queue} dashed={observe} markerId="skip" label="classify" />

                {/* classify diamond */}
                <g>
                    <rect x={classify.x - 42} y={classify.y - 20} width={84} height={40} rx={8}
                        fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
                    <text x={classify.x} y={classify.y + 4} textAnchor="middle" className="fill-muted-foreground"
                        style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                        classify
                    </text>
                </g>

                {/* classify -> each outcome */}
                {outcomes.map((o) => (
                    <Edge key={o.key} x1={classify.x + 46} y1={classify.y} x2={o.x - r(o.n) - 6} y2={o.y}
                        color={o.color} dashed={observe && (o.key === 'cleared')} markerId={markerFor(o.key)} />
                ))}

                {/* source node */}
                <Node node={source} radius={r(source.n)} />
                {/* outcome nodes */}
                {outcomes.map((o) => (
                    <Node key={o.key} node={o} radius={r(o.n)} sub={o.sub} dim={o.n === 0} />
                ))}
            </svg>

            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <Legend color={C.cleared} text="reject impossible · publish trusted · re-run STT" />
                <Legend color={C.held} text="trust not earned · editorial · multi-flag → your call" />
            </div>
        </section>
    );
}

function markerFor(key: string): string {
    if (key === 'cleared') return 'cleared';
    if (key === 'held') return 'held';
    if (key === 'errored') return 'error';
    return 'skip';
}

function subCleared(f: StudioLatestFlow | null): string {
    if (!f) return '';
    const parts: string[] = [];
    if (f.rejected) parts.push(`${f.rejected} rejected`);
    if (f.published) parts.push(`${f.published} published`);
    if (f.stt) parts.push(`${f.stt} STT`);
    return parts.join(' · ');
}

function subHeld(f: StudioLatestFlow | null): string {
    if (!f) return '';
    const parts: string[] = [];
    if (f.held_trust) parts.push(`${f.held_trust} trust`);
    if (f.held_editorial) parts.push(`${f.held_editorial} editorial`);
    if (f.held_multicode) parts.push(`${f.held_multicode} multi-flag`);
    if (f.held_upstream) parts.push(`${f.held_upstream} upstream-off`);
    return parts.join(' · ');
}

type NodeT = { x: number; y: number; n: number; color: string; label: string };

function Node({ node, radius, sub, dim }: { node: NodeT; radius: number; sub?: string; dim?: boolean }) {
    return (
        <g opacity={dim ? 0.4 : 1}>
            <circle cx={node.x} cy={node.y} r={radius} fill={node.color} fillOpacity={0.16} stroke={node.color} strokeWidth={1.5} />
            <text x={node.x} y={node.y - 1} textAnchor="middle" className="fill-foreground"
                style={{ fontSize: 20, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                {node.n.toLocaleString()}
            </text>
            <text x={node.x} y={node.y + radius + 15} textAnchor="middle" className="fill-foreground" style={{ fontSize: 12, fontWeight: 600 }}>
                {node.label}
            </text>
            {sub ? (
                <text x={node.x} y={node.y + radius + 29} textAnchor="middle" className="fill-muted-foreground"
                    style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>
                    {sub}
                </text>
            ) : null}
        </g>
    );
}

function Edge({ x1, y1, x2, y2, color, dashed, markerId, label }: {
    x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean; markerId: string; label?: string;
}) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    return (
        <g>
            <path d={`M ${x1} ${y1} L ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={2}
                strokeDasharray={dashed ? '5 4' : undefined} strokeOpacity={0.7} markerEnd={`url(#sf-arrow-${markerId})`} />
            {label ? (
                <text x={midX} y={midY - 7} textAnchor="middle" className="fill-muted-foreground"
                    style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                    {label}
                </text>
            ) : null}
        </g>
    );
}

function Legend({ color, text }: { color: string; text: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
            {text}
        </span>
    );
}
