'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ENRICHMENT_BATCH_LIMIT } from '@/lib/api/cms/enrichment';

interface BulkReEnrichDialogProps {
    open: boolean;
    count: number;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
}

export function BulkReEnrichDialog({
    open,
    count,
    onClose,
    onConfirm,
    isSubmitting,
}: BulkReEnrichDialogProps) {
    const batches = Math.ceil(count / ENRICHMENT_BATCH_LIMIT);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Re-enrich {count} item{count === 1 ? '' : 's'}?</DialogTitle>
                    <DialogDescription>
                        Re-runs transcript, embedding, and news classification for the
                        selected items.
                        {batches > 1 && (
                            <>
                                {' '}
                                The backend caps each batch at{' '}
                                <strong>{ENRICHMENT_BATCH_LIMIT}</strong>, so this will be
                                split into{' '}
                                <strong>{batches}</strong> sequential calls.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Triggering…' : `Re-enrich ${count}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
