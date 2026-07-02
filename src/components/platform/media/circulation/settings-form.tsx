'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Gauge, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { MediaCirculationPolicy } from '@/types/platform/media-circulation';

interface SettingsFormProps {
    policy?: MediaCirculationPolicy;
    saving: boolean;
    onSave: (data: Partial<MediaCirculationPolicy>) => void;
}

const PRESETS = [
    {
        value: 'conservative',
        label: 'Conservative',
        description: 'Protects current library quality; slow intake.',
        icon: ShieldCheck,
    },
    {
        value: 'balanced',
        label: 'Balanced',
        description: 'Keeps pull and cost hygiene in tension.',
        icon: Gauge,
    },
    {
        value: 'intake_hungry',
        label: 'Intake hungry',
        description: 'Pulls harder when duration buckets are thin.',
        icon: Radio,
    },
] as const;

const PRESS_TEXT = 'text-[#c1121f] dark:text-[#ff6b6b]';
const PRESS_SELECTED = 'border-[#e63946] bg-[#e63946]/10';
const PRESS_BUTTON = 'border-[#e63946] bg-[#e63946] text-white hover:bg-[#c1121f] hover:text-white';

const NUMERIC_FIELDS: { key: keyof MediaCirculationPolicy; label: string; step: string; suffix?: string }[] = [
    { key: 'value_floor', label: 'Value floor', step: '0.01' },
    { key: 'marginal_margin', label: 'Marginal margin', step: '0.01' },
    { key: 'freshness_demand_weight', label: 'Freshness weight', step: '0.01' },
    { key: 'max_intake_per_cycle', label: 'Cycle intake cap', step: '1' },
    { key: 'max_intake_per_source_per_cycle', label: 'Per-source cap', step: '1' },
    { key: 'source_min_interval_minutes', label: 'Minimum source interval', step: '1', suffix: 'min' },
    { key: 'source_max_interval_minutes', label: 'Maximum source interval', step: '1', suffix: 'min' },
];

export function SettingsForm({ policy, saving, onSave }: SettingsFormProps) {
    const [form, setForm] = useState<MediaCirculationPolicy | undefined>(policy);

    useEffect(() => {
        setForm(policy);
    }, [policy]);

    if (!form) {
        return <p className="py-8 text-center text-sm text-muted-foreground">Loading policy...</p>;
    }

    const setNum = (key: keyof MediaCirculationPolicy, value: string) =>
        setForm({ ...form, [key]: Number(value) });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <Label htmlFor="mc-enabled" className="text-sm font-semibold">
                        Engine enabled
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Generate and apply circulation recommendations for this tenant.
                    </p>
                </div>
                <Switch
                    id="mc-enabled"
                    checked={form.enabled}
                    onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                />
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-semibold">Operating preset</Label>
                <div className="grid gap-2">
                    {PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const selected = form.preset === preset.value;
                        return (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setForm({ ...form, preset: preset.value })}
                                className={cn(
                                    'flex items-start gap-3 rounded-md border p-3 text-left transition-colors',
                                    selected
                                        ? cn(PRESS_SELECTED, 'text-foreground')
                                        : 'border-border bg-background hover:bg-muted'
                                )}
                            >
                                <Icon className={cn('mt-0.5 h-4 w-4', selected && PRESS_TEXT)} />
                                <span>
                                    <span className="block text-sm font-semibold">{preset.label}</span>
                                    <span className="block text-xs leading-5 text-muted-foreground">
                                        {preset.description}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <Label className="text-sm font-semibold">Advanced limits</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Tune only when the recommendation flow is consistently too timid or too eager.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {NUMERIC_FIELDS.map(({ key, label, step, suffix }) => (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={`mc-${key}`} className="text-xs">
                                {label}
                            </Label>
                            <div className="relative">
                                <Input
                                    id={`mc-${key}`}
                                    type="number"
                                    step={step}
                                    value={String(form[key] ?? '')}
                                    onChange={(e) => setNum(key, e.target.value)}
                                    className={suffix ? 'pr-12' : undefined}
                                />
                                {suffix && (
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {suffix}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button onClick={() => onSave(form)} disabled={saving} className={cn('w-full', PRESS_BUTTON)}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save policy
            </Button>
        </div>
    );
}
