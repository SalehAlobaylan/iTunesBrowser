'use client';

import { Label } from '@/components/ui/label';

/** The four durable-value signal weights (auto-normalized to sum 1.0). */
export const VALUE_WEIGHT_KEYS = [
    'engagement_weight',
    'completion_weight',
    'quality_weight',
    'velocity_weight',
] as const;

export type ValueWeightKey = (typeof VALUE_WEIGHT_KEYS)[number];

const VALUE_WEIGHT_LABELS: Record<ValueWeightKey, { label: string; description: string }> = {
    engagement_weight: { label: 'Engagement', description: 'Likes/shares/comments per impression (exposure-normalized)' },
    completion_weight: { label: 'Completion', description: 'Did listeners finish it — the audio-first signal' },
    quality_weight: { label: 'Quality', description: 'Metadata completeness + source tier' },
    velocity_weight: { label: 'Velocity', description: 'Recent interaction rate — valuable now vs once' },
};

interface ValueWeightSlidersProps {
    weights: Record<ValueWeightKey, number>;
    onChange: (weights: Record<ValueWeightKey, number>) => void;
    disabled?: boolean;
}

/**
 * Four-signal weight sliders for the durable media-value model. Auto-normalizes
 * to sum 1.0 on every change (the server re-normalizes too, so the displayed
 * split always matches what the engine will use).
 */
export function ValueWeightSliders({ weights, onChange, disabled }: ValueWeightSlidersProps) {
    const total = VALUE_WEIGHT_KEYS.reduce((s, k) => s + (weights[k] || 0), 0);

    const handleChange = (key: ValueWeightKey, raw: number) => {
        const next = { ...weights, [key]: raw };
        const newTotal = VALUE_WEIGHT_KEYS.reduce((s, k) => s + (next[k] || 0), 0);
        if (newTotal <= 0) return;
        const normalized = {} as Record<ValueWeightKey, number>;
        for (const k of VALUE_WEIGHT_KEYS) {
            normalized[k] = Math.round(((next[k] || 0) / newTotal) * 1000) / 1000;
        }
        const normTotal = VALUE_WEIGHT_KEYS.reduce((s, k) => s + normalized[k], 0);
        normalized[key] = Math.round((normalized[key] + (1.0 - normTotal)) * 1000) / 1000;
        onChange(normalized);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total weight</span>
                <span className={Math.abs(total - 1.0) < 0.01 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-destructive'}>
                    {total.toFixed(3)}
                </span>
            </div>
            {VALUE_WEIGHT_KEYS.map((key) => {
                const { label, description } = VALUE_WEIGHT_LABELS[key];
                const value = weights[key] || 0;
                return (
                    <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{label}</Label>
                            <span className="text-sm tabular-nums text-muted-foreground">{Math.round(value * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round(value * 100)}
                            onChange={(e) => handleChange(key, parseInt(e.target.value) / 100)}
                            disabled={disabled}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-news"
                        />
                    </div>
                );
            })}
        </div>
    );
}
