'use client';

import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ContentCluster } from '@/types/platform/intelligence';

interface TopicBubbleChartProps {
    data: ContentCluster[];
}

export function TopicBubbleChart({ data }: TopicBubbleChartProps) {
    const chartData = data.map((cluster) => ({
        topic: cluster.topic,
        x: Math.round(cluster.avg_likes * 10) / 10,
        y: Math.round(cluster.avg_views * 10) / 10,
        z: cluster.count,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" dataKey="x" name="Avg Likes" tick={{ fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Avg Views" tick={{ fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" name="Count" range={[40, 400]} />
                <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const d = payload[0].payload;
                        return (
                            <div className="rounded-md border bg-background p-3 shadow-sm text-sm">
                                <p className="font-medium">{d.topic}</p>
                                <p>Avg Likes: {d.x}</p>
                                <p>Avg Views: {d.y}</p>
                                <p>Items: {d.z}</p>
                            </div>
                        );
                    }}
                />
                <Scatter data={chartData} fill="hsl(var(--primary))" fillOpacity={0.6} />
            </ScatterChart>
        </ResponsiveContainer>
    );
}
