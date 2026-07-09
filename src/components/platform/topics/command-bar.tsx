'use client';

import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMineTopics, useRemapTopics, useTopicCatalog, useTopicProposals } from '@/hooks/use-topics';

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: 'gold' | 'news' | 'muted' }) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div
                className={cn(
                    'text-2xl font-bold tabular-nums',
                    accent === 'gold' && 'text-gold',
                    accent === 'news' && 'text-news',
                    accent === 'muted' && 'text-muted-foreground'
                )}
            >
                {value}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
    );
}

export function CommandBar() {
    const catalog = useTopicCatalog();
    const pending = useTopicProposals('pending');
    const mine = useMineTopics();
    const remap = useRemapTopics();

    const topics = catalog.data?.data ?? [];
    const active = topics.filter((t) => t.active).length;
    const featured = topics.filter((t) => t.featured).length;
    const mapped = topics.reduce((sum, t) => sum + t.member_count, 0);
    const pendingCount = pending.data?.data.length ?? 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Topics &amp; Preferences</h1>
                    <p className="text-sm text-muted-foreground">
                        Canonical vocabulary powering picker preferences, feed personalization, and demand telemetry.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => mine.mutate()} disabled={mine.isPending}>
                        {mine.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Mine candidates
                    </Button>
                    <Button variant="outline" onClick={() => remap.mutate()} disabled={remap.isPending}>
                        {remap.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Full remap
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Topics" value={topics.length} />
                <Stat label="Active" value={active} accent="gold" />
                <Stat label="Featured" value={featured} />
                <Stat label="Mapped items" value={mapped} accent="muted" />
                <Stat label="Pending proposals" value={pendingCount} accent={pendingCount > 0 ? 'news' : 'muted'} />
            </div>
        </div>
    );
}
