'use client';

import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Pencil, Search } from 'lucide-react';
import type { StudioSegment } from '@/types/platform/studio';
import { formatMs } from '@/lib/studio/chapters';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TranscriptPanelProps {
    segments: StudioSegment[];
    currentMs: number;
    onSeek: (ms: number) => void;
    onEditSegment: (index: number, text: string) => void;
    searchInputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Scrollable transcript synced to playback. Click a timestamp to seek; click the
 * pencil to edit a segment's text (light editing). One row edits at a time.
 */
export function TranscriptPanel({ segments, currentMs, onSeek, onEditSegment, searchInputRef }: TranscriptPanelProps) {
    const [editing, setEditing] = useState<number | null>(null);
    const [draft, setDraft] = useState('');
    const [query, setQuery] = useState('');
    const activeRef = useRef<HTMLDivElement | null>(null);

    const activeIndex = segments.findIndex(
        (s) => currentMs >= s.start * 1000 && currentMs < s.end * 1000
    );
    const normalizedQuery = query.trim().toLowerCase();
    const visibleSegments = useMemo(
        () => segments
            .map((seg, index) => ({ seg, index }))
            .filter(({ seg }) => !normalizedQuery || seg.text.toLowerCase().includes(normalizedQuery)),
        [segments, normalizedQuery]
    );

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    if (segments.length === 0) {
        return <p className="text-sm text-muted-foreground">No transcript segments.</p>;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search transcript"
                        className="h-8 pl-8"
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        if (activeIndex >= 0) {
                            onSeek(segments[activeIndex].start * 1000);
                            activeRef.current?.scrollIntoView({ block: 'center' });
                        }
                    }}
                    disabled={activeIndex < 0}
                    title="Jump to current segment"
                >
                    <Crosshair className="h-3.5 w-3.5" />
                </Button>
            </div>
            <div className="max-h-[60vh] space-y-0.5 overflow-y-auto rounded-md border p-2">
                {visibleSegments.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No transcript matches.</p>
                )}
                {visibleSegments.map(({ seg, index: i }) => {
                    const isActive = i === activeIndex;
                    const isEditing = editing === i;
                    return (
                        <div
                            key={i}
                            ref={isActive ? activeRef : undefined}
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
        </div>
    );
}
