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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BulkIntervalDialogProps {
    open: boolean;
    count: number;
    onClose: () => void;
    onSubmit: (minutes: number) => void;
    isSubmitting?: boolean;
}

export function BulkIntervalDialog({
    open,
    count,
    onClose,
    onSubmit,
    isSubmitting,
}: BulkIntervalDialogProps) {
    const [value, setValue] = useState<string>('60');
    const minutes = Number(value);
    const valid = Number.isFinite(minutes) && minutes >= 1;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change fetch interval</DialogTitle>
                    <DialogDescription>
                        Apply a new fetch interval to {count} selected source
                        {count === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="bulk_interval">Interval (minutes)</Label>
                    <Input
                        id="bulk_interval"
                        type="number"
                        min={1}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={isSubmitting}
                    />
                    {!valid && value !== '' && (
                        <p className="text-xs text-destructive">Must be 1 or higher.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => valid && onSubmit(minutes)}
                        disabled={!valid || isSubmitting}
                    >
                        {isSubmitting ? 'Updating…' : 'Apply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
