'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
    byCode: Record<string, number>;
    total: number;
    aged: number;
}

// Per-code color. merged_short = gold (the only auto-publish candidate);
// structural = slate; editorial = warm; duration = muted.
const CODE_COLOR: Record<string, string> = {
    merged_short: '#e0a92e',
    short_unmergeable: '#94a3b8',
    sponsor_intro: '#fb7185',
    planner_fallback: '#c084fc',
    low_confidence: '#38bdf8',
    below_min: '#64748b',
    above_hard_max: '#64748b',
    unclassified: '#475569',
};

const CODE_LABEL: Record<string, string> = {
    merged_short: 'Merged-short',
    short_unmergeable: 'Short (unmergeable)',
    sponsor_intro: 'Sponsor intro',
    planner_fallback: 'Planner fallback',
    low_confidence: 'Low confidence',
    below_min: 'Below minimum',
    above_hard_max: 'Above hard max',
    unclassified: 'Unclassified',
};

export function StudioQueueComposition({ byCode, total, aged }: Props) {
    const data = Object.entries(byCode)
        .filter(([, v]) => v > 0)
        .map(([code, value]) => ({ code, value, label: CODE_LABEL[code] ?? code }))
        .sort((a, b) => b.value - a.value);

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">
                <span className="font-editorial">Review queue</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
                What&apos;s waiting, by why it was flagged.
            </p>

            {total === 0 ? (
                <div className="flex h-[190px] items-center justify-center text-sm text-muted-foreground">
                    Queue is clear — nothing waiting.
                </div>
            ) : (
                <div className="mt-2 flex items-center gap-4">
                    <div className="relative h-[190px] w-[190px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%"
                                    innerRadius={58} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                                    {data.map((d) => (
                                        <Cell key={d.code} fill={CODE_COLOR[d.code] ?? '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                    formatter={(v: number, _n, p) => [`${v}`, (p?.payload as { label?: string })?.label ?? '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-mono text-2xl font-bold">{total}</span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">cases</span>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                        {data.map((d) => (
                            <div key={d.code} className="flex items-center gap-2 text-xs">
                                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CODE_COLOR[d.code] ?? '#64748b' }} />
                                <span className="truncate">{d.label}</span>
                                <span className="ml-auto font-mono text-muted-foreground">{d.value}</span>
                            </div>
                        ))}
                        {aged > 0 && (
                            <div className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                                {aged} case{aged === 1 ? '' : 's'} aged (waiting too long)
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
