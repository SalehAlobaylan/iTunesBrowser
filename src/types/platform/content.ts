// Content Item types for Platform Module

export type ContentType = 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
export type ContentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';

export interface ContentItem {
    id: string;
    type: ContentType;
    status: ContentStatus;
    title: string;
    body_text?: string;
    excerpt?: string;
    author?: string;
    source_id?: string;
    source_name?: string;
    media_url?: string;
    thumbnail_url?: string;
    original_url?: string;
    duration_sec?: number;
    topic_tags?: string[];
    metadata?: Record<string, unknown>;
    published_at?: string;
    created_at: string;
    updated_at: string;
    // Engagement metrics
    like_count: number;
    view_count: number;
    share_count: number;
}

export type NewsConfidence = 'low' | 'medium' | 'high';

export interface NewsMetadata {
    version?: string;
    likelyNews: boolean;
    score: number;
    confidence: NewsConfidence;
    categoryHints?: string[];
    matchedKeywords?: string[];
    signals?: {
        hasBreakingPrefix?: boolean;
        verifiedSource?: boolean;
        sourceLooksNews?: boolean;
        hasAttribution?: boolean;
        recencyHours?: number | null;
    };
}

// API request/response types
export interface ListContentParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    type?: ContentType;
    source_id?: string;
    source_name?: string;
    date_from?: string;
    date_to?: string;
}

export interface ListContentResponse {
    data: ContentItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface UpdateContentStatusRequest {
    status: ContentStatus;
}

// Display labels
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    ARTICLE: 'Article',
    VIDEO: 'Video',
    TWEET: 'Tweet',
    COMMENT: 'Comment',
    PODCAST: 'Podcast',
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    READY: 'Ready',
    FAILED: 'Failed',
    ARCHIVED: 'Archived',
};

// Status badge variants
export const CONTENT_STATUS_VARIANTS: Record<ContentStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
    PENDING: 'secondary',
    PROCESSING: 'warning',
    READY: 'success',
    FAILED: 'destructive',
    ARCHIVED: 'outline',
};
