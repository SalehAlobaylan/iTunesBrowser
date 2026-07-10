'use client';

import { useEffect, useId, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePreferenceAutopilotPolicy } from '@/hooks/use-preference-autopilot';
import type { PreferenceAutopilotPolicy } from '@/types/platform/preference-autopilot';

type NumKey = keyof PreferenceAutopilotPolicy;

const CAP_FIELDS: { key: NumKey; label: string; hint: string }[] = [
    { key: 'interval_minutes', label: 'Cadence (min)', hint: 'Scheduler interval' },
    { key: 'max_item_candidates', label: 'Item candidates / run', hint: 'Mapping sweep budget' },
    { key: 'max_story_candidates', label: 'Story candidates / run', hint: 'Mapping sweep budget' },
    { key: 'max_dirty_topics', label: 'Dirty topics / run', hint: 'Re-map after edits' },
    { key: 'max_users_recompute', label: 'Users recomputed / run', hint: 'Affinity refresh' },
    { key: 'max_proposals_enriched', label: 'Proposals scored / run', hint: 'Advisor budget' },
    { key: 'max_embedding_calls', label: 'Embedding calls / run', hint: 'Enrichment budget' },
    { key: 'max_translation_calls', label: 'Translation calls / run', hint: 'Label prefill budget' },
    { key: 'max_mined_proposals', label: 'Mined proposals / run', hint: 'New proposal cap' },
    { key: 'max_centroid_refresh', label: 'Centroid refreshes / run', hint: 'NULL recovery' },
    { key: 'max_pending_proposals', label: 'Pending ceiling', hint: 'Mining backpressure' },
];

const FLOOR_FIELDS: { key: NumKey; label: string }[] = [
    { key: 'coverage_floor_foryou_pct', label: 'For You floor %' },
    { key: 'coverage_floor_news_pct', label: 'News floor %' },
    { key: 'coverage_floor_story_pct', label: 'Story floor %' },
    { key: 'failure_breaker_pct', label: 'Failure breaker %' },
    { key: 'dead_topic_days', label: 'Dead-topic days' },
];

const CONF_FIELDS: { key: NumKey; label: string; step: number }[] = [
    { key: 'high_confidence', label: 'High-confidence ≥', step: 0.01 },
    { key: 'advisory_reject_floor', label: 'Advisory-reject <', step: 0.01 },
    { key: 'duplicate_cosine', label: 'Duplicate cosine ≥', step: 0.01 },
];

// Auto-approve tier knobs. The enable switch itself lives on the tier card (it is
// server-gated on trust); these tune the envelope once earned.
const AUTO_FIELDS: { key: NumKey; label: string; step: number; hint: string }[] = [
    { key: 'auto_approve_min_confidence', label: 'Auto-approve ≥', step: 0.01, hint: '0.85 floor — stricter than high-conf' },
    { key: 'max_auto_approvals', label: 'Auto-approvals / run', step: 1, hint: '0 disables executions' },
];

function NumberField({
    label,
    hint,
    value,
    step = 1,
    min = 0,
    max,
    onChange,
}: {
    label: string;
    hint?: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    onChange: (v: number) => void;
}) {
    const id = useId();
    return (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-xs">{label}</Label>
            <Input
                id={id}
                type="number"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next)) onChange(next);
                }}
                className="h-8"
            />
            {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

export function AutopilotPolicySheet({
    policy,
    open,
    onOpenChange,
}: {
    policy: PreferenceAutopilotPolicy;
    open: boolean;
    onOpenChange: (o: boolean) => void;
}) {
    const update = useUpdatePreferenceAutopilotPolicy();
    const [draft, setDraft] = useState<PreferenceAutopilotPolicy>(policy);

    // Seed the draft ONLY on the open transition (open: false → true). Keying off
    // policy identity would clobber the admin's unsaved edits every time the
    // background status poll (refetchInterval 30s) or a scheduled run refreshed the
    // policy object mid-edit.
    useEffect(() => {
        if (open) setDraft(policy);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const set = (key: NumKey, v: number) => setDraft((d) => ({ ...d, [key]: v }));

    const save = () => {
        const patch: Partial<PreferenceAutopilotPolicy> = {};
        [...CAP_FIELDS, ...FLOOR_FIELDS, ...CONF_FIELDS, ...AUTO_FIELDS].forEach(({ key }) => {
            (patch as Record<string, unknown>)[key] = draft[key];
        });
        update.mutate(patch, { onSuccess: () => onOpenChange(false) });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Autopilot policy</SheetTitle>
                    <SheetDescription>
                        Per-run caps and thresholds. Raising caps or running the full remap are deliberate human actions — this
                        surface feeds user-facing ranking, so there is no elevated preset.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-6">
                    <section>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caps &amp; cadence</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {CAP_FIELDS.map((f) => (
                                <NumberField
                                    key={f.key}
                                    label={f.label}
                                    hint={f.hint}
                                    value={Number(draft[f.key] ?? 0)}
                                    onChange={(v) => set(f.key, v)}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coverage floors &amp; breaker</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {FLOOR_FIELDS.map((f) => (
                                <NumberField
                                    key={f.key}
                                    label={f.label}
                                    max={f.key === 'dead_topic_days' ? undefined : 100}
                                    value={Number(draft[f.key] ?? 0)}
                                    onChange={(v) => set(f.key, v)}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confidence thresholds</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {CONF_FIELDS.map((f) => (
                                <NumberField
                                    key={f.key}
                                    label={f.label}
                                    step={f.step}
                                    max={1}
                                    value={Number(draft[f.key] ?? 0)}
                                    onChange={(v) => set(f.key, v)}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Auto-approve tier</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {AUTO_FIELDS.map((f) => (
                                <NumberField
                                    key={f.key}
                                    label={f.label}
                                    hint={f.hint}
                                    step={f.step}
                                    max={f.key === 'auto_approve_min_confidence' ? 1 : undefined}
                                    value={Number(draft[f.key] ?? 0)}
                                    onChange={(v) => set(f.key, v)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <SheetFooter className="mt-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={update.isPending}>
                        Save policy
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
