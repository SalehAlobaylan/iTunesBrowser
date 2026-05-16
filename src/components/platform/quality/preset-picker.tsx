'use client';

import { Check } from 'lucide-react';
import {
    CUSTOM_PRESET_KEY,
    CUSTOM_PRESET_META,
    INGEST_PRESETS,
    type IngestPreset,
} from '@/lib/constants/ingest-presets';

/**
 * Preset Picker — the first step of the new-profile wizard.
 *
 * Renders the 5 curated ingest presets plus a "Custom" tile in a responsive
 * card grid. Selecting a card calls `onSelect` with the preset (or the
 * string 'custom' for the bespoke path); the parent advances to the
 * identity / advanced steps and pre-fills form state from the preset.
 *
 * Visual conventions:
 *   - Recommended preset gets a small "RECOMMENDED" pill.
 *   - Selected card gets a 2px accent border + a check icon top-right.
 *   - Custom card uses a dashed border so it reads as a distinct option.
 */
export interface PresetPickerProps {
    selectedKey: string | null;
    onSelect: (preset: IngestPreset | 'custom') => void;
}

export function PresetPicker({ selectedKey, onSelect }: PresetPickerProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INGEST_PRESETS.map((p) => (
                <PresetCard
                    key={p.key}
                    preset={p}
                    selected={selectedKey === p.key}
                    onClick={() => onSelect(p)}
                />
            ))}
            <CustomCard
                selected={selectedKey === CUSTOM_PRESET_KEY}
                onClick={() => onSelect('custom')}
            />
        </div>
    );
}

interface PresetCardProps {
    preset: IngestPreset;
    selected: boolean;
    onClick: () => void;
}

function PresetCard({ preset, selected, onClick }: PresetCardProps) {
    const Icon = preset.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'group relative flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition',
                'hover:border-foreground/30 hover:bg-muted/30',
                selected
                    ? 'border-2 border-cyan-500 bg-cyan-500/5'
                    : 'border-border bg-background',
            ].join(' ')}
        >
            {/* Header: icon + name + recommended pill + check icon */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${preset.accentColor}`} />
                    <span className="font-semibold">{preset.displayName}</span>
                </div>
                {selected ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-background">
                        <Check className="h-3.5 w-3.5" />
                    </div>
                ) : preset.recommended ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        Recommended
                    </span>
                ) : null}
            </div>

            {/* Tagline */}
            <p className="text-sm text-muted-foreground">{preset.tagline}</p>

            {/* Key specs — single-line technical summary */}
            <p className="font-mono text-xs text-foreground/80">{preset.keySpecs}</p>

            {/* Estimate chips */}
            <div className="flex flex-wrap gap-1.5">
                <Chip variant="emerald">{preset.estimatedReduction}</Chip>
                <Chip variant="muted">{preset.estimatedQuality}</Chip>
            </div>

            {/* Best-for tags */}
            <div className="mt-auto flex flex-wrap gap-1">
                {preset.bestFor.map((tag) => (
                    <span
                        key={tag}
                        className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </button>
    );
}

function CustomCard({ selected, onClick }: { selected: boolean; onClick: () => void }) {
    const Icon = CUSTOM_PRESET_META.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'group relative flex h-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition',
                'hover:border-foreground/40 hover:bg-muted/30',
                selected
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-border bg-background',
            ].join(' ')}
        >
            {selected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-background">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            <Icon className={`h-6 w-6 ${CUSTOM_PRESET_META.accentColor}`} />
            <span className="font-semibold">{CUSTOM_PRESET_META.displayName}</span>
            <p className="text-xs text-muted-foreground">{CUSTOM_PRESET_META.tagline}</p>
        </button>
    );
}

function Chip({
    children,
    variant,
}: {
    children: React.ReactNode;
    variant: 'emerald' | 'muted';
}) {
    const variantClass =
        variant === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-muted/60 text-muted-foreground';
    return (
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${variantClass}`}>
            {children}
        </span>
    );
}
