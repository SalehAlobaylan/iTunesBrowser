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
import { listSourceNames } from '@/lib/api/cms/content';
import { useBulkSetContentStatus } from '@/hooks/use-content';
import { CONTENT_STATUS_LABELS } from '@/types/platform/content';
import type { ContentStatus } from '@/types/platform/content';

const STATUS_OPTIONS: ContentStatus[] = [
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED',
    'ARCHIVED',
];

interface BulkChangeStatusDialogProps {
    open: boolean;
    onClose: () => void;
}

export function BulkChangeStatusDialog({ open, onClose }: BulkChangeStatusDialogProps) {
    const mutation = useBulkSetContentStatus();
    const [sourceNames, setSourceNames] = useState<string[]>([]);
    const [fromStatus, setFromStatus] = useState<ContentStatus>('FAILED');
    const [toStatus, setToStatus] = useState<ContentStatus>('PENDING');
    const [sourceName, setSourceName] = useState<string>('');
    const [limit, setLimit] = useState<string>('100');

    useEffect(() => {
        if (open) {
            listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
        }
    }, [open]);

    const limitNum = Number(limit);
    const valid =
        fromStatus !== toStatus && Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 500;

    const submit = () => {
        if (!valid) return;
        mutation.mutate(
            {
                from_status: fromStatus,
                to_status: toStatus,
                source_name: sourceName || undefined,
                limit: limitNum,
            },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk change status</DialogTitle>
                    <DialogDescription>
                        Move all items matching <code>from</code> (and optional source) to
                        a new status. Server caps each call at 500.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>From</Label>
                        <Select
                            value={fromStatus}
                            onValueChange={(v) => setFromStatus(v as ContentStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {CONTENT_STATUS_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>To</Label>
                        <Select
                            value={toStatus}
                            onValueChange={(v) => setToStatus(v as ContentStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem
                                        key={s}
                                        value={s}
                                        disabled={s === fromStatus}
                                    >
                                        {CONTENT_STATUS_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
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
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Limit</Label>
                        <Input
                            type="number"
                            min={1}
                            max={500}
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum number of rows updated by this call (1–500).
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!valid || mutation.isPending}>
                        {mutation.isPending ? 'Updating…' : 'Apply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
