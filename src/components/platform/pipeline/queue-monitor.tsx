'use client';

import { useState } from 'react';
import {
    RefreshCw,
    Timer,
    Trash2,
    Inbox,
    Zap,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    useAggregationSummary,
} from '@/hooks/use-aggregation-monitoring';
import { purgeQueues } from '@/lib/api/aggregation';
import { isAggregationConfigured } from '@/lib/api/aggregation';
import { toast } from '@/components/ui/toast';
import type { QueueStats } from '@/types/platform/aggregation';

const QUEUE_LABELS: Record<string, { name: string; description: string }> = {
    'fetch-queue': { name: 'Source Fetch', description: 'Pulls content from external sources' },
    'normalize-queue': { name: 'Normalize', description: 'Converts raw data to canonical format' },
    'media-queue': { name: 'Media Processing', description: 'Download, transcode (FFmpeg), thumbnail' },
    'ai-queue': { name: 'AI / Enrichment', description: 'Transcripts, embeddings, translations' },
    'aggregation-dlq': { name: 'Dead Letter Queue', description: 'Failed jobs after max retries' },
};

function QueueCard({ queue, onPurge }: { queue: QueueStats; onPurge: (name: string) => void }) {
    const label = QUEUE_LABELS[queue.queue] || { name: queue.queue, description: '' };
    const hasIssues = queue.failed > 0;
    const isBacklogged = queue.waiting > 50;

    return (
        <Card className={
            hasIssues ? 'border-red-500/30' :
            isBacklogged ? 'border-amber-500/30' : ''
        }>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium">{label.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{label.description}</p>
                    </div>
                    {hasIssues && <Badge variant="destructive" className="text-xs">{queue.failed} failed</Badge>}
                    {!hasIssues && isBacklogged && <Badge variant="warning" className="text-xs">{queue.waiting} waiting</Badge>}
                    {!hasIssues && !isBacklogged && queue.active > 0 && <Badge variant="success" className="text-xs">Active</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                        <Inbox className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold tabular-nums">{queue.waiting}</p>
                        <p className="text-[10px] text-muted-foreground">Waiting</p>
                    </div>
                    <div className="text-center">
                        <Zap className="h-3.5 w-3.5 mx-auto mb-1 text-blue-500" />
                        <p className="text-lg font-semibold tabular-nums">{queue.active}</p>
                        <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-500" />
                        <p className="text-lg font-semibold tabular-nums">{queue.completed}</p>
                        <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div className="text-center">
                        <XCircle className="h-3.5 w-3.5 mx-auto mb-1 text-red-500" />
                        <p className="text-lg font-semibold tabular-nums">{queue.failed}</p>
                        <p className="text-[10px] text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                        <Clock className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold tabular-nums">{queue.delayed}</p>
                        <p className="text-[10px] text-muted-foreground">Delayed</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => onPurge(queue.queue)}
                >
                    <Trash2 className="mr-1.5 h-3 w-3" />
                    Purge Queue
                </Button>
            </CardContent>
        </Card>
    );
}

export function QueueMonitor() {
    const {
        data: summary,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useAggregationSummary();

    const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
    const [isPurging, setIsPurging] = useState(false);

    const handlePurge = async () => {
        if (!purgeTarget) return;
        setIsPurging(true);
        try {
            const result = await purgeQueues({ queue: purgeTarget, states: ['waiting', 'delayed', 'failed'] });
            toast({
                title: 'Queue purged',
                description: result.message,
                variant: 'success',
            });
            refetch();
        } catch (err) {
            toast({
                title: 'Failed to purge queue',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setIsPurging(false);
            setPurgeTarget(null);
        }
    };

    if (!isAggregationConfigured()) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">Aggregation service is not configured.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_AGGREGATION_BASE_URL</code> to enable queue monitoring.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary stats */}
            {summary && (
                <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Total Processed</p>
                        <p className="text-xl font-semibold tabular-nums">{summary.totalProcessed.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Total Failed</p>
                        <p className="text-xl font-semibold tabular-nums text-red-500">{summary.totalFailed.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Active Workers</p>
                        <p className="text-xl font-semibold tabular-nums">{summary.activeWorkers}</p>
                    </div>
                    <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Waiting Jobs</p>
                        <p className="text-xl font-semibold tabular-nums">{summary.waitingJobs.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-48" />
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map((j) => (
                                        <Skeleton key={j} className="h-12 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {isError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Failed to load queue stats: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            )}

            {/* Queue cards */}
            {summary?.queues && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.queues.map((queue) => (
                        <QueueCard key={queue.queue} queue={queue} onPurge={setPurgeTarget} />
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                {summary?.health.timestamp && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        Last update: {new Date(summary.health.timestamp).toLocaleString()}
                    </div>
                )}
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Purge confirmation dialog */}
            <Dialog open={!!purgeTarget} onOpenChange={() => setPurgeTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Purge Queue</DialogTitle>
                        <DialogDescription>
                            This will remove all waiting, delayed, and failed jobs from{' '}
                            <strong>{QUEUE_LABELS[purgeTarget ?? '']?.name ?? purgeTarget}</strong>.
                            Active jobs will not be affected. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPurgeTarget(null)} disabled={isPurging}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handlePurge} disabled={isPurging}>
                            {isPurging ? 'Purging...' : 'Purge Queue'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
