'use client';

import { ListChecks, Sparkles, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentBulkActionBarProps {
    count: number;
    busy: boolean;
    progress?: { completed: number; total: number } | null;
    onClear: () => void;
    onSetStatus: () => void;
    onReEnrich: () => void;
    onDelete: () => void;
}

export function ContentBulkActionBar({
    count,
    busy,
    progress,
    onClear,
    onSetStatus,
    onReEnrich,
    onDelete,
}: ContentBulkActionBarProps) {
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
                {progress && busy && progress.total > 0 && (
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {progress.completed} / {progress.total}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onSetStatus}
                    disabled={busy}
                >
                    <ListChecks className="mr-2 h-4 w-4" /> Set status…
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onReEnrich}
                    disabled={busy}
                >
                    <Sparkles className="mr-2 h-4 w-4" /> Re-enrich
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
