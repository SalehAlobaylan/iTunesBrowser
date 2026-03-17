'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { VelocityItem } from '@/types/platform/intelligence';

interface VelocityLeaderboardProps {
    data: VelocityItem[];
}

export function VelocityLeaderboard({ data }: VelocityLeaderboardProps) {
    const chartData = data.slice(0, 10).map((item) => ({
        name: item.title.length > 30 ? item.title.slice(0, 30) + '...' : item.title,
        velocity: Math.round(item.velocity * 100) / 100,
        type: item.type,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={180} />
                <Tooltip />
                <Bar dataKey="velocity" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
