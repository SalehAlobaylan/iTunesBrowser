'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { TrendingItem } from '@/types/platform/intelligence';

interface TrendingTimelineProps {
    data: TrendingItem[];
}

export function TrendingTimeline({ data }: TrendingTimelineProps) {
    const chartData = data.slice(0, 10).map((item) => ({
        name: item.title.length > 25 ? item.title.slice(0, 25) + '...' : item.title,
        recent_rate: Math.round(item.recent_rate * 100) / 100,
        avg_rate: Math.round(item.avg_rate * 100) / 100,
        trending_score: Math.round(item.trending_score * 100) / 100,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="recent_rate" name="Recent Rate" fill="hsl(346, 77%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_rate" name="Avg Rate" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
