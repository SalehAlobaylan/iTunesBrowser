// Content Source types for Platform Module

export type SourceType = 'RSS' | 'PODCAST' | 'YOUTUBE' | 'TWITTER' | 'REDDIT' | 'TELEGRAM' | 'MANUAL';

export type SourceCategory = 'news' | 'media';

export interface ContentSource {
    id: string;
    name: string;
    type: SourceType;
    category?: SourceCategory;
    feed_url?: string;
    image_url?: string;
    api_config?: Record<string, unknown>;
    is_active: boolean;
    fetch_interval_minutes: number;
    last_fetched_at?: string;
    created_at: string;
    updated_at: string;
}

// API request/response types
export interface ListSourcesParams {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    type?: SourceType;
    category?: SourceCategory;
}

export interface ListSourcesResponse {
    data: ContentSource[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface CreateSourceRequest {
    name: string;
    type: SourceType;
    category?: SourceCategory;
    feed_url?: string;
    image_url?: string;
    api_config?: Record<string, unknown>;
    is_active?: boolean;
    fetch_interval_minutes?: number;
}

export interface UpdateSourceRequest {
    name?: string;
    type?: SourceType;
    category?: SourceCategory;
    feed_url?: string;
    image_url?: string;
    api_config?: Record<string, unknown>;
    is_active?: boolean;
    fetch_interval_minutes?: number;
}

export interface RunSourceResponse {
    message: string;
    job_id?: string;
}

// --- Source monitoring stats (GET /admin/sources/stats) ---------------------
// Mirrors sourceStatsResponse in CMS adminSourceController.go.

export type SourceHealth = 'healthy' | 'stale' | 'never_run' | 'disabled';

export interface SourceFreshness {
    overdue_count: number;
    due_soon_count: number;
    fresh_count: number;
    never_run_count: number;
    oldest_fetched_at: string | null;
}

/** A source ranked by the content it has produced (joined by source name). */
export interface SourceOutputStat {
    name: string;
    type: SourceType | '';
    category: SourceCategory | '';
    items: number;
    ready: number;
    failed: number;
    last_item_at?: string;
}

/** A source that needs attention (active but stale or never run). */
export interface SourceAttention {
    id: string;
    name: string;
    type: SourceType;
    category: SourceCategory;
    health: SourceHealth;
    last_fetched_at?: string;
}

export interface SourceStats {
    total: number;
    by_category: Record<SourceCategory, number>;
    by_type: Record<string, number>;
    by_status: Record<'active' | 'disabled', number>;
    by_health: Record<SourceHealth, number>;
    by_type_health: Record<string, Record<SourceHealth, number>>;
    freshness: SourceFreshness;
    top_sources: SourceOutputStat[];
    recent_failures: SourceAttention[];
}

export interface SourceStatsParams {
    category?: SourceCategory;
}

// Source type display labels
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
    RSS: 'RSS Feed',
    PODCAST: 'Podcast',
    YOUTUBE: 'YouTube',
    TWITTER: 'Twitter/X',
    REDDIT: 'Reddit',
    TELEGRAM: 'Telegram',
    MANUAL: 'Manual',
};

// Preview / discover (admin tooling)
// Mirrors Go structs in CMS adminSourceController.go
export interface DiscoverFeedsRequest {
    url: string;
}

export interface DiscoveredFeed {
    url: string;
    title?: string;
    type: string;
}

export interface DiscoverFeedsResponse {
    success: boolean;
    feeds: DiscoveredFeed[];
    message: string;
}

export interface PreviewSourceRequest {
    sourceType: SourceType;
    url: string;
    name?: string;
    settings?: Record<string, unknown>;
    limit?: number;
}

export interface PreviewItem {
    idempotencyKey: string;
    type: string;
    title: string;
    excerpt?: string;
    author?: string;
    originalUrl: string;
    publishedAt?: string;
    // Rich media metadata (media sources) for the add-source preview.
    thumbnailUrl?: string;
    durationSec?: number;
}

// --- Media-add discovery (podcast search, youtube resolve) ------------------

export interface ItunesPodcast {
    id: number;
    name: string;
    feed_url: string;
    image_url?: string;
}

export interface PodcastSearchResponse {
    results: ItunesPodcast[];
}

export interface YoutubeResolved {
    channel_id: string;
    title: string;
    thumbnail?: string;
    subscriber_count?: number;
}

export interface PreviewSourceResponse {
    success: boolean;
    message: string;
    fetched: number;
    normalized: number;
    skipped: number;
    errors: number;
    items: PreviewItem[];
}
