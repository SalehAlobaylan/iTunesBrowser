// ── Enrichment Dashboard Types ──────────────────────────────

export interface EnrichmentStats {
    total_media: number;
    with_transcript: number;
    missing_transcript: number;
    with_embedding: number;
    missing_embedding: number;
    total_ready: number;
}

export interface MissingEnrichmentItem {
    id: string;
    title: string;
    type: string;
    source_name: string;
    status: string;
    has_transcript: boolean;
    has_embedding: boolean;
    media_url: string;
    created_at: string;
}

export interface MissingEnrichmentsResponse {
    items: MissingEnrichmentItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface MissingEnrichmentsParams {
    missing?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
}

export interface EnrichmentHealthResponse {
    status: string;
    error?: string;
    models?: Record<string, boolean>;
    dependencies?: Record<string, boolean>;
}

export interface TriggerEnrichmentRequest {
    types: string[];
}

export interface TriggerBatchRequest {
    content_ids: string[];
    types: string[];
}

export interface TriggerResultItem {
    content_id: string;
    status: string;
    error?: string;
}

export interface TriggerEnrichmentResponse {
    content_id: string;
    results: string[];
    errors: string[];
}
