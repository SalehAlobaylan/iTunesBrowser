'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { StudioSegment } from '@/types/platform/studio';
import { formatMs } from '@/lib/studio/chapters';
import { cn } from '@/lib/utils';

interface TranscriptPanelProps {
    segments: StudioSegment[];
    currentMs: number;
    onSeek: (ms: number) => void;
    onEditSegment: (index: number, text: string) => void;
}

/**
 * Scrollable transcript synced to playback. Click a timestamp to seek; click the
 * pencil to edit a segment's text (light editing). One row edits at a time.
 */
export function TranscriptPanel({ segments, currentMs, onSeek, onEditSegment }: TranscriptPanelProps) {
    const [editing, setEditing] = useState<number | null>(null);
    const [draft, setDraft] = useState('');

    if (segments.length === 0) {
        return <p className="text-sm text-muted-foreground">No transcript segments.</p>;
    }

    const activeIndex = segments.findIndex(
        (s) => currentMs >= s.start * 1000 && currentMs < s.end * 1000
    );

    return (
        <div className="max-h-[60vh] space-y-0.5 overflow-y-auto rounded-md border p-2">
            {segments.map((seg, i) => {
                const isActive = i === activeIndex;
                const isEditing = editing === i;
                return (
                    <div
                        key={i}
                        className={cn(
                            'group flex gap-2 rounded px-2 py-1 text-sm',
                            isActive && 'bg-primary/10'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSeek(seg.start * 1000)}
                            className="shrink-0 pt-0.5 font-mono text-xs text-muted-foreground hover:text-foreground tabular-nums"
                        >
                            {formatMs(seg.start * 1000)}
                        </button>
                        {isEditing ? (
                            <textarea
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onBlur={() => {
                                    onEditSegment(i, draft);
                                    setEditing(null);
                                }}
                                rows={2}
                                className="flex-1 resize-none rounded border bg-background p-1 text-sm"
                            />
                        ) : (
                            <>
                                <span className="flex-1 leading-snug" dir="auto">
                                    {seg.text}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft(seg.text);
                                        setEditing(i);
                                    }}
                                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                    title="Edit text"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </button>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
