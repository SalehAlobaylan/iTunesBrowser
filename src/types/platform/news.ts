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
