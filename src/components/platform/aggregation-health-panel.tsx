'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
    Activity,
    ExternalLink,
    Play,
    RefreshCw,
    Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useAggregationSummary,
    useTriggerAggregationJob,
} from '@/hooks/use-aggregation-monitoring';
import type { AggregationTriggerSourceType } from '@/types/platform/aggregation';
import { AggregationActionBar } from '@/components/platform/aggregation-action-bar';

const SOURCE_TYPE_OPTIONS: AggregationTriggerSourceType[] = [
    'RSS',
    'YOUTUBE',
    'PODCAST',
    'PODCAST_DISCOVERY',
    'TWITTER',
    'REDDIT',
    'UPLOAD',
    'MANUAL',
];

const DEFAULT_GRAFANA_URL = 'http://localhost:3002';

function isValidUrl(value: string): boolean {
    try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

export function AggregationHealthPanel() {
    const {
        data: summary,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useAggregationSummary();
    const triggerMutation = useTriggerAggregationJob();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [sourceType, setSourceType] = useState<AggregationTriggerSourceType>('RSS');
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceName, setSourceName] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || DEFAULT_GRAFANA_URL;

    const statusVariant = useMemo(() => {
        if (!summary) {
            return 'secondary' as const;
        }
        if (summary.health.status === 'healthy') {
            return 'success' as const;
        }
        if (summary.health.status === 'degraded') {
            return 'warning' as const;
        }
        return 'destructive' as const;
    }, [summary]);

    const handleTriggerSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        if (!sourceUrl.trim()) {
            setFormError('Source URL is required.');
            return;
        }
        if (!isValidUrl(sourceUrl.trim())) {
            setFormError('Please enter a valid URL.');
            return;
        }

        await triggerMutation.mutateAsync({
            sourceType,
            url: sourceUrl.trim(),
            name: sourceName.trim() || undefined,
        });

        setSourceType('RSS');
        setSourceUrl('');
        setSourceName('');
        setIsDialogOpen(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5" />
                            Aggregation Monitoring
                        </CardTitle>
                        <CardDescription>
                            Queue health, throughput, and manual trigger controls.
                        </CardDescription>
                    </div>
                    <Badge variant={statusVariant} className="capitalize">
                        {summary?.health.status || 'loading'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading aggregation status...
                    </div>
                ) : null}

                {isError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {error instanceof Error ? error.message : 'Failed to load aggregation status.'}
                    </div>
                ) : null}

                {summary ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Processed</p>
                            <p className="text-xl font-semibold">{summary.totalProcessed}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Failed</p>
                            <p className="text-xl font-semibold">{summary.totalFailed}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Active Workers</p>
                            <p className="text-xl font-semibold">{summary.activeWorkers}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Waiting Jobs</p>
                            <p className="text-xl font-semibold">{summary.waitingJobs}</p>
                        </div>
                    </div>
                ) : null}

                {summary?.queues.length ? (
                    <div className="rounded-md border">
                        <div className="grid grid-cols-6 gap-2 border-b bg-muted/40 p-2 text-xs font-medium text-muted-foreground">
                            <span>Queue</span>
                            <span className="text-right">Waiting</span>
                            <span className="text-right">Active</span>
                            <span className="text-right">Completed</span>
                            <span className="text-right">Failed</span>
                            <span className="text-right">Delayed</span>
                        </div>
                        {summary.queues.map((queue) => (
                            <div key={queue.queue} className="grid grid-cols-6 gap-2 p-2 text-sm">
                                <span className="font-medium">{queue.queue}</span>
                                <span className="text-right">{queue.waiting}</span>
                                <span className="text-right">{queue.active}</span>
                                <span className="text-right">{queue.completed}</span>
                                <span className="text-right">{queue.failed}</span>
                                <span className="text-right">{queue.delayed}</span>
                            </div>
                        ))}
                    </div>
                ) : null}

                {summary?.health.timestamp ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        Last update: {new Date(summary.health.timestamp).toLocaleString()}
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button type="button" onClick={() => setIsDialogOpen(true)}>
                        <Play className="mr-2 h-4 w-4" />
                        Trigger Job
                    </Button>

                    {grafanaUrl ? (
                        <Button type="button" variant="secondary" asChild>
                            <a href={grafanaUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Grafana
                            </a>
                        </Button>
                    ) : null}
                </div>

                <AggregationActionBar />
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Trigger Aggregation Job</DialogTitle>
                        <DialogDescription>
                            Submit a manual aggregation source run.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleTriggerSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="aggregation-source-type">Source Type</Label>
                            <Select
                                value={sourceType}
                                onValueChange={(value) => setSourceType(value as AggregationTriggerSourceType)}
                            >
                                <SelectTrigger id="aggregation-source-type">
                                    <SelectValue placeholder="Select source type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOURCE_TYPE_OPTIONS.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aggregation-source-url">Source URL</Label>
                            <Input
                                id="aggregation-source-url"
                                value={sourceUrl}
                                onChange={(event) => setSourceUrl(event.target.value)}
                                placeholder="https://example.com/feed.xml"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aggregation-source-name">Name (optional)</Label>
                            <Input
                                id="aggregation-source-name"
                                value={sourceName}
                                onChange={(event) => setSourceName(event.target.value)}
                                placeholder="Optional label"
                            />
                        </div>

                        {formError ? (
                            <p className="text-sm text-destructive">{formError}</p>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={triggerMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={triggerMutation.isPending}>
                                {triggerMutation.isPending ? 'Submitting...' : 'Trigger'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
