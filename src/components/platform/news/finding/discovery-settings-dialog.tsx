'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Zap, SlidersHorizontal, Globe, Network, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDiscoveryConfig, useUpdateDiscoveryConfig } from '@/hooks/use-discovery';
import type { DiscoveryConfig } from '@/types/platform/discovery';

const DEFAULTS: DiscoveryConfig = {
    automation_enabled: false,
    sweep_interval_hours: 24,
    min_confidence: 0.15,
    min_relevance: 0.1,
    dup_threshold: 0.92,
    dup_penalty: 0.5,
    recency_window_days: 30,
    max_candidates_per_profile: 15,
    search_provider: 'auto',
    intelligence_enabled: false,
    telegram_discovery_enabled: false,
    twitter_discovery_enabled: false,
    twitter_recommend_enabled: false,
    youtube_discovery_enabled: false,
    podcast_discovery_enabled: false,
    youtube_related_enabled: false,
    apple_related_enabled: false,
    media_initial_max_episodes: 5,
    graph_build_interval_hours: 24,
    promotion_threshold: 0.5,
    weight_citation: 0.2,
    weight_cocitation: 0.2,
    weight_authority: 0.2,
    weight_relevance: 0.25,
    weight_health: 0.1,
    weight_novelty: 0.05,
};

const PROVIDERS = [
    { v: 'auto', label: 'Auto', desc: 'Web search + curated' },
    { v: 'tavily', label: 'Web search', desc: 'Tavily only' },
    { v: 'crawl', label: 'Curated', desc: 'No external API' },
] as const;

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={onChange}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-news' : 'bg-muted-foreground/30')}
        >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
    );
}

function SliderField({ label, help, value, onChange, min, max, step, display }: {
    label: string; help: string; value: number; onChange: (v: number) => void;
    min: number; max: number; step: number; display: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <span className="text-sm font-medium tabular-nums text-news">{display}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-news"
            />
            <p className="text-xs text-muted-foreground">{help}</p>
        </div>
    );
}

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <div className="flex items-start gap-2">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div>
                    <h4 className="text-sm font-semibold leading-none">{title}</h4>
                    {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
                </div>
            </div>
            <div className="space-y-4 pl-7">{children}</div>
        </section>
    );
}

