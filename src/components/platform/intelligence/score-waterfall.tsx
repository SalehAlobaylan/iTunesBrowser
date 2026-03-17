'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { PreviewFeedItem } from '@/types/platform/intelligence';

interface ScoreWaterfallProps {
    items: PreviewFeedItem[];
}

const SIGNAL_COLORS: Record<string, string> = {
    freshness: 'hsl(25, 95%, 53%)',
    engagement: 'hsl(346, 77%, 50%)',
    velocity: 'hsl(221, 83%, 53%)',
    similarity: 'hsl(262, 83%, 58%)',
    quality: 'hsl(142, 76%, 36%)',
    diversity: 'hsl(48, 96%, 53%)',
    trending: 'hsl(0, 84%, 60%)',
};

export function ScoreWaterfall({ items }: ScoreWaterfallProps) {
    const chartData = items.slice(0, 15).map((item) => ({
        name: item.title.length > 20 ? item.title.slice(0, 20) + '...' : item.title,
        freshness: Math.round(item.score_breakdown.freshness * 100) / 100,
        engagement: Math.round(item.score_breakdown.engagement * 100) / 100,
        velocity: Math.round(item.score_breakdown.velocity * 100) / 100,
        similarity: Math.round(item.score_breakdown.similarity * 100) / 100,
        quality: Math.round(item.score_breakdown.quality * 100) / 100,
        diversity: Math.round(item.score_breakdown.diversity * 100) / 100,
        trending: Math.round(item.score_breakdown.trending * 100) / 100,
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {Object.entries(SIGNAL_COLORS).map(([signal, color]) => (
                    <Bar key={signal} dataKey={signal} stackId="score" fill={color} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
