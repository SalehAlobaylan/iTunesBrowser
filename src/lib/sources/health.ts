import type { ContentSource } from '@/types/platform/source';

export type SourceHealthStatus = 'disabled' | 'never_run' | 'stale' | 'healthy';

export interface SourceHealth {
    status: SourceHealthStatus;
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'success';
    isStale: boolean;
    /** ms since the source was last fetched, or null if never */
    ageMs: number | null;
    /** Estimated next-due timestamp; null when never run or disabled. */
    nextDueAt: Date | null;
}

export function sourceHealth(source: ContentSource, now: Date = new Date()): SourceHealth {
    if (!source.is_active) {
        return {
            status: 'disabled',
            label: 'Disabled',
            variant: 'secondary',
            isStale: false,
            ageMs: null,
            nextDueAt: null,
        };
    }

    if (!source.last_fetched_at) {
        return {
            status: 'never_run',
            label: 'Never run',
            variant: 'secondary',
            isStale: false,
            ageMs: null,
            nextDueAt: null,
        };
    }

    const last = new Date(source.last_fetched_at);
    const ageMs = now.getTime() - last.getTime();
    const intervalMs = source.fetch_interval_minutes * 60_000;
    const nextDueAt = new Date(last.getTime() + intervalMs);
    const isStale = ageMs > intervalMs;

    return {
        status: isStale ? 'stale' : 'healthy',
        label: isStale ? 'Stale' : 'Healthy',
        variant: isStale ? 'destructive' : 'success',
        isStale,
        ageMs,
        nextDueAt,
    };
}
