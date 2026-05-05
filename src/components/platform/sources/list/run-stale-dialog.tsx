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
import type { ContentSource } from '@/types/platform/source';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';

interface RunStaleDialogProps {
    open: boolean;
    sources: ContentSource[];
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
}

export function RunStaleDialog({
    open,
    sources,
    onClose,
    onConfirm,
    isSubmitting,
}: RunStaleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Run all stale sources</DialogTitle>
                    <DialogDescription>
                        {sources.length === 0
                            ? 'No sources are currently stale.'
                            : `These ${sources.length} active sources are past their fetch interval.
                               They will be run sequentially.`}
                    </DialogDescription>
                </DialogHeader>

                {sources.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-md border">
                        <ul className="divide-y text-sm">
                            {sources.map((s) => (
                                <li key={s.id} className="flex items-center justify-between px-3 py-2">
                                    <span className="truncate font-medium">{s.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {SOURCE_TYPE_LABELS[s.type]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={sources.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Running…' : `Run ${sources.length}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
