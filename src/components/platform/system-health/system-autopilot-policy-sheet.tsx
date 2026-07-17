'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUpdateSystemAutopilotPolicy } from '@/hooks/use-system-autopilot';
import type {
  RegisteredSystemAutopilot,
  SystemAutopilotPolicy,
} from '@/types/platform/system-autopilot';

type NumberKey =
  | 'interval_minutes'
  | 'confirm_probes'
  | 'resolve_probes'
  | 'flap_cycles_24h'
  | 'containment_ttl_minutes';

const FIELDS: Array<{
  key: NumberKey;
  label: string;
  min: number;
  max: number;
  hint: string;
}> = [
  {
    key: 'interval_minutes',
    label: 'Cadence (minutes)',
    min: 2,
    max: 60,
    hint: 'How often CMS starts a bounded observation pass.',
  },
  {
    key: 'confirm_probes',
    label: 'Confirm probes',
    min: 1,
    max: 6,
    hint: 'Matching observations required to open a new incident.',
  },
  {
    key: 'resolve_probes',
    label: 'Resolve probes',
    min: 1,
    max: 12,
    hint: 'Fully healthy observations required to resolve an episode.',
  },
  {
    key: 'flap_cycles_24h',
    label: 'Flap cycles / 24h',
    min: 1,
    max: 12,
    hint: 'Resolved/reconfirmed cycles before containment churn freezes.',
  },
  {
    key: 'containment_ttl_minutes',
    label: 'Containment TTL (minutes)',
    min: 15,
    max: 1440,
    hint: 'Exact pause duration written only in Safe Auto.',
  },
];

export function SystemAutopilotPolicySheet({
  policy,
  registered,
  open,
  onOpenChange,
}: {
  policy: SystemAutopilotPolicy;
  registered: RegisteredSystemAutopilot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateSystemAutopilotPolicy();
  const [draft, setDraft] = useState(policy);

  useEffect(() => {
    if (open) setDraft(policy);
    // Preserve unsaved edits across polling refreshes while the sheet stays open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const valid = FIELDS.every((field) => {
    const value = draft[field.key];
    return Number.isInteger(value) && value >= field.min && value <= field.max;
  });
  const disabled = new Set(draft.containment_disabled_for ?? []);
  const toggleSibling = (key: string, enabled: boolean) =>
    setDraft((current) => ({
      ...current,
      containment_disabled_for: enabled
        ? (current.containment_disabled_for ?? []).filter(
            (value) => value !== key
          )
        : [...new Set([...(current.containment_disabled_for ?? []), key])],
    }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>System Health policy</SheetTitle>
          <SheetDescription>
            These are CMS-enforced bounds. Safe Auto may only pause registered
            sibling autopilots; it cannot restart services, migrate databases,
            or purge queues.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-6">
          <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="font-medium">Safe Auto consequence</p>
            <p className="mt-1 text-muted-foreground">
              Safe Auto writes only exact, time-limited pauses for the enabled
              siblings below. Human or foreign pauses are never shortened or
              cleared.
            </p>
          </section>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cadence & confirmation
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label
                    htmlFor={`system-policy-${field.key}`}
                    className="text-xs"
                  >
                    {field.label}
                  </Label>
                  <Input
                    id={`system-policy-${field.key}`}
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={draft[field.key]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: Number(event.target.value),
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {field.hint} Range {field.min}–{field.max}.
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Containment scope
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Only Pipeline Repair and Enrichment are enabled by default. Select
              a sibling to permit exact Safe Auto containment for it.
            </p>
            <div className="space-y-2">
              {registered.map((sibling) => {
                const enabled = !disabled.has(sibling.key);
                return (
                  <label
                    key={sibling.key}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                  >
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        toggleSibling(sibling.key, checked === true)
                      }
                      aria-label={`Enable ${sibling.label} containment`}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {sibling.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Depends on{' '}
                        {sibling.dependencies.join(', ') ||
                          'no declared dependencies'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid || update.isPending}
            onClick={() =>
              update.mutate(
                {
                  interval_minutes: draft.interval_minutes,
                  confirm_probes: draft.confirm_probes,
                  resolve_probes: draft.resolve_probes,
                  flap_cycles_24h: draft.flap_cycles_24h,
                  containment_ttl_minutes: draft.containment_ttl_minutes,
                  containment_disabled_for:
                    draft.containment_disabled_for ?? [],
                },
                { onSuccess: () => onOpenChange(false) }
              )
            }
          >
            Save policy
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
