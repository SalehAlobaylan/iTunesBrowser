'use client';

import { useEffect, useState } from 'react';
import {
    Play,
    RotateCcw,
    ArrowRightLeft,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useStatusCounts, useRetryPending, useRetryFailed, useBulkStatusChange } from '@/hooks/use-pipeline';
import { listSourceNames } from '@/lib/api/cms/content';
import { isAggregationConfigured } from '@/lib/api/aggregation';

const ALL_STATUSES = ['PENDING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED'];
const CONTENT_TYPES = ['ARTICLE', 'VIDEO', 'TWEET', 'COMMENT', 'PODCAST'];

export function PipelineOperations() {
    const { data: counts } = useStatusCounts();
    const retryPendingMutation = useRetryPending();
    const retryFailedMutation = useRetryFailed();
    const bulkStatusMutation = useBulkStatusChange();

    const [sourceNames, setSourceNames] = useState<string[]>([]);
    useEffect(() => {
        listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
    }, []);

    // Retry Pending state
    const [pendingSource, setPendingSource] = useState<string>('');
    const [pendingLimit, setPendingLimit] = useState('200');

    // Retry Failed state
    const [failedSource, setFailedSource] = useState<string>('');
    const [failedLimit, setFailedLimit] = useState('100');

    // Bulk Status state
    const [fromStatus, setFromStatus] = useState('');
    const [toStatus, setToStatus] = useState('');
    const [bulkSource, setBulkSource] = useState('');
    const [bulkType, setBulkType] = useState('');
    const [bulkLimit, setBulkLimit] = useState('100');
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Helper: convert "all" select value to undefined for API
    const toOptional = (val: string) => val && val !== 'all' ? val : undefined;

    const handleRetryPending = () => {
        retryPendingMutation.mutate({
            source: toOptional(pendingSource),
            limit: Math.min(parseInt(pendingLimit) || 200, 500),
        });
    };

    const handleRetryFailed = () => {
        retryFailedMutation.mutate({
            source: toOptional(failedSource),
            limit: Math.min(parseInt(failedLimit) || 100, 500),
        });
    };

    const handleBulkPreview = () => {
        if (!fromStatus || !toStatus) return;
        bulkStatusMutation.mutate(
            {
                from_status: fromStatus,
                to_status: toStatus,
                source_name: toOptional(bulkSource),
                type: toOptional(bulkType),
                limit: Math.min(parseInt(bulkLimit) || 100, 500),
                dry_run: true,
            },
            {
                onSuccess: (data) => {
                    setPreviewCount(data.updated_count);
                },
            }
        );
    };

    const handleBulkExecute = () => {
        if (!fromStatus || !toStatus) return;
        bulkStatusMutation.mutate(
            {
                from_status: fromStatus,
                to_status: toStatus,
                source_name: toOptional(bulkSource),
                type: toOptional(bulkType),
                limit: Math.min(parseInt(bulkLimit) || 100, 500),
                dry_run: false,
            },
            {
                onSuccess: () => {
                    setConfirmOpen(false);
                    setPreviewCount(null);
                    setFromStatus('');
                    setToStatus('');
                },
            }
        );
    };

    const aggConfigured = isAggregationConfigured();

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* Retry Pending */}
            <Card className="border-amber-500/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Play className="h-4 w-4 text-amber-500" />
                                Retry Pending Items
                            </CardTitle>
                            <CardDescription>
                                Enqueue media jobs for items stuck in PENDING status
                            </CardDescription>
                        </div>
                        {counts && counts.PENDING > 0 && (
                            <Badge variant="warning" className="text-sm tabular-nums">
                                {counts.PENDING.toLocaleString()} pending
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pending-source">Source (optional)</Label>
                        <Select value={pendingSource} onValueChange={setPendingSource}>
                            <SelectTrigger id="pending-source">
                                <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                {sourceNames.map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pending-limit">Limit</Label>
                        <Input
                            id="pending-limit"
                            type="number"
                            value={pendingLimit}
                            onChange={(e) => setPendingLimit(e.target.value)}
                            min={1}
                            max={500}
                            placeholder="200"
                        />
                        <p className="text-xs text-muted-foreground">Max 500 items per batch</p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleRetryPending}
                        disabled={retryPendingMutation.isPending || !aggConfigured}
                    >
                        {retryPendingMutation.isPending ? 'Enqueuing...' : 'Retry Pending'}
                    </Button>

                    {!aggConfigured && (
                        <p className="text-xs text-muted-foreground text-center">
                            Aggregation service not configured
                        </p>
                    )}

                    {retryPendingMutation.data && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            <p>{retryPendingMutation.data.message}</p>
                            {retryPendingMutation.data.errors.length > 0 && (
                                <p className="text-xs text-destructive mt-1">
                                    {retryPendingMutation.data.errors.length} errors
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Retry Failed */}
            <Card className="border-red-500/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <RotateCcw className="h-4 w-4 text-red-500" />
                                Retry Failed Items
                            </CardTitle>
                            <CardDescription>
                                Reset failed items to PENDING and re-enqueue media jobs
                            </CardDescription>
                        </div>
                        {counts && counts.FAILED > 0 && (
                            <Badge variant="destructive" className="text-sm tabular-nums">
                                {counts.FAILED.toLocaleString()} failed
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="failed-source">Source (optional)</Label>
                        <Select value={failedSource} onValueChange={setFailedSource}>
                            <SelectTrigger id="failed-source">
                                <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                {sourceNames.map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="failed-limit">Limit</Label>
                        <Input
                            id="failed-limit"
                            type="number"
                            value={failedLimit}
                            onChange={(e) => setFailedLimit(e.target.value)}
                            min={1}
                            max={500}
                            placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground">Max 500 items per batch</p>
                    </div>

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleRetryFailed}
                        disabled={retryFailedMutation.isPending || !aggConfigured}
                    >
                        {retryFailedMutation.isPending ? 'Re-queuing...' : 'Retry Failed'}
                    </Button>

                    {!aggConfigured && (
                        <p className="text-xs text-muted-foreground text-center">
                            Aggregation service not configured
                        </p>
                    )}

                    {retryFailedMutation.data && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            <p>{retryFailedMutation.data.message}</p>
                            {retryFailedMutation.data.errors.length > 0 && (
                                <p className="text-xs text-destructive mt-1">
                                    {retryFailedMutation.data.errors.length} errors
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Status Change — full width */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ArrowRightLeft className="h-4 w-4" />
                        Bulk Status Change
                    </CardTitle>
                    <CardDescription>
                        Change the status of content items in bulk with optional filters
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="bulk-from-status">From Status</Label>
                            <Select value={fromStatus} onValueChange={(v) => { setFromStatus(v); setPreviewCount(null); }}>
                                <SelectTrigger id="bulk-from-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s} {counts ? `(${counts[s as keyof typeof counts]?.toLocaleString()})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bulk-to-status">To Status</Label>
                            <Select value={toStatus} onValueChange={(v) => { setToStatus(v); setPreviewCount(null); }}>
                                <SelectTrigger id="bulk-to-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_STATUSES.filter((s) => s !== fromStatus).map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bulk-source">Source (optional)</Label>
                            <Select value={bulkSource} onValueChange={setBulkSource}>
                                <SelectTrigger id="bulk-source">
                                    <SelectValue placeholder="All sources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All sources</SelectItem>
                                    {sourceNames.map((name) => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bulk-type">Content Type (optional)</Label>
                            <Select value={bulkType} onValueChange={setBulkType}>
                                <SelectTrigger id="bulk-type">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    {CONTENT_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="space-y-2 w-32">
                            <Label htmlFor="bulk-limit">Limit</Label>
                            <Input
                                id="bulk-limit"
                                type="number"
                                value={bulkLimit}
                                onChange={(e) => { setBulkLimit(e.target.value); setPreviewCount(null); }}
                                min={1}
                                max={500}
                            />
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleBulkPreview}
                            disabled={!fromStatus || !toStatus || fromStatus === toStatus || bulkStatusMutation.isPending}
                        >
                            Preview
                        </Button>

                        <Button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!fromStatus || !toStatus || fromStatus === toStatus}
                        >
                            Apply Change
                        </Button>

                        {previewCount !== null && (
                            <Badge variant="secondary" className="text-sm h-9 px-3">
                                {previewCount.toLocaleString()} items will be affected
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirm dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Bulk Status Change
                        </DialogTitle>
                        <DialogDescription>
                            This will change up to <strong>{bulkLimit}</strong> items from{' '}
                            <Badge variant="secondary">{fromStatus}</Badge> to{' '}
                            <Badge variant="secondary">{toStatus}</Badge>
                            {bulkSource && bulkSource !== 'all' && <> from source <strong>{bulkSource}</strong></>}
                            {bulkType && bulkType !== 'all' && <> of type <strong>{bulkType}</strong></>}.
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={bulkStatusMutation.isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkExecute} disabled={bulkStatusMutation.isPending}>
                            {bulkStatusMutation.isPending ? 'Updating...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
