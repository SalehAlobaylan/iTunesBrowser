'use client';

import { Play, Power, PowerOff, Clock, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionBarProps {
    count: number;
    busy: boolean;
    progress?: { completed: number; total: number } | null;
    onClear: () => void;
    onRun: () => void;
    onEnable: () => void;
    onDisable: () => void;
    onChangeInterval: () => void;
    onDelete: () => void;
}

export function BulkActionBar({
    count,
    busy,
    progress,
    onClear,
    onRun,
    onEnable,
    onDisable,
    onChangeInterval,
    onDelete,
}: BulkActionBarProps) {
    if (count === 0) return null;

    return (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    disabled={busy}
                    aria-label="Clear selection"
                >
                    <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{count} selected</span>
                {progress && busy && (
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {progress.completed} / {progress.total}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={onRun} disabled={busy}>
                    <Play className="mr-2 h-4 w-4" /> Run
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onEnable} disabled={busy}>
                    <Power className="mr-2 h-4 w-4" /> Enable
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onDisable} disabled={busy}>
                    <PowerOff className="mr-2 h-4 w-4" /> Disable
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onChangeInterval}
                    disabled={busy}
                >
                    <Clock className="mr-2 h-4 w-4" /> Change interval…
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={busy}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
        </div>
    );
}
