import type { HeatmapPoint } from '@/types/platform/studio';

const PEAK_MIN_GAP_MS = 30_000; // keep generated peak-chapters ≥30s apart

/** Max heatmap value (for normalizing the overlay height). */
export function heatmapMax(heatmap: HeatmapPoint[]): number {
    return heatmap.reduce((m, p) => (p.value > m ? p.value : m), 0);
}

/**
 * Pick the start times (ms) of the top-N engagement peaks — local maxima of the
 * "most replayed" curve, spaced ≥ PEAK_MIN_GAP_MS apart, excluding 0 and the end.
 */
export function peakStartsMs(
    heatmap: HeatmapPoint[],
    durationMs: number,
    count = 5
): number[] {
    if (!heatmap || heatmap.length === 0) return [];

    const localMaxima = heatmap.filter((p, i) => {
        const prev = i > 0 ? heatmap[i - 1].value : -Infinity;
        const next = i < heatmap.length - 1 ? heatmap[i + 1].value : -Infinity;
        return p.value >= prev && p.value >= next;
    });

    const byValue = [...localMaxima].sort((a, b) => b.value - a.value);
    const chosen: number[] = [];
    for (const p of byValue) {
        const ms = Math.round(p.start * 1000);
        if (ms <= 0 || (durationMs > 0 && ms >= durationMs)) continue;
        if (chosen.every((c) => Math.abs(c - ms) >= PEAK_MIN_GAP_MS)) {
            chosen.push(ms);
            if (chosen.length >= count) break;
        }
    }
    return chosen.sort((a, b) => a - b);
}
