// News Rotation types — a focused view over ARTICLE content that powers the
// News feed (1 featured ARTICLE + auto-related tweets/comments per slide).

import type { ContentItem, ContentStatus } from '@/types/platform/content';

// The lineup is just ARTICLE content items; we re-use ContentItem wholesale.
export type NewsItem = ContentItem;

/** Which slice of the lineup the page is viewing. */
export type NewsView = 'READY' | 'PENDING' | 'ARCHIVED';

export interface NewsLineupParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    source_name?: string;
}

/** Payload for POST /admin/content (manual compose / publish from URL). */
export interface CreateNewsRequest {
    title: string;
    original_url: string;
    excerpt?: string;
    body_text?: string;
    source_name?: string;
    author?: string;
    thumbnail_url?: string;
    published_at?: string;
    topic_tags?: string[];
    /** Defaults to ARTICLE server-side. */
    type?: string;
    /** Defaults to READY server-side. */
    status?: ContentStatus;
}

/** Result of POST /admin/content/import-feed (bulk import of a whole feed). */
export interface ImportFeedResult {
    is_feed: boolean;
    imported: number;
    skipped: number;
    total: number;
    site_name: string;
}

/** Response from POST /admin/content/extract-url (Enrichment /v1/extract). */
export interface ExtractUrlResult {
    title?: string | null;
    text: string;
    excerpt?: string | null;
    author?: string | null;
    published_at?: string | null;
    site_name?: string | null;
    image_url?: string | null;
    word_count: number;
}

export interface BulkStatusResult {
    updated_count: number;
    message: string;
}

/** Modes for the "rotate out older than N days" control. */
export type RotateMode = 'archive' | 'delete';

// ─── Topic-centric management ───────────────────────────────

/** A selected topic for drill-in (id is a topic UUID, or 'none' for unclassified). */
export interface TopicSelection {
    id: string;
    label: string;
}

/** A first-class topic (LLM-labeled) with live per-status counts. */
export interface TopicSummary {
    id: string;
    label: string;
    total: number;
    ready: number;
    pending: number;
    archived: number;
    avg_views: number;
}

/** Per-status counts for the synthetic "Uncategorized" bucket. */
export interface TopicStatusCounts {
    total: number;
    ready: number;
    pending: number;
    archived: number;
}

export interface TopicsListResponse {
    data: TopicSummary[];
    uncategorized: TopicStatusCounts;
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ListTopicsParams {
    search?: string;
    page?: number;
    limit?: number;
    type?: string;
}

/**
 * Filters for the board's content list (GET /admin/content). `topic_id` is a
 * topic UUID, or the sentinel "none" for unclassified, or undefined for All.
 */
export interface TopicContentParams {
    topic_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    type?: string;
    source_name?: string;
    created_before?: string;
}

/** A bulk action's selection: either explicit ids OR the active filter set. */
export interface BulkSelection {
    ids?: string[];
    status?: string;
    type?: string;
    topic?: string;
    topic_id?: string;
    source_name?: string;
    created_before?: string;
}

/** Body for POST /admin/content/bulk-topic (move/assign). */
export interface BulkTopicBody extends BulkSelection {
    target_topic_id?: string; // empty / "null" => uncategorize
    dry_run?: boolean;
}

export interface MergeTopicsBody {
    source_ids: string[];
    target_id: string;
}

export interface ReclassifyResult {
    processed: number;
    remaining: number;
}

/** Result of a full re-cluster pass (POST /admin/topics/recluster). */
export interface ReclusterResult {
    clusters: number;
    articles: number;
    message: string;
}

/** Result of one topic-naming batch (POST /admin/topics/label-batch). */
export interface LabelBatchResult {
    processed: number;
    remaining: number;
}

/** Body for POST /admin/content/bulk-status (filter- or id-based). */
export interface BulkStatusBody extends BulkSelection {
    from_status?: ContentStatus;
    to_status: ContentStatus;
    limit?: number;
    dry_run?: boolean;
}

/** Body for POST /admin/content/bulk-tags. */
export interface BulkTagsBody extends BulkSelection {
    add_tags?: string[];
    remove_tags?: string[];
    set_tags?: string[];
    dry_run?: boolean;
}
