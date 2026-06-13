'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { ContentDailyPoint } from '@/types/platform/content';

interface SparklineProps {
    daily: ContentDailyPoint[];
    /** CSS color (e.g. 'hsl(var(--news))'). Defaults to the gold brand accent. */
    color?: string;
    width?: number;
    height?: number;
}

// Minimal axis-less trend line for inline use in card headers.
export function Sparkline({
    daily,
    color = 'hsl(var(--gold))',
    width = 96,
    height = 28,
}: SparklineProps) {
    if (daily.length < 2) {
        return <div style={{ width, height }} aria-hidden />;
    }
    const data = daily.map((d) => ({ value: d.count }));
    const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;
    return (
        <div style={{ width, height }} aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={1.5}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
