'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { SourcePerformance } from '@/types/platform/intelligence';

interface SourcePerformanceChartProps {
    data: SourcePerformance[];
}

export function SourcePerformanceChart({ data }: SourcePerformanceChartProps) {
    const chartData = data.map((s) => ({
        name: s.source_name || s.source_type,
        likes: Math.round(s.avg_likes * 10) / 10,
        views: Math.round(s.avg_views * 10) / 10,
        shares: Math.round(s.avg_shares * 10) / 10,
        count: s.count,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" fill="hsl(346, 77%, 50%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="views" fill="hsl(221, 83%, 53%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="shares" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
