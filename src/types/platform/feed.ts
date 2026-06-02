// Saved syndication feeds (RSS/Atom/JSON) managed in the News page.

export interface RSSFeed {
    id: string;
    tenant_id: string;
    slug: string;
    name: string;
    title: string;
    description: string;
    topic_id?: string | null;
    content_type: string;
    item_limit: number;
    enabled: boolean;
    created_at: string;
    updated_at: string;
    // Absolute public URLs (server-built from PUBLIC_BASE_URL).
    rss_url: string;
    atom_url: string;
    json_url: string;
}

export interface FeedsListResponse {
    data: RSSFeed[];
    public_base: string;
}

export interface CreateFeedRequest {
    name: string;
    title?: string;
    description?: string;
    topic_id?: string | null;
    content_type?: string;
    item_limit?: number;
    slug?: string;
}

export type UpdateFeedRequest = Partial<CreateFeedRequest> & { enabled?: boolean };

export type FeedFormat = 'rss' | 'atom' | 'json';
