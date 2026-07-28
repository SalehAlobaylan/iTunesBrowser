'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Radio, Sparkles, Timer } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  usePreferenceSettings,
  useUpdatePreferenceSettings,
} from '@/hooks/use-topics';
import type { PreferenceSettings } from '@/types/platform/topics';

type NumKey = Exclude<
  keyof PreferenceSettings,
  'tenant_id' | 'pods_enabled' | 'news_enabled'
>;

function NumberField({
  label,
  hint,
  value,
  accent,
  min,
  max,
  onSave,
}: {
  label: string;
  hint?: string;
  value?: number;
  accent?: 'gold' | 'news';
  min: number;
  max: number;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? '');
  useEffect(() => setDraft(value?.toString() ?? ''), [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          className={cn(
            'text-xs font-medium',
            accent === 'gold' && 'text-gold',
            accent === 'news' && 'text-news'
          )}
        >
          {label}
        </Label>
        {hint && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <Input
        type="number"
        step="0.05"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = Number(draft);
          if (draft !== '' && Number.isFinite(next)) {
            const clamped = Math.min(max, Math.max(min, next));
            setDraft(clamped.toString());
            if (clamped !== value) onSave(clamped);
          } else {
            setDraft(value?.toString() ?? '');
          }
        }}
        className="tabular-nums"
      />
    </div>
  );
}

export function SettingsTab() {
  const settings = usePreferenceSettings();
  const update = useUpdatePreferenceSettings();
  const cfg = settings.data;

  const patch = (p: Partial<PreferenceSettings>) => update.mutate(p);
  const setNum = (key: NumKey) => (v: number) =>
    patch({ [key]: v } as Partial<PreferenceSettings>);

  if (settings.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (settings.isError || !cfg) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Failed to load personalization
          settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Kill switches */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4" /> Live kill switches
          </CardTitle>
          <CardDescription>
            Master toggles for personalization on each feed. Other CMS replicas
            may take up to 30 seconds to observe a change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/5 p-3">
            <div>
              <div className="text-sm font-semibold text-gold">
                Pods personalization
              </div>
              <div className="text-xs text-muted-foreground">
                Bounded per-item boost on the audio feed
              </div>
            </div>
            <Switch
              checked={cfg.pods_enabled}
              onCheckedChange={(v) => patch({ pods_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-news/40 bg-news/5 p-3">
            <div>
              <div className="text-sm font-semibold text-news">
                News personalization
              </div>
              <div className="text-xs text-muted-foreground">
                Story-slide reorder boost on the magazine feed
              </div>
            </div>
            <Switch
              checked={cfg.news_enabled}
              onCheckedChange={(v) => patch({ news_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Boost strength */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Boost strength
          </CardTitle>
          <CardDescription>
            How far affinity can lift an item: final = base × (1 + W ×
            affinity).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberField
            label="Pods (W)"
            accent="gold"
            hint="0–1 · default 0.30"
            min={0}
            max={1}
            value={cfg.w_pods}
            onSave={setNum('w_pods')}
          />
          <NumberField
            label="News (W)"
            accent="news"
            hint="0–1 · default 0.15"
            min={0}
            max={1}
            value={cfg.w_news}
            onSave={setNum('w_news')}
          />
        </CardContent>
      </Card>

      {/* Engagement weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement weights</CardTitle>
          <CardDescription>
            Per-interaction contribution to learned affinity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField
            label="Complete"
            min={0}
            max={5}
            value={cfg.weight_complete}
            onSave={setNum('weight_complete')}
          />
          <NumberField
            label="Bookmark"
            min={0}
            max={5}
            value={cfg.weight_bookmark}
            onSave={setNum('weight_bookmark')}
          />
          <NumberField
            label="Share"
            min={0}
            max={5}
            value={cfg.weight_share}
            onSave={setNum('weight_share')}
          />
          <NumberField
            label="Like"
            min={0}
            max={5}
            value={cfg.weight_like}
            onSave={setNum('weight_like')}
          />
          <NumberField
            label="Comment"
            min={0}
            max={5}
            value={cfg.weight_comment}
            onSave={setNum('weight_comment')}
          />
          <NumberField
            label="View"
            min={0}
            max={5}
            value={cfg.weight_view}
            onSave={setNum('weight_view')}
          />
        </CardContent>
      </Card>

      {/* Decay & priors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4" /> Decay &amp; priors
          </CardTitle>
          <CardDescription>
            How fast signals fade and how much a declared pick counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField
            label="Half-life (days)"
            hint="0.25–365 · default 30"
            min={0.25}
            max={365}
            value={cfg.decay_half_life_days}
            onSave={setNum('decay_half_life_days')}
          />
          <NumberField
            label="Declared prior"
            hint="0–5 · default 3.0"
            min={0}
            max={5}
            value={cfg.declared_prior}
            onSave={setNum('declared_prior')}
          />
          <NumberField
            label="Category discount"
            hint="0–1 · default 0.5"
            min={0}
            max={1}
            value={cfg.category_discount}
            onSave={setNum('category_discount')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
