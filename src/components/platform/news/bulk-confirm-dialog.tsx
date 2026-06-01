'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface BulkConfirmConfig {
    title: string;
    actionLabel: string;
    destructive?: boolean;
    /** Noun for the affected rows, e.g. "article". */
    noun?: string;
    /** Returns the affected count (dry run). */
    preview: () => Promise<number>;
    /** Commits the action. */
    commit: () => Promise<unknown>;
}

interface BulkConfirmDialogProps {
    config: BulkConfirmConfig | null;
    onClose: () => void;
    onDone?: () => void;
}

/**
 * Generic "preview the count, then confirm" dialog for filter-based bulk
 * actions. On open it runs the dry-run preview; the confirm button commits.
 */
export function BulkConfirmDialog({ config, onClose, onDone }: BulkConfirmDialogProps) {
    const [count, setCount] = useState<number | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [committing, setCommitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!config) {
            setCount(null);
            return;
        }
        setPreviewing(true);
        setCount(null);
        config
            .preview()
            .then((n) => !cancelled && setCount(n))
            .catch(() => !cancelled && setCount(null))
            .finally(() => !cancelled && setPreviewing(false));
        return () => {
            cancelled = true;
        };
    }, [config]);

    const onConfirm = async () => {
        if (!config) return;
        setCommitting(true);
        try {
            await config.commit();
            onDone?.();
            onClose();
        } finally {
            setCommitting(false);
        }
    };

    const noun = config?.noun ?? 'item';
    const plural = count === 1 ? '' : 's';

    return (
        <Dialog open={Boolean(config)} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{config?.title}</DialogTitle>
                    <DialogDescription>
                        {previewing
                            ? 'Counting matching items…'
                            : count === null
                              ? 'Could not preview the count — you can still proceed.'
                              : `${config?.actionLabel} ${count.toLocaleString()} ${noun}${plural}.`}
                        {config?.destructive && count !== null && count > 0
                            ? ' This cannot be undone.'
                            : ''}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={committing}>
                        Cancel
                    </Button>
                    <Button
                        variant={config?.destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={previewing || committing || count === 0}
                    >
                        {committing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {config?.actionLabel}
                        {count ? ` ${count.toLocaleString()}` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
