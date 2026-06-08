'use client';

import { useRef, useState } from 'react';
import type { StudioChapter } from '@/types/platform/studio';
import { formatMs } from '@/lib/studio/chapters';
import { cn } from '@/lib/utils';

interface TimelineProps {
    chapters: StudioChapter[]; // sorted, ends derived
    durationMs: number;
    currentMs: number;
    onSeek: (ms: number) => void;
    onMoveBoundary: (index: number, newStartMs: number) => void;
}

const SOURCE_COLORS: Record<string, string> = {
    youtube: 'bg-red-500/25 border-red-500/40',
    derived: 'bg-primary/20 border-primary/40',
    manual: 'bg-emerald-500/20 border-emerald-500/40',
};

/**
 * Duration-scaled chapter track with a playhead, click-to-seek, and draggable
 * boundary handles. Pure pointer events — no DnD library.
 */
export function Timeline({ chapters, durationMs, currentMs, onSeek, onMoveBoundary }: TimelineProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    if (durationMs <= 0) {
        return (
            <div className="flex h-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                Waiting for media duration…
            </div>
        );
    }

    const pct = (ms: number) => `${Math.min(100, Math.max(0, (ms / durationMs) * 100))}%`;
    const msFromClientX = (clientX: number): number => {
        const rect = trackRef.current!.getBoundingClientRect();
        const ratio = (clientX - rect.left) / rect.width;
        return Math.min(durationMs, Math.max(0, ratio * durationMs));
    };

    return (
        <div className="space-y-1">
            <div
                ref={trackRef}
                className="relative h-12 w-full cursor-pointer select-none overflow-hidden rounded-md border bg-muted/40"
                onPointerDown={(e) => {
                    if (dragIndex !== null) return; // a handle is being dragged
                    onSeek(msFromClientX(e.clientX));
                }}
            >
                {/* Chapter blocks */}
                {chapters.map((ch, i) => {
                    const left = (ch.start_ms / durationMs) * 100;
                    const width = ((ch.end_ms - ch.start_ms) / durationMs) * 100;
                    return (
                        <div
                            key={ch.id ?? `c${i}`}
                            className={cn(
                                'absolute top-0 flex h-full items-center overflow-hidden border-r px-1.5 text-[11px] font-medium',
                                SOURCE_COLORS[ch.source] ?? SOURCE_COLORS.manual
                            )}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${ch.title} (${formatMs(ch.start_ms)}–${formatMs(ch.end_ms)})`}
                        >
                            <span className="truncate">{ch.title}</span>
                        </div>
                    );
                })}

                {/* Draggable boundary handles (skip the first — pinned at 0) */}
                {chapters.map((ch, i) =>
                    i === 0 ? null : (
                        <div
                            key={`h${ch.id ?? i}`}
                            role="separator"
                            className="absolute top-0 z-10 h-full w-2 -translate-x-1/2 cursor-ew-resize bg-foreground/50 hover:bg-foreground"
                            style={{ left: pct(ch.start_ms) }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                setDragIndex(i);
                            }}
                            onPointerMove={(e) => {
                                if (dragIndex !== i) return;
                                onMoveBoundary(i, msFromClientX(e.clientX));
                            }}
                            onPointerUp={(e) => {
                                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                                setDragIndex(null);
                            }}
                        />
                    )
                )}

                {/* Playhead */}
                <div
                    className="pointer-events-none absolute top-0 z-20 h-full w-0.5 bg-red-600"
                    style={{ left: pct(currentMs) }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>0:00</span>
                <span>{formatMs(durationMs)}</span>
            </div>
        </div>
    );
}
