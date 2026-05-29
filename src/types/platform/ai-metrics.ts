// ── AI Observability Types ──────────────────────────────────
//
// Structured view over the Prometheus /metrics surfaces of Media-Service
// (media_*) and Enrichment-Service (enrichment_*). Scraped + aggregated by
// /api/ai-metrics so the dashboard shows throughput / errors / avg latency,
// not just liveness.

export interface CountByStatus {
    success: number;
    error: number;
    total: number;
}

export interface MediaMetrics {
    transcriptions: CountByStatus;
    imageEmbeddings: CountByStatus;
    transcribeJobs: {
        queued: number;
        started: number;
        completed: number;
        failed: number;
    };
    transcriptionAvgSec: number | null;
    writebackSuccessRate: number | null;
}

export interface EnrichmentMetrics {
    embeddings: CountByStatus;
    translations: CountByStatus;
    summarizations: CountByStatus;
    relatedRequests: number;
    relatedAvgSec: number | null;
    rerankRequests: number;
    rerankAvgSec: number | null;
    feedNewsRequests: number;
    feedNewsAvgSec: number | null;
    rrfOverlapRatio: number | null;
    rankingDropped: {
        freshness: number;
        source_diversity: number;
        type_quotas: number;
    };
}

export interface LlmMetrics {
    requestsByProvider: Record<string, { success: number; failure: number }>;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number | null;
    fallbackInvocations: number;
    retries: number;
    errorsByType: Record<string, number>;
    errorsByProvider: Record<string, number>;
    avgLatencySec: number | null;
}

export interface AiMetricsSnapshot {
    timestamp: string;
    media: MediaMetrics | null;
    enrichment: EnrichmentMetrics | null;
    llm: LlmMetrics | null;
    errors: { media?: string; enrichment?: string };
}
