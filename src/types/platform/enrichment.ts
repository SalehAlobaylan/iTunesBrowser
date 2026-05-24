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

/**
 * Per-service health view. Same shape returned by both Media-Service and
 * Enrichment-Service /ready endpoints, plus an `error` slot when CMS could
 * not reach the service at all.
 */
export interface AIServiceHealth {
    status: string;
    error?: string;
    models?: Record<string, boolean>;
    dependencies?: Record<string, boolean>;
}

export interface EnrichmentHealthResponse {
    /** Aggregate status across both AI services: "ok" only when both are ok. */
    status: string;
    /** Legacy fields surface the Enrichment-Service view (text embedder). */
    error?: string;
    models?: Record<string, boolean>;
    dependencies?: Record<string, boolean>;
    /**
     * Per-service breakdown — added after the Media-Service split. Optional
     * so older CMS builds (single Enrichment-Service) still parse cleanly.
     */
    services?: {
        media?: AIServiceHealth;
        enrichment?: AIServiceHealth;
    };
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
