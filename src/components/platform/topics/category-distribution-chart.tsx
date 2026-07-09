'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PALETTE = [
    'hsl(41, 71%, 51%)', // gold
    'hsl(217, 91%, 60%)',
    'hsl(142, 71%, 45%)',
    'hsl(355, 78%, 56%)', // news
    'hsl(38, 92%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(190, 80%, 45%)',
];

export function CategoryDistributionChart({ data }: { data: { name: string; count: number }[] }) {
    if (data.length === 0) {
        return (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No categorized topics yet.
            </div>
        );
    }
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                    contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
