'use client';

import { useEffect, useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ValueWeightSliders, VALUE_WEIGHT_KEYS, type ValueWeightKey } from './value-weight-sliders';
import type { MediaValueConfig, UpdateMediaValueConfigRequest } from '@/types/platform/intelligence';

interface ValueTuningSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config?: MediaValueConfig;
    defaults?: MediaValueConfig;
    saving: boolean;
    onSave: (data: UpdateMediaValueConfigRequest) => void;
}

// Numeric knobs (everything that isn't a normalized weight), with the same
// clamp ranges the server enforces so the UI guides toward valid values.
const KNOBS: Array<{
    key: keyof MediaValueConfig;
    label: string;
    hint: string;
    min: number;
    max: number;
    step: number;
    suffix?: string;
    format?: (v: number) => string;
}> = [
    { key: 'exploration_slice_every', label: 'Exploration slice', hint: 'Reserve 1 in every N For You slots for a still-exploring item', min: 4, max: 50, step: 1, format: (v) => `1 in ${v}` },
    { key: 'explore_impression_target', label: 'Impression target', hint: 'Impressions before an item graduates from exploring to established', min: 10, max: 1000, step: 5, suffix: 'impr.' },
    { key: 'legacy_exposure_view_floor', label: 'Legacy view floor', hint: 'Pre-telemetry view count that already counts as "had a chance"', min: 0, max: 10000, step: 5, suffix: 'views' },
    { key: 'demotion_default_factor', label: 'Demotion strength', hint: 'Score multiplier applied on rank-down (lower = harsher)', min: 0.05, max: 0.95, step: 0.05, format: (v) => `×${v.toFixed(2)}` },
    { key: 'demotion_half_life_days', label: 'Demotion half-life', hint: 'Days for a rank-down to decay halfway back to full exposure', min: 1, max: 90, step: 1, suffix: 'days' },
];

type FormState = Pick<
    MediaValueConfig,
    ValueWeightKey | 'exploration_slice_every' | 'explore_impression_target' | 'legacy_exposure_view_floor' | 'demotion_default_factor' | 'demotion_half_life_days'
>;

function toForm(c: MediaValueConfig): FormState {
    return {
        engagement_weight: c.engagement_weight,
        completion_weight: c.completion_weight,
        quality_weight: c.quality_weight,
        velocity_weight: c.velocity_weight,
        exploration_slice_every: c.exploration_slice_every,
        explore_impression_target: c.explore_impression_target,
        legacy_exposure_view_floor: c.legacy_exposure_view_floor,
        demotion_default_factor: c.demotion_default_factor,
        demotion_half_life_days: c.demotion_half_life_days,
    };
}

/**
 * The media-value engine control panel. Four auto-normalizing signal-weight
 * sliders + the exploration and demotion knobs, with per-field default hints
 * and a reset-to-defaults action. Saves as a PUT to the config endpoint.
 */
export function ValueTuningSheet({ open, onOpenChange, config, defaults, saving, onSave }: ValueTuningSheetProps) {
    const [form, setForm] = useState<FormState | undefined>(config ? toForm(config) : undefined);

    useEffect(() => {
        if (config) setForm(toForm(config));
    }, [config]);

    const weights = form
        ? (Object.fromEntries(VALUE_WEIGHT_KEYS.map((k) => [k, form[k]])) as Record<ValueWeightKey, number>)
        : undefined;

    const setWeights = (w: Record<ValueWeightKey, number>) =>
        setForm((prev) => (prev ? { ...prev, ...w } : prev));

    const setKnob = (key: keyof FormState, value: number) =>
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

    const resetDefaults = () => {
        if (defaults) setForm(toForm(defaults));
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-lg">
                <SheetHeader className="mb-5 text-left">
                    <SheetTitle>Tune the value engine</SheetTitle>
                </SheetHeader>

                {!form ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Loading configuration…</p>
                ) : (
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <div>
                                <Label className="text-sm font-semibold">Signal weights</Label>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    How the four durable-value signals combine. Auto-normalized to 100%.
                                </p>
                            </div>
                            {weights && <ValueWeightSliders weights={weights} onChange={setWeights} disabled={saving} />}
                        </section>

                        <section className="space-y-3">
                            <div>
                                <Label className="text-sm font-semibold">Exploration &amp; demotion</Label>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    How new items earn exposure and how rank-downs decay.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {KNOBS.map((knob) => {
                                    const value = Number(form[knob.key as keyof FormState] ?? 0);
                                    const defaultValue = defaults ? Number(defaults[knob.key] ?? 0) : undefined;
                                    return (
                                        <div key={String(knob.key)} className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label className="text-xs">{knob.label}</Label>
                                                <span className="text-xs font-medium tabular-nums text-foreground">
                                                    {knob.format ? knob.format(value) : `${value}${knob.suffix ? ' ' + knob.suffix : ''}`}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-4 text-muted-foreground">{knob.hint}</p>
                                            <input
                                                type="range"
                                                min={knob.min}
                                                max={knob.max}
                                                step={knob.step}
                                                value={value}
                                                onChange={(e) => setKnob(knob.key as keyof FormState, Number(e.target.value))}
                                                disabled={saving}
                                                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-news"
                                            />
                                            {defaultValue !== undefined && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    default {knob.format ? knob.format(defaultValue) : `${defaultValue}${knob.suffix ? ' ' + knob.suffix : ''}`}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="flex items-center gap-2 border-t border-border pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetDefaults}
                                disabled={saving || !defaults}
                                className="shrink-0"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                            <Button
                                type="button"
                                onClick={() => onSave(form)}
                                disabled={saving}
                                className="w-full bg-news text-news-foreground hover:bg-news/90"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save configuration
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Changes take effect within a request — no restart. Weights and knobs are clamped
                            server-side to safe ranges.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
