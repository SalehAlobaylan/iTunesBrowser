'use client';

import { useState } from 'react';
import { History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { archiveNewsOlderThan, deleteNewsOlderThan } from '@/lib/api/cms/news';
import { useRotateOlderThan } from '@/hooks/use-news';
import type { RotateMode } from '@/types/platform/news';

/** Header action for the Live column: bulk-retire stories older than N days. */
export function RotateOutButton({ busy = false }: { busy?: boolean }) {
    const [open, setOpen] = useState(false);
    const [days, setDays] = useState(7);
    const [mode, setMode] = useState<RotateMode>('archive');
    const [previewing, setPreviewing] = useState(false);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    const rotate = useRotateOlderThan();

    const runPreview = async () => {
        setPreviewing(true);
        setPreviewCount(null);
        try {
            const res =
                mode === 'archive'
                    ? await archiveNewsOlderThan(days, true)
                    : await deleteNewsOlderThan(days, true);
            setPreviewCount(
                'updated_count' in res ? res.updated_count : res.deleted_count
            );
        } catch {
            setPreviewCount(null);
        } finally {
            setPreviewing(false);
        }
    };

    const onOpenChange = (o: boolean) => {
        setOpen(o);
        if (o) void runPreview();
        else setPreviewCount(null);
    };

    const confirm = () => {
        rotate.mutate(
            { days, mode },
            { onSuccess: () => setOpen(false) }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={busy} aria-label="Rotate out old news">
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rotate out old news</DialogTitle>
                    <DialogDescription>
                        Retire live stories beyond a chosen age in one step.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Older than</span>
                    <Input
                        type="number"
                        min={0}
                        value={days}
                        onChange={(e) => {
                            setDays(Math.max(0, Number(e.target.value)));
                            setPreviewCount(null);
                        }}
                        onBlur={runPreview}
                        className="w-20"
                        aria-label="Days"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                    <Select
                        value={mode}
                        onValueChange={(v) => {
                            setMode(v as RotateMode);
                            setPreviewCount(null);
                        }}
                    >
                        <SelectTrigger className="w-[170px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="archive">Archive (recoverable)</SelectItem>
                            <SelectItem value="delete">Delete (permanent)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={runPreview} disabled={previewing}>
                        Preview
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                    {previewing
                        ? 'Counting matching articles…'
                        : previewCount === null
                          ? 'Set an age and preview to see how many will be affected.'
                          : `${previewCount} article${previewCount === 1 ? '' : 's'} older than ${days} day${days === 1 ? '' : 's'} will be ${mode === 'archive' ? 'archived' : 'permanently deleted'}.`}
                    {mode === 'delete' && previewCount !== null && previewCount > 0 && ' This cannot be undone.'}
                </p>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant={mode === 'delete' ? 'destructive' : 'default'}
                        onClick={confirm}
                        disabled={previewing || rotate.isPending || previewCount === 0}
                    >
                        {rotate.isPending
                            ? 'Working…'
                            : `${mode === 'archive' ? 'Archive' : 'Delete'}${previewCount ? ` ${previewCount}` : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
