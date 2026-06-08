// Media Studio types — per-item transcript + chapter editor.

export type ChapterSource = 'youtube' | 'derived' | 'manual';

export interface StudioSegment {
    start: number; // seconds
    end: number;
    text: string;
}

export interface StudioChapter {
    id?: string; // server id (absent for unsaved working-set chapters)
    title: string;
    summary?: string | null;
    start_ms: number;
    end_ms: number;
    source: ChapterSource;
}

export interface HeatmapPoint {
    start: number; // seconds
    end: number;
    value: number; // 0..1 (relative replay intensity)
}

export interface SponsorSegment {
    start: number; // seconds
    end: number;
    category: string;
}

export interface StudioContent {
    id: string;
    type: string;
    title: string;
    status: string;
    media_url?: string;
    thumbnail_url?: string;
    duration_sec?: number;
    caption_state?: string;
    // Download-time engagement signals (YouTube "most replayed" + SponsorBlock).
    heatmap?: HeatmapPoint[];
    sponsor_segments?: SponsorSegment[];
}

export interface StudioTranscript {
    transcript_id: string;
    full_text: string;
    language?: string;
    segments: StudioSegment[];
}

export interface StudioData {
    content: StudioContent;
    transcript: StudioTranscript | null;
    chapters: StudioChapter[];
}

export type GenerateMode = 'auto' | 'count' | 'duration';

export interface GenerateChaptersRequest {
    mode: GenerateMode;
    target_count?: number;
    target_duration_sec?: number;
    min_sec?: number;
    max_sec?: number;
    with_summary?: boolean;
}

export const CHAPTER_SOURCE_LABELS: Record<ChapterSource, string> = {
    youtube: 'YouTube',
    derived: 'AI',
    manual: 'Manual',
};

// One-line explanations shown as legend hints + badge tooltips so operators
// understand where each chapter came from.
export const CHAPTER_SOURCE_HINTS: Record<ChapterSource, string> = {
    youtube: "From the video's own YouTube chapters (creator-provided, title only).",
    derived: 'AI-generated from the transcript — review before saving.',
    manual: 'Created or edited by hand in the studio.',
};

// Swatch classes matching the timeline block colors, for the legend.
export const CHAPTER_SOURCE_SWATCH: Record<ChapterSource, string> = {
    youtube: 'bg-red-500/40',
    derived: 'bg-primary/40',
    manual: 'bg-emerald-500/40',
};
