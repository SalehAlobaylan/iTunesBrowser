'use client';

import {
    Clock,
    Loader2,
    Newspaper,
    Play,
    Power,
    PowerOff,
    Trash2,
    Video,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SelectionToolbarProps {
    count: number;
    busy: boolean;
    progress?: { completed: number; total: number } | null;
    onClear: () => void;
    onRun: () => void;
    onEnable: () => void;
    onDisable: () => void;
    onChangeInterval: () => void;
    onDelete: () => void;
    /** Optional recategorization (cross-category surfaces only). */
    onMoveToNews?: () => void;
    onMoveToMedia?: () => void;
}

/**
 * Command bar shown when sources are selected — a single rounded surface with a
 * gold selection chip, grouped non-destructive actions, and a separated danger
 * zone. Sticky so it stays reachable while scrolling a long roster.
 */
export function SelectionToolbar({
    count,
    busy,
    progress,
    onClear,
    onRun,
    onEnable,
    onDisable,
    onChangeInterval,
    onDelete,
    onMoveToNews,
    onMoveToMedia,
}: SelectionToolbarProps) {
    if (count === 0) return null;

    const pct = progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
        <div className="sticky top-2 z-20 overflow-hidden rounded-xl border border-gold/40 bg-background/95 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 p-2.5">
                {/* Selection chip */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={busy}
                        aria-label="Clear selection"
                        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-sm font-semibold text-gold">
                        {count} selected
                    </span>
                    {progress && busy && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {progress.completed} / {progress.total}
                        </span>
                    )}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <ActionButton icon={<Play className="h-4 w-4" />} label="Run" onClick={onRun} disabled={busy} />
                    <ActionButton icon={<Power className="h-4 w-4" />} label="Enable" onClick={onEnable} disabled={busy} />
                    <ActionButton icon={<PowerOff className="h-4 w-4" />} label="Disable" onClick={onDisable} disabled={busy} />
                    <ActionButton icon={<Clock className="h-4 w-4" />} label="Interval" onClick={onChangeInterval} disabled={busy} />
                    {(onMoveToNews || onMoveToMedia) && <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />}
                    {onMoveToNews && (
                        <ActionButton icon={<Newspaper className="h-4 w-4" />} label="To News" onClick={onMoveToNews} disabled={busy} />
                    )}
                    {onMoveToMedia && (
                        <ActionButton icon={<Video className="h-4 w-4" />} label="To Media" onClick={onMoveToMedia} disabled={busy} />
                    )}
                    <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onDelete}
                        disabled={busy}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                </div>
            </div>
            {/* Progress sliver */}
            {busy && (
                <div className="h-0.5 w-full bg-muted">
                    <div
                        className="h-full bg-gold transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Button type="button" size="sm" variant="ghost" onClick={onClick} disabled={disabled}>
            <span className="mr-1.5">{icon}</span>
            {label}
        </Button>
    );
}
