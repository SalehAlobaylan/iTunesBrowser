'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StudioRunHistoryEntry } from '@/types/platform/media-studio-autopilot';

interface Props {
    runs: StudioRunHistoryEntry[];
}

const OUTCOME = {
    rejected: { key: 'rejected', color: '#34d399', label: 'Rejected' },
    published: { key: 'published', color: '#22c55e', label: 'Published' },
    stt: { key: 'stt', color: '#38bdf8', label: 'STT re-run' },
    held_approval: { key: 'held_approval', color: '#e0a92e', label: 'Held pods' },
    skipped: { key: 'skipped', color: '#64748b', label: 'Skipped' },
    errored: { key: 'errored', color: '#fb7185', label: 'Errors' },
} as const;

const TRIGGER_MARK: Record<string, string> = {
    chained: '⛓',
    interval: '↻',
    manual: '▶',
};

/**
 * Run activity over time: each bar is one run, segmented by what it did. Shows
 * whether the autopilot is actually clearing work — and how (chained after the
 * lead, interval sweep, or manual).
 */
export function StudioRunTimeline({ runs }: Props) {
    if (runs.length === 0) {
        return (
            <section className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold"><span className="font-editorial">Run activity</span></h2>
                <div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
                    No runs yet — enable the autopilot or click Run now.
                </div>
            </section>
        );
    }

    // Oldest → newest, left → right.
    const data = [...runs].reverse().map((r, i) => ({
        idx: i,
        when: new Date(r.started_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        trigger: r.trigger,
        mode: r.mode,
        mark: TRIGGER_MARK[r.trigger] ?? '•',
        ...r.buckets,
    }));

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold"><span className="font-editorial">Run activity</span></h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    {Object.values(OUTCOME).map((o) => (
                        <span key={o.key} className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: o.color }} />
                            {o.label}
                        </span>
                    ))}
                </div>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
                Each bar is one run. {TRIGGER_MARK.chained} chained · {TRIGGER_MARK.interval} interval · {TRIGGER_MARK.manual} manual.
            </p>

            <ResponsiveContainer width="100%" height={170} className="mt-2">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="mark" tick={{ fontSize: 13 }} axisLine={false} tickLine={false}
                        interval={0} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                        stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(_l, p) => {
                            const row = p?.[0]?.payload as { when?: string; trigger?: string; mode?: string } | undefined;
                            return row ? `${row.when} · ${row.trigger} · ${row.mode}` : '';
                        }}
                    />
                    {Object.values(OUTCOME).map((o) => (
                        <Bar key={o.key} dataKey={o.key} stackId="a" fill={o.color} name={o.label} radius={o.key === 'errored' ? [3, 3, 0, 0] : undefined}>
                            {data.map((_, i) => <Cell key={i} />)}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </section>
    );
}