export function DiscoverySettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { data } = useDiscoveryConfig();
    const update = useUpdateDiscoveryConfig();
    const [form, setForm] = useState<DiscoveryConfig>(DEFAULTS);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (open && data) setForm(data);
    }, [open, data]);

    const set = <K extends keyof DiscoveryConfig>(k: K, v: DiscoveryConfig[K]) => setForm((f) => ({ ...f, [k]: v }));
    const numInput = (k: keyof DiscoveryConfig) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

    const save = async () => {
        await update.mutateAsync(form);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Discovery settings</DialogTitle>
                    <DialogDescription>Control how Wahb finds and ranks new sources.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-1">
                    {/* Automation */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                                <Zap className="mt-0.5 h-4 w-4 text-news" />
                                <div>
                                    <p className="text-sm font-semibold leading-none">Automatic discovery</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Sweep every enabled interest on a schedule — suggestions appear without clicking Run.</p>
                                </div>
                            </div>
                            <Toggle on={form.automation_enabled} onChange={() => set('automation_enabled', !form.automation_enabled)} />
                        </div>
                        {form.automation_enabled && (
                            <div className="mt-3 flex items-center gap-2 border-t pt-3">
                                <Label className="text-sm">Run every</Label>
                                <Input type="number" min={1} value={form.sweep_interval_hours} onChange={numInput('sweep_interval_hours')} className="h-8 w-20" />
                                <span className="text-sm text-muted-foreground">hours</span>
                            </div>
                        )}
                    </div>

                    {/* Source intelligence */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                                <Network className="mt-0.5 h-4 w-4 text-news" />
                                <div>
                                    <p className="text-sm font-semibold leading-none">Source intelligence</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Build a graph of your trusted news ecosystem and auto-surface high-authority sources you don&apos;t track yet — with evidence.</p>
                                </div>
                            </div>
                            <Toggle on={form.intelligence_enabled} onChange={() => set('intelligence_enabled', !form.intelligence_enabled)} />
                        </div>
                        {form.intelligence_enabled && (
                            <div className="mt-3 space-y-3 border-t pt-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm">Rebuild every</Label>
                                    <Input type="number" min={1} value={form.graph_build_interval_hours} onChange={numInput('graph_build_interval_hours')} className="h-8 w-20" />
                                    <span className="text-sm text-muted-foreground">hours</span>
                                </div>
                                <div className="flex items-start justify-between gap-3 border-t pt-3">
                                    <div className="flex items-start gap-2">
                                        <Send className="mt-0.5 h-4 w-4 text-news" />
                                        <div>
                                            <p className="text-sm font-semibold leading-none">Telegram discovery</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Extend the graph to Telegram — reads the public previews of channels you trust and surfaces the channels they forward and link to.</p>
                                        </div>
                                    </div>
                                    <Toggle on={form.telegram_discovery_enabled} onChange={() => set('telegram_discovery_enabled', !form.telegram_discovery_enabled)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quality */}
                    <Section icon={<SlidersHorizontal className="h-4 w-4" />} title="Quality filters" desc="How strict the review queue is.">
                        <SliderField
                            label="Hide weak matches below"
                            help="Suggestions less relevant than this are hidden from the queue by default. Higher = stricter."
                            value={form.min_relevance} onChange={(v) => set('min_relevance', v)}
                            min={0} max={0.4} step={0.01} display={`${Math.round(form.min_relevance * 100)}%`}
                        />
                        <SliderField
                            label="Minimum candidate quality"
                            help="Drops clearly-broken feeds before ranking. Keep low — relevance does the real filtering."
                            value={form.min_confidence} onChange={(v) => set('min_confidence', v)}
                            min={0} max={0.5} step={0.01} display={`${Math.round(form.min_confidence * 100)}%`}
                        />
                    </Section>

                    {/* Discovery behaviour */}
                    <Section icon={<Globe className="h-4 w-4" />} title="Discovery" desc="Where and how widely to search.">
                        <div className="space-y-1.5">
                            <Label className="text-sm">Search source</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.v}
                                        type="button"
                                        onClick={() => set('search_provider', p.v)}
                                        className={cn(
                                            'rounded-md border p-2 text-left text-xs transition-colors',
                                            form.search_provider === p.v ? 'border-news bg-news/5' : 'hover:bg-muted'
                                        )}
                                    >
                                        <div className="font-medium">{p.label}</div>
                                        <div className="text-muted-foreground">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-sm">Only feeds active within</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" min={1} value={form.recency_window_days} onChange={numInput('recency_window_days')} className="h-8" />
                                    <span className="text-sm text-muted-foreground">days</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Max candidates / interest</Label>
                                <Input type="number" min={1} value={form.max_candidates_per_profile} onChange={numInput('max_candidates_per_profile')} className="h-8" />
                            </div>
                        </div>
                    </Section>

                    {/* Advanced */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced((v) => !v)}
                            className="flex w-full items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
                            Advanced — duplicate detection
                        </button>
                        {showAdvanced && (
                            <div className="mt-3 space-y-4 rounded-md border border-dashed p-3">
                                <p className="text-xs text-muted-foreground">Feeds that mostly republish content you already ingest (wire services, mirrors) get demoted.</p>
                                <SliderField
                                    label="Counts as duplicate above"
                                    help="How similar a feed's content must be to existing items to be treated as a mirror."
                                    value={form.dup_threshold} onChange={(v) => set('dup_threshold', v)}
                                    min={0.5} max={1} step={0.01} display={`${Math.round(form.dup_threshold * 100)}%`}
                                />
                                <SliderField
                                    label="Demotion strength"
                                    help="A duplicate feed's relevance is multiplied by this. Lower = harsher penalty."
                                    value={form.dup_penalty} onChange={(v) => set('dup_penalty', v)}
                                    min={0.1} max={1} step={0.05} display={`×${form.dup_penalty.toFixed(2)}`}
                                />

                                <div className="border-t pt-3">
                                    <p className="mb-3 text-xs font-medium text-muted-foreground">Source-graph ranking — how candidates are scored for auto-promotion.</p>
                                    <div className="space-y-4">
                                        <SliderField label="Auto-promote above" help="Composite score a candidate must reach to enter the review queue."
                                            value={form.promotion_threshold} onChange={(v) => set('promotion_threshold', v)} min={0} max={1} step={0.05} display={`${Math.round(form.promotion_threshold * 100)}%`} />
                                        <SliderField label="Citation weight" help="How often your own content cites the domain."
                                            value={form.weight_citation} onChange={(v) => set('weight_citation', v)} min={0} max={1} step={0.05} display={form.weight_citation.toFixed(2)} />
                                        <SliderField label="Co-citation weight" help="How many of your sources link to it."
                                            value={form.weight_cocitation} onChange={(v) => set('weight_cocitation', v)} min={0} max={1} step={0.05} display={form.weight_cocitation.toFixed(2)} />
                                        <SliderField label="Authority weight" help="PageRank standing in your trusted neighborhood."
                                            value={form.weight_authority} onChange={(v) => set('weight_authority', v)} min={0} max={1} step={0.05} display={form.weight_authority.toFixed(2)} />
                                        <SliderField label="Relevance weight" help="Semantic match to the interest."
                                            value={form.weight_relevance} onChange={(v) => set('weight_relevance', v)} min={0} max={1} step={0.05} display={form.weight_relevance.toFixed(2)} />
                                        <SliderField label="Feed health weight" help="Liveness + recency of the feed."
                                            value={form.weight_health} onChange={(v) => set('weight_health', v)} min={0} max={1} step={0.05} display={form.weight_health.toFixed(2)} />
                                        <SliderField label="Novelty weight" help="Rewards feeds that aren't mirrors of content you already have."
                                            value={form.weight_novelty} onChange={(v) => set('weight_novelty', v)} min={0} max={1} step={0.05} display={form.weight_novelty.toFixed(2)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={update.isPending}>Cancel</Button>
                    <Button onClick={save} disabled={update.isPending}>
                        {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
