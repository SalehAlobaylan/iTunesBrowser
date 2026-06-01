'use client';

import { useState } from 'react';
import { Archive, Trash2, Undo2, Send, X, History } from 'lucide-react';

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
} from '@/components/ui/dialog';
import { archiveNewsOlderThan, deleteNewsOlderThan } from '@/lib/api/cms/news';
import type { NewsView, RotateMode } from '@/types/platform/news';

interface RotateToolbarProps {
    view: NewsView;
    selectedCount: number;
    busy: boolean;
    onClearSelection: () => void;
    onArchiveSelected: () => void;
    onRestoreSelected: () => void;
    onPromoteSelected: () => void;
    onDeleteSelected: () => void;
    onRotateOlderThan: (days: number, mode: RotateMode) => void;
}

export function RotateToolbar({
    view,
    selectedCount,
    busy,
    onClearSelection,
    onArchiveSelected,
    onRestoreSelected,
    onPromoteSelected,
    onDeleteSelected,
    onRotateOlderThan,
}: RotateToolbarProps) {
    const [days, setDays] = useState(7);
    const [mode, setMode] = useState<RotateMode>('archive');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    const openConfirm = async () => {
        setPreviewing(true);
        setPreviewCount(null);
        setConfirmOpen(true);
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

    const confirm = () => {
        onRotateOlderThan(days, mode);
        setConfirmOpen(false);
    };

    return (
        <div className="space-y-3">
            {/* Selection bar */}
            {selectedCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">
                        {selectedCount} selected
                    </span>
                    <div className="mx-1 h-4 w-px bg-border" />
                    {view === 'PENDING' && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={onPromoteSelected}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                        </Button>
                    )}
                    {view === 'READY' && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={onArchiveSelected}
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                        </Button>
                    )}
                    {view === 'ARCHIVED' && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={onRestoreSelected}
                        >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Restore
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={onDeleteSelected}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        onClick={onClearSelection}
                    >
                        <X className="mr-1 h-4 w-4" />
                        Clear
                    </Button>
                </div>
            )}

            {/* Rotate-out-older-than control (only meaningful for the live feed) */}
            {view === 'READY' && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Rotate out older than</span>
                    <Input
                        type="number"
                        min={0}
                        value={days}
                        onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
                        className="w-20"
                        aria-label="Days"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                    <Select value={mode} onValueChange={(v) => setMode(v as RotateMode)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="archive">Archive (recoverable)</SelectItem>
                            <SelectItem value="delete">Delete (permanent)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        variant={mode === 'delete' ? 'destructive' : 'default'}
                        disabled={busy}
                        onClick={openConfirm}
                    >
                        Rotate out…
                    </Button>
                </div>
            )}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'archive' ? 'Archive' : 'Permanently delete'} old news
                        </DialogTitle>
                        <DialogDescription>
                            {previewing
                                ? 'Counting matching articles…'
                                : previewCount === null
                                  ? 'Could not preview the count — you can still proceed.'
                                  : `This will ${mode === 'archive' ? 'archive' : 'permanently delete'} ${previewCount} article${previewCount === 1 ? '' : 's'} older than ${days} day${days === 1 ? '' : 's'}.`}
                            {mode === 'delete' && ' This cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={mode === 'delete' ? 'destructive' : 'default'}
                            disabled={previewing || busy || previewCount === 0}
                            onClick={confirm}
                        >
                            {mode === 'archive' ? 'Archive' : 'Delete'}
                            {previewCount ? ` ${previewCount}` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
