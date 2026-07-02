'use client';

import { RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MediaCirculationHealth } from '@/types/platform/media-circulation';
import { headlineClass } from './verdict-styles';

interface HeadlineStripProps {
    health?: MediaCirculationHealth;
    loading: boolean;
    generating: boolean;
    generateDisabled?: boolean;
    onGenerate: () => void;
}

export function HeadlineStrip({
    health,
    loading,
    generating,
    generateDisabled,
    onGenerate,
}: HeadlineStripProps) {
    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                    {loading || !health ? (
                        <>
                            <Skeleton className="h-7 w-40" />
                            <Skeleton className="h-4 w-80" />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="outline"
                                    className={cn('text-sm uppercase tracking-wide', headlineClass(health.headline))}
                                >
                                    {health.headline.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Health score {health.score}
                                </span>
                            </div>
                            <p className="text-sm text-foreground">{health.summary}</p>
                            {health.reasons?.length > 0 && (
                                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                    {health.reasons.map((r, i) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
                <Button
                    onClick={onGenerate}
                    disabled={generating || generateDisabled}
                    className="shrink-0"
                >
                    {generating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Generate recommendations
                </Button>
            </CardContent>
        </Card>
    );
}
