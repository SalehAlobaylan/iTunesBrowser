'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface WeightSlidersProps {
    weights: Record<string, number>;
    onChange: (weights: Record<string, number>) => void;
    disabled?: boolean;
}

const WEIGHT_LABELS: Record<string, { label: string; description: string }> = {
    freshness_weight: { label: 'Freshness', description: 'Time decay from published date' },
    engagement_weight: { label: 'Engagement', description: 'Likes, views, shares, comments' },
    velocity_weight: { label: 'Velocity', description: 'Recent interaction rate' },
    similarity_weight: { label: 'Similarity', description: 'pgvector cosine similarity' },
    quality_weight: { label: 'Quality', description: 'Content completeness + source tier' },
    diversity_weight: { label: 'Diversity', description: 'Anti-repetition penalty' },
    trending_weight: { label: 'Trending', description: 'Interaction spike detection' },
};

const WEIGHT_KEYS = Object.keys(WEIGHT_LABELS);

export function WeightSliders({ weights, onChange, disabled }: WeightSlidersProps) {
    const totalWeight = WEIGHT_KEYS.reduce((sum, k) => sum + (weights[k] || 0), 0);

    const handleChange = (key: string, rawValue: number) => {
        const newWeights = { ...weights, [key]: rawValue };
        const newTotal = WEIGHT_KEYS.reduce((sum, k) => sum + (newWeights[k] || 0), 0);

        // Auto-normalize: scale all weights so they sum to 1.0
        if (newTotal > 0) {
            const normalized: Record<string, number> = {};
            for (const k of WEIGHT_KEYS) {
                normalized[k] = Math.round(((newWeights[k] || 0) / newTotal) * 1000) / 1000;
            }
            // Fix rounding: assign remainder to the changed key
            const normTotal = WEIGHT_KEYS.reduce((s, k) => s + normalized[k], 0);
            const diff = Math.round((1.0 - normTotal) * 1000) / 1000;
            normalized[key] = Math.round((normalized[key] + diff) * 1000) / 1000;
            onChange(normalized);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total weight</span>
                <span className={Math.abs(totalWeight - 1.0) < 0.01 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                    {totalWeight.toFixed(3)}
                </span>
            </div>
            {WEIGHT_KEYS.map((key) => {
                const { label, description } = WEIGHT_LABELS[key];
                const value = weights[key] || 0;
                return (
                    <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{label}</Label>
                            <span className="text-sm text-muted-foreground tabular-nums">{value.toFixed(3)}</span>
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
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                );
            })}
        </div>
    );
}

export { WEIGHT_KEYS, WEIGHT_LABELS };
