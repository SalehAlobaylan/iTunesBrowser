'use client';

import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CONTENT_STATUS_LABELS } from '@/types/platform/content';
import type { ContentStatus } from '@/types/platform/content';

const STATUS_OPTIONS: ContentStatus[] = [
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED',
    'ARCHIVED',
];

interface BulkSetStatusDialogProps {
    open: boolean;
    count: number;
    onClose: () => void;
    onSubmit: (status: ContentStatus) => void;
    isSubmitting?: boolean;
}

export function BulkSetStatusDialog({
    open,
    count,
    onClose,
    onSubmit,
    isSubmitting,
}: BulkSetStatusDialogProps) {
    const [target, setTarget] = useState<ContentStatus>('READY');

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change status</DialogTitle>
                    <DialogDescription>
                        Apply a new status to {count} selected item{count === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="bulk_status">Target status</Label>
                    <Select
                        value={target}
                        onValueChange={(v) => setTarget(v as ContentStatus)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="bulk_status">
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
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(target)} disabled={isSubmitting}>
                        {isSubmitting ? 'Updating…' : 'Apply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
