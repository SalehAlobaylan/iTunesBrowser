'use client';

import { useEffect, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from '@/components/ui/toast';
import { listSourceNames } from '@/lib/api/cms/content';
import { retryFailed, retryPending } from '@/lib/api/aggregation';
import { useQueryClient } from '@tanstack/react-query';
import { contentKeys } from '@/hooks/use-content';

type Mode = 'failed' | 'pending';

interface RetryJobsDialogProps {
    open: boolean;
    mode: Mode;
    onClose: () => void;
}

const COPY: Record<Mode, { title: string; description: string; verb: string }> = {
    failed: {
        title: 'Retry failed jobs',
        description:
            'Re-queues content currently in FAILED state through the aggregation pipeline.',
        verb: 'Retry failed',
    },
    pending: {
        title: 'Retry pending jobs',
        description:
            'Re-queues content currently in PENDING state. Useful when items are stuck waiting.',
        verb: 'Retry pending',
    },
};

export function RetryJobsDialog({ open, mode, onClose }: RetryJobsDialogProps) {
    const queryClient = useQueryClient();
    const [sourceNames, setSourceNames] = useState<string[]>([]);
    const [sourceName, setSourceName] = useState<string>('');
    const [limit, setLimit] = useState<string>('50');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
        }
    }, [open]);

    const limitNum = Number(limit);
    const valid = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 500;
    const copy = COPY[mode];

    const submit = async () => {
        if (!valid) return;
        const fn = mode === 'failed' ? retryFailed : retryPending;
        setBusy(true);
        try {
            const res = await fn({
                source: sourceName || undefined,
                limit: limitNum,
            });
            toast({
                title: 'Jobs requeued',
                description: `${res.requeued} of ${res.total} requeued. ${res.message}`,
                variant: 'success',
            });
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contentKeys.statusCounts() });
            onClose();
        } catch (err) {
            toast({
                title: 'Retry failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{copy.title}</DialogTitle>
                    <DialogDescription>{copy.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Source (optional)</Label>
                        <Select
                            value={sourceName || 'all'}
                            onValueChange={(v) => setSourceName(v === 'all' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                {sourceNames.map((n) => (
                                    <SelectItem key={n} value={n}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Limit</Label>
                        <Input
                            type="number"
                            min={1}
                            max={500}
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum items to requeue (1–500).
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!valid || busy}>
                        {busy ? 'Working…' : copy.verb}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
