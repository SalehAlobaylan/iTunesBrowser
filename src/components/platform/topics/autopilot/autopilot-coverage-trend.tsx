'use client';

import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PrefCoveragePoint } from '@/types/platform/preference-autopilot';

// Coverage trend — the flip-gate story over time. Three mapping-coverage lines
// against their policy floors (dashed reference lines), built from persisted run
// snapshots. This is the chart that tells an admin WHEN the catalog earned a
// foryou_enabled / news_enabled flip.

const SERIES = [
    { key: 'foryou_pct', label: 'For You', color: 'hsl(var(--primary))', dash: undefined },
    { key: 'news_pct', label: 'News', color: 'hsl(var(--foreground))', dash: '7 4' },
    { key: 'story_pct', label: 'Stories', color: 'hsl(var(--muted-foreground))', dash: '2 4' },
] as const;

function shortTime(iso: string): string {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AutopilotCoverageTrend({
    series,
    floors,
}: {
    series: PrefCoveragePoint[];
    floors: { foryou: number; news: number; story: number };
}) {
    if (series.length < 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Coverage trend</CardTitle>
                    <CardDescription>Needs at least two completed runs to draw a trend.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    const data = series.map((p) => ({ ...p, when: shortTime(p.started_at) }));

    return (
        <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-base">Coverage trend</CardTitle>
                    <CardDescription>Mapping coverage per run vs. flip-gate floors (dashed).</CardDescription>
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                    {SERIES.map((s) => (
                        <span key={s.key} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
                        <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
                        <XAxis dataKey="when" tick={{ fontSize: 10.5 }} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10.5 }} tickLine={false} unit="%" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value: number, name: string) => [
                                `${Number(value).toFixed(0)}%`,
                                SERIES.find((s) => s.key === name)?.label ?? name,
                            ]}
                        />
                        <ReferenceLine y={floors.foryou} stroke={SERIES[0].color} strokeDasharray="6 4" strokeOpacity={0.5} />
                        <ReferenceLine y={floors.news} stroke={SERIES[1].color} strokeDasharray="6 4" strokeOpacity={0.5} />
                        <ReferenceLine y={floors.story} stroke={SERIES[2].color} strokeDasharray="6 4" strokeOpacity={0.5} />
                        {SERIES.map((s) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                stroke={s.color}
                                strokeWidth={2}
                                strokeDasharray={s.dash}
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
                    <span>
                        backlog <strong className="tabular-nums text-foreground">{data[data.length - 1].unmapped_backlog.toLocaleString()}</strong>
                    </span>
                    <span>
                        pending <strong className="tabular-nums text-foreground">{data[data.length - 1].pending}</strong>
                    </span>
                    <span>
                        queue <strong className="tabular-nums text-foreground">{data[data.length - 1].queue_depth}</strong>
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
