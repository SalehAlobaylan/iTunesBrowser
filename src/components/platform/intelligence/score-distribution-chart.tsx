'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ScoreDistribution } from '@/types/platform/intelligence';

interface ScoreDistributionChartProps {
    data: ScoreDistribution[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
