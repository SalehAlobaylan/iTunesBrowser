'use client';

import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts';

interface WeightRadarChartProps {
    weights: Record<string, number>;
}

const SIGNAL_LABELS: Record<string, string> = {
    freshness_weight: 'Freshness',
    engagement_weight: 'Engagement',
    velocity_weight: 'Velocity',
    similarity_weight: 'Similarity',
    quality_weight: 'Quality',
    diversity_weight: 'Diversity',
    trending_weight: 'Trending',
};

export function WeightRadarChart({ weights }: WeightRadarChartProps) {
    const data = Object.entries(SIGNAL_LABELS).map(([key, label]) => ({
        signal: label,
        weight: Math.round((weights[key] || 0) * 100),
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="signal" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 50]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Radar
                    name="Weight"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
