// Content Item types for Platform Module

export type ContentType = 'NEWS' | 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
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
    file_size_bytes?: number;
    storage_tier?: string;
    topic_tags?: string[];
    metadata?: Record<string, unknown>;
    published_at?: string;
    created_at: string;
    updated_at: string;
    // Engagement metrics
    like_count: number;
    view_count: number;
    share_count: number;
    // Caption-first state (Media tab)
    caption_state?: CaptionState;
    transcript_source?: string;
    has_transcript?: boolean;
    transcript_approved_at?: string;
    transcript_approved_by?: string;
    latest_transcription_job?: TranscriptionJobSummary;
    transcript_quality?: TranscriptQualitySummary;
}

export type TranscriptionJobStatus =
    | 'queued'
    | 'running'
    | 'skipped'
    | 'succeeded'
    | 'failed'
    | 'writeback_failed'
    | 'canceled';

export interface TranscriptionJobSummary {
    id: string;
    content_item_id: string;
    transcript_id?: string;
    batch_id?: string;
    batch_item_id?: string;
    trigger_source: string;
    status: TranscriptionJobStatus;
    provider?: string;
    model?: string;
    language?: string;
    skip_reason?: string;
    error_message?: string;
    provider_error_code?: string;
    retry_count: number;
    canceled: boolean;
    estimated_cost_usd: number;
    reserved_cost_usd: number;
    actual_cost_usd: number;
    media_job_id?: string;
    writeback_status?: string;
    writeback_error?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}

export type TranscriptQualityStatus = 'ok' | 'needs_review' | 'auto_repair';

export interface TranscriptQualitySummary {
    id: string;
    content_item_id: string;
    transcript_id: string;
    score: number;
    status: TranscriptQualityStatus;
    issue_codes: string[];
    details?: Record<string, unknown>;
    computed_at: string;
}

// Caption/transcript provenance state (never-downgrade machine).
export type CaptionState = 'none' | 'youtube_auto' | 'youtube_human' | 'stt_done';

export const CAPTION_STATE_LABELS: Record<CaptionState, string> = {
    none: 'No transcript',
    youtube_auto: 'Auto caption — needs enrichment',
    youtube_human: 'Human caption',
    stt_done: 'STT transcript',
};

export const CAPTION_STATE_VARIANTS: Record<
    CaptionState,
    'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
    none: 'outline',
    youtube_auto: 'warning',
    youtube_human: 'success',
    stt_done: 'default',
};

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
    type?: ContentType | `in:${string}`;
    caption_state?: CaptionState;
    transcription_status?: TranscriptionJobStatus;
    transcription_trigger?: string;
    quality_status?: TranscriptQualityStatus;
    source_id?: string;
    source_name?: string;
    min_size_bytes?: number;
    max_size_bytes?: number;
    size_tracked?: 'tracked' | 'untracked' | 'all';
    /**
     * Published-date range as CMS operator filters, e.g.
     * ['gte:2026-01-01T00:00:00Z', 'lte:2026-01-31T23:59:59Z'] — serialized as
     * repeated `published_at=` keys.
     */
    published_at?: string[];
    // Server-side sort (CMS query parser reads `sort` + `order`; both accept a
    // comma-separated list for multi-field sort, e.g. sort=source_name,published_at).
    sort?: string;
    order?: string;
}

export interface MediaSizeAggregate {
    count: number;
    bytes: number;
}

export interface MediaSizeLargestItem {
    id: string;
    type: ContentType;
    status: ContentStatus;
    title: string;
    source_name?: string;
    file_size_bytes: number;
    storage_tier?: string;
    media_url?: string;
    thumbnail_url?: string;
    published_at?: string;
    updated_at: string;
}

export interface MediaSizeStats {
    total_count: number;
    tracked_count: number;
    untracked_count: number;
    total_bytes: number;
    avg_bytes: number;
    max_bytes: number;
    largest_items: MediaSizeLargestItem[];
    by_type: Record<string, MediaSizeAggregate>;
    by_source: Record<string, MediaSizeAggregate>;
    by_status: Record<string, MediaSizeAggregate>;
    size_buckets: Record<string, MediaSizeAggregate>;
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
    NEWS: 'News',
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
