'use client';

import { Plus, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { StudioChapter } from '@/types/platform/studio';
import { CHAPTER_SOURCE_LABELS, CHAPTER_SOURCE_HINTS } from '@/types/platform/studio';
import { formatMs } from '@/lib/studio/chapters';

interface ChapterListProps {
    chapters: StudioChapter[]; // sorted, ends derived
    onSeek: (ms: number) => void;
    onAddAtPlayhead: () => void;
    onUpdate: (index: number, patch: Partial<Pick<StudioChapter, 'title' | 'summary'>>) => void;
    onDelete: (index: number) => void;
}

/**
 * Editable chapter list. "Add at playhead" inserts a boundary (also serves as
 * split); deleting a chapter merges its region into the previous one.
 */
export function ChapterList({
    chapters,
    onSeek,
    onAddAtPlayhead,
    onUpdate,
    onDelete,
}: ChapterListProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Chapters ({chapters.length})</h3>
                <Button size="sm" variant="outline" onClick={onAddAtPlayhead}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add at playhead
                </Button>
            </div>

            {chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No chapters yet. Generate them or add one at the playhead.
                </p>
            ) : (
                <div className="space-y-2">
                    {chapters.map((ch, i) => (
                        <div key={ch.id ?? `c${i}`} className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSeek(ch.start_ms)}
                                    className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground tabular-nums"
                                    title="Jump to start"
                                >
                                    <Play className="h-3 w-3" />
                                    {formatMs(ch.start_ms)}–{formatMs(ch.end_ms)}
                                </button>
                                <Badge
                                    variant="secondary"
                                    className="shrink-0 cursor-help"
                                    title={CHAPTER_SOURCE_HINTS[ch.source]}
                                >
                                    {CHAPTER_SOURCE_LABELS[ch.source]}
                                </Badge>
                                <div className="flex-1" />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => onDelete(i)}
                                    title="Delete (merges into previous)"
                                    disabled={i === 0}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <Input
                                value={ch.title}
                                onChange={(e) => onUpdate(i, { title: e.target.value })}
                                placeholder="Chapter title"
                                dir="auto"
                            />
                            <Input
                                value={ch.summary ?? ''}
                                onChange={(e) => onUpdate(i, { summary: e.target.value })}
                                placeholder="Short summary (optional)"
                                dir="auto"
                                className="text-sm text-muted-foreground"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
