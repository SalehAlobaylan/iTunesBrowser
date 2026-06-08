'use client';

import { type RefObject } from 'react';

interface PlayerProps {
    src?: string;
    poster?: string;
    mediaRef: RefObject<HTMLVideoElement | null>;
    onTimeMs: (ms: number) => void;
    onDurationMs: (ms: number) => void;
}

/**
 * Native <video> (also used for audio-only items — the poster shows while audio
 * plays). The parent owns the ref so the timeline/transcript can seek it.
 */
export function StudioPlayer({ src, poster, mediaRef, onTimeMs, onDurationMs }: PlayerProps) {
    if (!src) {
        return (
            <div className="flex h-48 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
                No media URL for this item.
            </div>
        );
    }
    return (
        <video
            ref={mediaRef}
            src={src}
            poster={poster}
            controls
            className="max-h-[60vh] w-full rounded-md bg-black"
            onTimeUpdate={(e) => onTimeMs(e.currentTarget.currentTime * 1000)}
            onLoadedMetadata={(e) => onDurationMs((e.currentTarget.duration || 0) * 1000)}
        />
    );
}
