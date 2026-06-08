'use client';

import {
    CHAPTER_SOURCE_HINTS,
    CHAPTER_SOURCE_LABELS,
    CHAPTER_SOURCE_SWATCH,
    type ChapterSource,
} from '@/types/platform/studio';
import { cn } from '@/lib/utils';

const ORDER: ChapterSource[] = ['youtube', 'derived', 'manual'];

/**
 * Explains what each chapter color/source means so operators can tell at a
 * glance whether a chapter is the creator's, AI-generated, or hand-edited.
 */
export function SourceLegend() {
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-md border bg-muted/30 px-3 py-2 text-xs">
            {ORDER.map((src) => (
                <div key={src} className="flex items-center gap-1.5" title={CHAPTER_SOURCE_HINTS[src]}>
                    <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', CHAPTER_SOURCE_SWATCH[src])} />
                    <span className="font-medium">{CHAPTER_SOURCE_LABELS[src]}</span>
                    <span className="text-muted-foreground">— {CHAPTER_SOURCE_HINTS[src]}</span>
                </div>
            ))}
        </div>
    );
}
