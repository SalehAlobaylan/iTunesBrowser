import type { StudioChapter } from '@/types/platform/studio';

const MIN_GAP_MS = 1000; // keep boundaries at least 1s apart

/** Recompute end_ms from the next chapter's start (last = media duration). */
export function deriveEnds(chapters: StudioChapter[], durationMs: number): StudioChapter[] {
    const sorted = [...chapters].sort((a, b) => a.start_ms - b.start_ms);
    return sorted.map((c, i) => ({
        ...c,
        end_ms: i + 1 < sorted.length ? sorted[i + 1].start_ms : durationMs > 0 ? durationMs : c.start_ms,
    }));
}

/** Sort, lock first chapter to 0, and derive ends. Call after every edit. */
export function normalize(chapters: StudioChapter[], durationMs: number): StudioChapter[] {
    const sorted = [...chapters].sort((a, b) => a.start_ms - b.start_ms);
    if (sorted.length > 0) sorted[0] = { ...sorted[0], start_ms: 0 };
    return deriveEnds(sorted, durationMs);
}

/** Insert a new boundary at startMs (used by "add chapter" and "split at playhead"). */
export function addChapterAt(
    chapters: StudioChapter[],
    startMs: number,
    durationMs: number,
    title = 'New chapter'
): StudioChapter[] {
    const at = Math.max(0, Math.round(startMs));
    if (chapters.some((c) => Math.abs(c.start_ms - at) < MIN_GAP_MS)) return chapters;
    return normalize(
        [...chapters, { title, summary: null, start_ms: at, end_ms: 0, source: 'manual' }],
        durationMs
    );
}

/** Remove a chapter (its region merges into the previous chapter). */
export function deleteChapterAt(
    chapters: StudioChapter[],
    index: number,
    durationMs: number
): StudioChapter[] {
    return normalize(chapters.filter((_, i) => i !== index), durationMs);
}

/** Move a chapter's start boundary, clamped between its neighbours. First is locked at 0. */
export function moveBoundary(
    chapters: StudioChapter[],
    index: number,
    newStartMs: number,
    durationMs: number
): StudioChapter[] {
    if (index <= 0) return chapters; // first chapter is pinned to 0
    const sorted = [...chapters].sort((a, b) => a.start_ms - b.start_ms);
    const prev = sorted[index - 1].start_ms;
    const next = index + 1 < sorted.length ? sorted[index + 1].start_ms : durationMs > 0 ? durationMs : newStartMs + MIN_GAP_MS;
    const clamped = Math.min(Math.max(Math.round(newStartMs), prev + MIN_GAP_MS), next - MIN_GAP_MS);
    sorted[index] = { ...sorted[index], start_ms: clamped, source: 'manual' };
    return deriveEnds(sorted, durationMs);
}

/** Patch a chapter's title/summary in place. */
export function updateChapter(
    chapters: StudioChapter[],
    index: number,
    patch: Partial<Pick<StudioChapter, 'title' | 'summary'>>
): StudioChapter[] {
    return chapters.map((c, i) => (i === index ? { ...c, ...patch } : c));
}

export function formatMs(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = h ? String(m).padStart(2, '0') : String(m);
    return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}
