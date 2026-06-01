'use client';

import { X, Loader2, Trash2, Star, FolderInput } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type BulkScope = 'page' | 'all';

interface NewsBulkBarProps {
    scope: BulkScope;
    pageCount: number;
    matchingTotal: number;
    /** Whether "select all matching" is offerable (no free-text search active). */
    canSelectAll: boolean;
    busy: boolean;
    onScope: (s: BulkScope) => void;
    onClear: () => void;
    primaryLabel?: string | null;
    onPrimary?: () => void;
    onDelete: () => void;
    /** Feature is small-N only — provided only for page-scope READY selections. */
    onFeature?: () => void;
    onMove: () => void;
}

export function NewsBulkBar({
    scope,
    pageCount,
    matchingTotal,
    canSelectAll,
    busy,
    onScope,
    onClear,
    primaryLabel,
    onPrimary,
    onDelete,
    onFeature,
    onMove,
}: NewsBulkBarProps) {
    if (pageCount === 0) return null;

    const allSelected = scope === 'all';
    const effective = allSelected ? matchingTotal : pageCount;
    const canUpgrade = canSelectAll && !allSelected && matchingTotal > pageCount;

    return (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-md border bg-background/95 p-2 shadow-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} disabled={busy} aria-label="Clear">
                <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
                {allSelected ? `All ${matchingTotal.toLocaleString()}` : `${pageCount} selected`}
            </span>
            {canUpgrade && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onScope('all')}>
                    Select all {matchingTotal.toLocaleString()}
                </Button>
            )}
            {allSelected && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onScope('page')}>
                    Page only
                </Button>
            )}
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

            <div className="ml-auto flex items-center gap-1.5">
                {primaryLabel && onPrimary && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={onPrimary}>
                        {primaryLabel} {effective.toLocaleString()}
                    </Button>
                )}
                {onFeature && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={onFeature} aria-label="Feature">
                        <Star className="h-4 w-4" />
                    </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={onMove} aria-label="Move to topic">
                    <FolderInput className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
