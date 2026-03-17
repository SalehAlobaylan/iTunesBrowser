'use client';

import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { SignalHealth } from '@/types/platform/intelligence';

interface SignalHealthRadarProps {
    data: SignalHealth[];
}

export function SignalHealthRadar({ data }: SignalHealthRadarProps) {
    const chartData = data.map((s) => ({
        signal: s.signal,
        coverage: Math.round(s.percentage),
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="signal" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Radar
                    name="Coverage"
                    dataKey="coverage"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.3}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
