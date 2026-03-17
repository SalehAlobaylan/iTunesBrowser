'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

interface FlagDistributionChartProps {
    boosted: number;
    suppressed: number;
    pinned: number;
    excluded: number;
    total: number;
}

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(346, 77%, 50%)', 'hsl(221, 83%, 53%)', 'hsl(25, 95%, 53%)'];

export function FlagDistributionChart({ boosted, suppressed, pinned, excluded, total }: FlagDistributionChartProps) {
    const unflagged = total - boosted - suppressed - pinned - excluded;
    const data = [
        { name: 'Boosted', value: boosted },
        { name: 'Suppressed', value: suppressed },
        { name: 'Pinned', value: pinned },
        { name: 'Excluded', value: excluded },
        { name: 'Unflagged', value: Math.max(0, unflagged) },
    ].filter((d) => d.value > 0);

    const allColors = [...COLORS, 'hsl(var(--muted))'];

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No flags set yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={allColors[i % allColors.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
