'use client';

import { Zap, Network, Play, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    useDiscoveryConfig,
    useUpdateDiscoveryConfig,
    useSweepNow,
    useBuildGraph,
    useAuthorities,
} from '@/hooks/use-discovery';
import type { DiscoveryConfig } from '@/types/platform/discovery';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled}
            onClick={onChange}
            className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                on ? 'bg-news' : 'bg-muted-foreground/30'
            )}
        >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
    );
}

function FeatureBlock({ icon, title, status, on, onToggle, busy, action }: {
    icon: React.ReactNode; title: string; status: string; on: boolean;
    onToggle: () => void; busy: boolean; action: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 p-4">
            <div className={cn('rounded-md p-2', on ? 'bg-news/10 text-news' : 'bg-muted text-muted-foreground')}>{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="font-medium leading-none">{title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{status}</p>
            </div>
            {action}
            <Toggle on={on} onChange={onToggle} disabled={busy} />
        </div>
    );
}

export function DiscoveryEnginePanel({ pending, sources, interests, onOpenSettings }: {
    pending: number; sources: number; interests: number; onOpenSettings: () => void;
}) {
    const { data: cfg } = useDiscoveryConfig();
    const update = useUpdateDiscoveryConfig();
    const sweep = useSweepNow();
    const build = useBuildGraph();
    const { data: authoritiesData } = useAuthorities();

    const auto = cfg?.automation_enabled ?? false;
    const intel = cfg?.intelligence_enabled ?? false;
    const toggle = (key: 'automation_enabled' | 'intelligence_enabled') => {
        if (!cfg) return;
        update.mutate({ ...cfg, [key]: !(cfg[key] as boolean) } as DiscoveryConfig);
    };

    const topAuthorities = (authoritiesData?.data ?? []).filter((a) => a.feed_valid).slice(0, 5);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <FeatureBlock
                        icon={<Zap className="h-5 w-5" />}
                        title="Automatic discovery"
                        status={auto ? `On · sweeps every ${cfg?.sweep_interval_hours}h` : 'Off — runs only when you trigger it'}
                        on={auto}
                        onToggle={() => toggle('automation_enabled')}
                        busy={update.isPending}
                        action={
                            <Button size="sm" variant="outline" onClick={() => sweep.mutate()} disabled={sweep.isPending}>
                                {sweep.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                                Run now
                            </Button>
                        }
                    />
                    <FeatureBlock
                        icon={<Network className="h-5 w-5" />}
                        title="Source intelligence"
                        status={intel ? `On · maps your network every ${cfg?.graph_build_interval_hours}h` : 'Off — find sources from your trusted network'}
                        on={intel}
                        onToggle={() => toggle('intelligence_enabled')}
                        busy={update.isPending}
                        action={
                            <Button size="sm" variant="outline" onClick={() => build.mutate()} disabled={build.isPending}>
                                {build.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                                Build now
                            </Button>
                        }
                    />
                </div>

                {/* Footer: stats + network insight + advanced */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-4 py-3">
                    <span className="text-sm"><b>{pending}</b> <span className="text-muted-foreground">to review</span></span>
                    <span className="text-sm"><b>{sources}</b> <span className="text-muted-foreground">active sources</span></span>
                    <span className="text-sm"><b>{interests}</b> <span className="text-muted-foreground">interests</span></span>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {topAuthorities.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Network className="h-3.5 w-3.5 text-news" />
                                <span>Top in your network:</span>
                                {topAuthorities.map((a) => (
                                    <span key={a.domain} className="rounded bg-muted px-1.5 py-0.5" title={`authority ${a.authority}`}>{a.domain}</span>
                                ))}
                            </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={onOpenSettings}>
                            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Advanced
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
