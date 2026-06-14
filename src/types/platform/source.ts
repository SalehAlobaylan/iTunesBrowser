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
