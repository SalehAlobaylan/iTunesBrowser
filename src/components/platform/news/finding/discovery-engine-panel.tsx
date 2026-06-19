'use client';

import { Zap, Network, Play, Loader2, Sparkles, SlidersHorizontal, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    useDiscoveryConfig,
    useUpdateDiscoveryConfig,
    useSweepNow,
    useBuildGraph,
} from '@/hooks/use-discovery';
import type { DiscoveryConfig } from '@/types/platform/discovery';

/**
 * Pill-toggle: a compact on/off control with an icon + label. Filled when on.
 * Replaces the tall FeatureBlock rows so the engine controls fit one slim strip.
 */
function PillToggle({ icon, label, on, onClick, disabled, title }: {
    icon: React.ReactNode; label: string; on: boolean;
    onClick: () => void; disabled?: boolean; title?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40',
                on
                    ? 'border-news/30 bg-news/10 text-news'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            )}
        >
            {icon}
            <span>{label}</span>
            <span className={cn('ms-0.5 h-1.5 w-1.5 rounded-full', on ? 'bg-news' : 'bg-muted-foreground/40')} />
        </button>
    );
}

/**
 * Slim discovery control bar — one compact strip replacing the old two-card
 * engine panel: pill-toggles + live counts + Run/Build/Settings. Detailed knobs
 * (intervals, weights, intelligence/telegram detail) live in the Settings dialog;
 * the per-platform tooling (X) lives in the Network tab.
 */
export function DiscoveryEnginePanel({ pending, sources, interests, onOpenSettings }: {
    pending: number; sources: number; interests: number; onOpenSettings: () => void;
}) {
    const { data: cfg } = useDiscoveryConfig();
    const update = useUpdateDiscoveryConfig();
    const sweep = useSweepNow();
    const build = useBuildGraph();

    const auto = cfg?.automation_enabled ?? false;
    const intel = cfg?.intelligence_enabled ?? false;
    const telegram = cfg?.telegram_discovery_enabled ?? false;
    const toggle = (key: 'automation_enabled' | 'intelligence_enabled' | 'telegram_discovery_enabled') => {
        if (!cfg) return;
        update.mutate({ ...cfg, [key]: !(cfg[key] as boolean) } as DiscoveryConfig);
    };

    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <PillToggle
                        icon={<Zap className="h-3.5 w-3.5" />}
                        label="Automatic"
                        on={auto}
                        onClick={() => toggle('automation_enabled')}
                        disabled={update.isPending}
                        title={auto ? `On · sweeps every ${cfg?.sweep_interval_hours}h` : 'Off — runs only when you trigger it'}
                    />
                    <PillToggle
                        icon={<Network className="h-3.5 w-3.5" />}
                        label="Source intelligence"
                        on={intel}
                        onClick={() => toggle('intelligence_enabled')}
                        disabled={update.isPending}
                        title={intel ? `On · maps your network every ${cfg?.graph_build_interval_hours}h` : 'Off — find sources from your trusted network'}
                    />
                    <PillToggle
                        icon={<Send className="h-3.5 w-3.5" />}
                        label="Telegram"
                        on={telegram}
                        onClick={() => toggle('telegram_discovery_enabled')}
                        disabled={update.isPending || !intel}
                        title={!intel ? 'Turn on Source intelligence first' : telegram ? 'On · discovers channels your trusted channels link to' : 'Off'}
                    />
                </div>

                {/* Counts */}
                <div className="flex items-center gap-x-3 text-xs">
                    <span><b className="text-sm">{pending}</b> <span className="text-muted-foreground">to review</span></span>
                    <span className="text-muted-foreground/40">·</span>
                    <span><b className="text-sm">{sources}</b> <span className="text-muted-foreground">sources</span></span>
                    <span className="text-muted-foreground/40">·</span>
                    <span><b className="text-sm">{interests}</b> <span className="text-muted-foreground">interests</span></span>
                </div>

                {/* Actions */}
                <div className="ms-auto flex items-center gap-2">
                    {auto && (
                        <Button size="sm" variant="outline" onClick={() => sweep.mutate()} disabled={sweep.isPending}>
                            {sweep.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                            Run now
                        </Button>
                    )}
                    {intel && (
                        <Button size="sm" variant="outline" onClick={() => build.mutate()} disabled={build.isPending}>
                            {build.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                            Build now
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={onOpenSettings}>
                        <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
