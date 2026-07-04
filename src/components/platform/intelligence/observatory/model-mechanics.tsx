'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ObservatorySnapshot } from '@/types/platform/intelligence';

interface ModelMechanicsProps {
    snapshot?: ObservatorySnapshot;
}

const SETTLED = '#e0a92e';
const AUDITION = '#7dd3fc';

// Confidence half-life constant mirrors the engine (conf = I/(I+50)).
const CONF_HALF = 50;

/**
 * Model mechanics — the two laws that govern the engine, drawn live from the
 * current tuning, plus how value is composed. Left: confidence rises with
 * impressions (an item graduates at the configured target). Middle: a demotion
 * decays back to full exposure over the configured half-life. Right: the live
 * signal weights against what the library actually scores.
 */
export function ModelMechanics({ snapshot }: ModelMechanicsProps) {
    const t = snapshot?.tuning;
    const target = t?.explore_impression_target ?? 50;
    const halfLife = t?.demotion_half_life_days ?? 14;
    const factor = t?.demotion_default_factor ?? 0.5;

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-editorial text-sm font-semibold">The laws of the engine</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                Two curves that redraw themselves as you tune, and how a value is currently composed.
            </p>

            <div className="mt-4 grid gap-5 lg:grid-cols-3">
                <ConfidenceCurve target={target} />
                <DecayCurve halfLife={halfLife} factor={factor} />
                <SignalComposition snapshot={snapshot} />
            </div>
        </section>
    );
}

const CW = 260;
const CH = 130;
const CPAD = 28;

function curvePath(points: [number, number][]): string {
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function ConfidenceCurve({ target }: { target: number }) {
    const maxI = Math.max(150, target * 2.5);
    const pts = useMemo(() => {
        const out: [number, number][] = [];
        for (let i = 0; i <= 60; i++) {
            const impr = (i / 60) * maxI;
            const conf = impr / (impr + CONF_HALF);
            const x = CPAD + (impr / maxI) * (CW - CPAD - 8);
            const y = CH - CPAD - conf * (CH - CPAD - 8);
            out.push([x, y]);
        }
        return out;
    }, [maxI]);
    const targetX = CPAD + (target / maxI) * (CW - CPAD - 8);

    return (
        <MiniChart label="Confidence" sub={`grows with impressions · graduates at ${target}`}>
            <line x1={CPAD} y1={CH - CPAD} x2={CW - 8} y2={CH - CPAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <line x1={CPAD} y1={CPAD - 8} x2={CPAD} y2={CH - CPAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <path d={curvePath(pts)} fill="none" stroke={AUDITION} strokeWidth={2.5} />
            <line x1={targetX} y1={CPAD - 8} x2={targetX} y2={CH - CPAD} stroke={SETTLED} strokeWidth={1} strokeDasharray="3 3" />
            <text x={targetX} y={CPAD - 12} textAnchor="middle" fill={SETTLED} style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                {target}
            </text>
            <text x={CPAD - 6} y={CPAD - 2} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>1.0</text>
            <text x={CW - 8} y={CH - CPAD + 14} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>impressions</text>
        </MiniChart>
    );
}

function DecayCurve({ halfLife, factor }: { halfLife: number; factor: number }) {
    const maxDays = halfLife * 3;
    const pts = useMemo(() => {
        const out: [number, number][] = [];
        for (let i = 0; i <= 60; i++) {
            const day = (i / 60) * maxDays;
            const eff = 1 - (1 - factor) * Math.pow(2, -day / halfLife); // recovers toward 1
            const x = CPAD + (day / maxDays) * (CW - CPAD - 8);
            const y = CH - CPAD - eff * (CH - CPAD - 8);
            out.push([x, y]);
        }
        return out;
    }, [maxDays, halfLife, factor]);
    const halfX = CPAD + (halfLife / maxDays) * (CW - CPAD - 8);

    return (
        <MiniChart label="Demotion decay" sub={`recovers to full exposure · half-life ${halfLife}d`}>
            <line x1={CPAD} y1={CH - CPAD} x2={CW - 8} y2={CH - CPAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <line x1={CPAD} y1={CPAD - 8} x2={CPAD} y2={CH - CPAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <path d={curvePath(pts)} fill="none" stroke="#fb7185" strokeWidth={2.5} />
            <line x1={halfX} y1={CPAD - 8} x2={halfX} y2={CH - CPAD} stroke={SETTLED} strokeWidth={1} strokeDasharray="3 3" />
            <text x={halfX} y={CPAD - 12} textAnchor="middle" fill={SETTLED} style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                {halfLife}d
            </text>
            <text x={CPAD - 6} y={CPAD - 2} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>×1.0</text>
            <text x={CPAD - 6} y={CH - CPAD} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>×{factor.toFixed(2)}</text>
        </MiniChart>
    );
}

function SignalComposition({ snapshot }: ModelMechanicsProps) {
    const t = snapshot?.tuning;
    const sa = snapshot?.signal_averages;
    const rows = [
        { key: 'engagement', label: 'Engagement', weight: t?.engagement_weight ?? 0, actual: sa?.engagement ?? 0 },
        { key: 'completion', label: 'Completion', weight: t?.completion_weight ?? 0, actual: sa?.completion ?? 0 },
        { key: 'quality', label: 'Quality', weight: t?.quality_weight ?? 0, actual: sa?.quality ?? 0 },
        { key: 'velocity', label: 'Velocity', weight: t?.velocity_weight ?? 0, actual: sa?.velocity ?? 0 },
    ];
    return (
        <div>
            <p className="text-xs font-semibold">Value composition</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">weight vs. corpus average</p>
            <div className="mt-3 space-y-2.5">
                {rows.map((r) => (
                    <div key={r.key}>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="font-mono tabular-nums text-muted-foreground">
                                <span className="text-foreground">{Math.round(r.weight * 100)}%</span> · avg {r.actual.toFixed(2)}
                            </span>
                        </div>
                        <div className="mt-1 flex h-2 items-center gap-0.5">
                            <div className="h-full overflow-hidden rounded-l-full bg-muted" style={{ width: '100%' }}>
                                <div className="h-full rounded-l-full" style={{ width: `${Math.round(r.weight * 100)}%`, background: SETTLED }} />
                            </div>
                        </div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(1, r.actual * 100))}%`, background: AUDITION }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MiniChart({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-semibold">{label}</p>
            <p className={cn('mt-0.5 font-mono text-[10px] text-muted-foreground')}>{sub}</p>
            <svg viewBox={`0 0 ${CW} ${CH}`} className="mt-2 w-full" role="img" aria-label={label}>
                {children}
            </svg>
        </div>
    );
}
