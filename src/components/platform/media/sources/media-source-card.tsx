'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Play } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/format';
import { toast } from '@/components/ui/toast';
import { sourceHealth } from '@/lib/sources/health';
import { sourceKeys } from '@/hooks/use-sources';
import { runSource } from '@/lib/api/cms/sources';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceType } from '@/types/platform/source';
import { SourceActionMenu } from '@/components/platform/sources/shared/source-action-menu';
import { SourceAvatar } from '@/components/platform/sources/shared/source-avatar';
import { HEALTH_BG, HEALTH_LABELS, HEALTH_TEXT } from '@/components/platform/sources/shared/health-meta';

interface MediaSourceCardProps {
    source: ContentSource;
    /** Items produced (when this source is a known top producer). */
    output?: { items: number; failed: number };
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onRequestDelete: (id: string) => void;
    returnTo: string;
}

function cadence(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = minutes / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export function MediaSourceCard({
    source,
    output,
    selected,
    onToggleSelect,
    onRequestDelete,
    returnTo,
}: MediaSourceCardProps) {
    const queryClient = useQueryClient();
    const [running, setRunning] = useState(false);
    const health = sourceHealth(source);
    const editHref = `/platform/sources/${source.id}?from=${encodeURIComponent(returnTo)}`;

    const handleRun = async () => {
        setRunning(true);
        try {
            await runSource(source.id);
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
            toast({ title: 'Ingestion started', variant: 'success' });
        } catch (e) {
            toast({
                title: 'Failed to run',
                description: e instanceof Error ? e.message : undefined,
                variant: 'destructive',
            });
        } finally {
            setRunning(false);
        }
    };

    return (
        <Card
            className={cn(
                'group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md',
                selected && 'ring-2 ring-gold'
            )}
        >
            {/* Select + actions overlay */}
            <div className="absolute left-3 top-3 z-10">
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleSelect(source.id)}
                    aria-label={`Select ${source.name}`}
                    className={cn(
                        'border-muted-foreground/50 bg-background/80 backdrop-blur transition-opacity',
                        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                    )}
                />
            </div>
            <div className="absolute right-2 top-2 z-10">
                <SourceActionMenu source={source} returnTo={returnTo} onRequestDelete={onRequestDelete} />
            </div>

            <div className="flex gap-3.5 p-4 pr-12">
                {/* Artwork with health ring */}
                <Link href={editHref} aria-label={`Edit ${source.name}`}>
                    <SourceAvatar source={source} ring className="h-16 w-16 text-xl" />
                </Link>

                {/* Identity */}
                <div className="min-w-0 flex-1">
                    <Link href={editHref} className="block truncate font-semibold leading-tight hover:underline">
                        {source.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variant="outline" className="font-normal">
                            {SOURCE_TYPE_LABELS[source.type as SourceType] ?? source.type}
                        </Badge>
                        <span className={cn('flex items-center gap-1 text-xs', HEALTH_TEXT[health.status])}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', HEALTH_BG[health.status])} />
                            {HEALTH_LABELS[health.status]}
                        </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                        {source.last_fetched_at
                            ? formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })
                            : 'Never fetched'}
                        {' · every '}
                        {cadence(source.fetch_interval_minutes)}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t px-4 py-2">
                <span className="text-xs text-muted-foreground">
                    {output
                        ? `${formatNumber(output.items)} items${output.failed > 0 ? ` · ${formatNumber(output.failed)} failed` : ''}`
                        : !source.is_active
                          ? 'Disabled'
                          : ''}
                </span>
                <Button size="sm" variant="ghost" onClick={handleRun} disabled={running} className="h-7">
                    {running ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Run
                </Button>
            </div>
        </Card>
    );
}
