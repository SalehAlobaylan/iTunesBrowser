// ============================
// Intelligence / Ranking types
// ============================

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
    news_feed_mode: 'precompute' | 'on_demand';
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
