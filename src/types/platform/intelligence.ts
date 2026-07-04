// ============================
// Intelligence / Ranking types
// ============================

import type { IntelligenceDiagnostics } from '@/types/platform/media-circulation';

export type RankingMode = 'fresh_first' | 'trending' | 'most_relevant' | 'ai_curated' | 'balanced' | 'custom';

export interface RankingConfig {
    tenant_id: string;
    freshness_weight: number;
    engagement_weight: number;
    velocity_weight: number;
    similarity_weight: number;
    quality_weight: number;
    diversity_weight: number;
    trending_weight: number;
    freshness_decay_hours: number;
    velocity_window_hours: number;
    trending_threshold_multiplier: number;
    recirculation_enabled: boolean;
    recirculation_max_age_days: number;
    show_watched_when_unseen_exhausted: boolean;
    engagement_normalization: 'log' | 'linear';
    mode: RankingMode;
    is_active: boolean;
    // Phase 13 — NEWS-first stories feed.
    story_match_threshold: number;
    // Coverage-aware ranking: story momentum × (1 + w·ln(1 + recent members)).
    // Rewards aggregation — heavily-covered stories outrank fresh singletons.
    story_coverage_weight: number;
    // 'live' = assemble from current story state behind a ≤60s read-through
    // cache (the product default); 'cached_only' = emergency escape hatch.
    // Legacy 'precompute'/'on_demand' values may still come back from older
    // rows; the backend folds them into 'live' on update.
    news_feed_mode: 'live' | 'cached_only' | 'precompute' | 'on_demand';
    // Quality knob: write-time cross-encoder reranking of related stories.
    // Independent of news_feed_mode.
    news_rerank_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface ModeDefinition {
    mode: RankingMode;
    name: string;
    description: string;
    icon: string;
    weights: Record<string, number>;
}

export type UpdateRankingConfigRequest = Partial<Omit<RankingConfig, 'tenant_id' | 'created_at' | 'updated_at'>>;

// Content Flags
export interface ContentFlag {
    id: string;
    tenant_id: string;
    content_item_id: string;
    boost: boolean;
    suppress: boolean;
    pin_to_top: boolean;
    exclude_from_feed: boolean;
    boost_multiplier: number;
    notes: string;
    set_by: string;
    created_at: string;
    updated_at: string;
    // Enriched
    content_title?: string;
    content_type?: string;
    content_status?: string;
}

export interface ContentFlagListResponse {
    data: ContentFlag[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface UpsertFlagRequest {
    boost?: boolean;
    suppress?: boolean;
    pin_to_top?: boolean;
    exclude_from_feed?: boolean;
    boost_multiplier?: number;
    notes?: string;
}

export interface BulkFlagRequest {
    content_ids: string[];
    boost?: boolean;
    suppress?: boolean;
    pin_to_top?: boolean;
    exclude_from_feed?: boolean;
    notes?: string;
}

// Embeddings
export interface ContentCluster {
    topic: string;
    count: number;
    avg_likes: number;
    avg_views: number;
    avg_shares: number;
}

export interface SimilarContentItem {
    id: string;
    title: string;
    type: string;
    similarity: number;
}

export interface TypeEmbedStat {
    type: string;
    total: number;
    with_embedding: number;
}

export interface EmbeddingStats {
    total_ready: number;
    with_embedding: number;
    percentage: number;
    by_type: TypeEmbedStat[];
}

// Analytics
export interface ScoreDistribution {
    range: string;
    count: number;
}

export interface VelocityItem {
    id: string;
    title: string;
    type: string;
    velocity: number;
    count: number;
}

export interface TrendingItem {
    id: string;
    title: string;
    type: string;
    trending_score: number;
    recent_rate: number;
    avg_rate: number;
}

export interface SourcePerformance {
    source_name: string;
    source_type: string;
    count: number;
    avg_likes: number;
    avg_views: number;
    avg_shares: number;
}

export interface SignalHealth {
    signal: string;
    coverage: number;
    total: number;
    percentage: number;
}

// Score Breakdown (from ranking engine)
export interface ScoreBreakdown {
    freshness: number;
    engagement: number;
    velocity: number;
    similarity: number;
    quality: number;
    diversity: number;
    trending: number;
    flags: string;
}

// Feed Preview
export interface PreviewFeedItem {
    id: string;
    type: string;
    title: string;
    author?: string;
    source_name?: string;
    published_at?: string;
    like_count: number;
    view_count: number;
    share_count: number;
    final_score: number;
    score_breakdown: ScoreBreakdown;
    chron_position: number;
    ranked_position: number;
    position_change: number;
}

export interface PreviewFeedResponse {
    items: PreviewFeedItem[];
    is_active: boolean;
}

// ── Media Value engine (stage-4 Ranking/Intelligence) control room ──────────

/** Operational tunables for the durable media-value engine (per tenant). */
export interface MediaValueConfig {
    tenant_id: string;
    // Four rate/state signal weights (server-normalized to sum 1.0).
    engagement_weight: number;
    completion_weight: number;
    quality_weight: number;
    velocity_weight: number;
    // Exploration.
    exploration_slice_every: number;
    explore_impression_target: number;
    legacy_exposure_view_floor: number;
    // Demotion decay.
    demotion_default_factor: number;
    demotion_half_life_days: number;
    created_at?: string;
    updated_at?: string;
}

/** GET /admin/media/intelligence/config — effective config + code defaults. */
export interface MediaValueConfigResponse {
    config: MediaValueConfig;
    defaults: MediaValueConfig;
}

export type UpdateMediaValueConfigRequest = Partial<
    Omit<MediaValueConfig, 'tenant_id' | 'created_at' | 'updated_at'>
>;

/** POST /admin/media/intelligence/refresh result. */
export interface MediaValueRefreshResult {
    refreshed: number;
    stale_remaining: number;
    unscored_remaining: number;
}

// ── Intelligence Observatory (visualization read model) ─────────────────────

/** One column of the value spectrum: item counts in a value range, by state. */
export interface ValueBin {
    min: number;
    max: number;
    exploring: number;
    established: number;
    total: number;
}

/** Mean signal contribution across the scored corpus. */
export interface SignalAverages {
    engagement: number;
    completion: number;
    quality: number;
    velocity: number;
    suitability_adj: number;
    cost_penalty: number;
}

/** Per-duration-bucket demand economics. */
export interface BucketDemand {
    bucket: string;
    demand_score: number;
    coverage_score: number;
    gap: number;
    measured: boolean;
    serves: number;
    exhaustions: number;
    repeat_serves: number;
}

/** The tuning subset the live curves + composition need. */
export interface ObservatoryTuning {
    engagement_weight: number;
    completion_weight: number;
    quality_weight: number;
    velocity_weight: number;
    explore_impression_target: number;
    demotion_half_life_days: number;
    demotion_default_factor: number;
}

/**
 * GET /admin/media/intelligence/observatory — the full visualization snapshot.
 * Embeds the diagnostics counts (flattened) + the richer viz aggregates.
 */
export interface ObservatorySnapshot extends IntelligenceDiagnostics {
    value_histogram: ValueBin[];
    value_median: number;
    value_p25: number;
    value_mean: number;
    signal_averages: SignalAverages;
    bucket_demand: BucketDemand[];
    tuning: ObservatoryTuning;
}
