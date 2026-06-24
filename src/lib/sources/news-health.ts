import type { NewsSource } from '@/types/platform/discovery';

export type NewsHealthStatus = 'live' | 'stale' | 'new' | 'paused';

export interface NewsHealth {
    status: NewsHealthStatus;
    label: string;
    variant: 'success' | 'warning' | 'secondary' | 'outline';
}

/**
 * News-source health is about whether items are still *flowing* — based on
 * `last_item_at`, not fetch cadence (that's the media/fleet notion). Mirrors the
 * logic Feeds Finding uses for its active-source rows.
 */
export function newsSourceHealth(s: Pick<NewsSource, 'is_active' | 'last_item_at'>): NewsHealth {
    if (!s.is_active) return { status: 'paused', label: 'Paused', variant: 'secondary' };
    if (!s.last_item_at) return { status: 'new', label: 'New', variant: 'outline' };
    const ageDays = (Date.now() - new Date(s.last_item_at).getTime()) / 86_400_000;
    if (ageDays <= 3) return { status: 'live', label: 'Live', variant: 'success' };
    return { status: 'stale', label: 'Stale', variant: 'warning' };
}

export const NEWS_HEALTH_ORDER: NewsHealthStatus[] = ['live', 'stale', 'new', 'paused'];
export const NEWS_HEALTH_LABELS: Record<NewsHealthStatus, string> = {
    live: 'Live',
    stale: 'Stale',
    new: 'New',
    paused: 'Paused',
};

/** Hostname without `www.`, for the source subtitle. */
export function domainOf(url?: string): string {
    if (!url) return '';
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}
