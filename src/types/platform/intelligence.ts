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

// News Circulation
export type NewsWindow = 'today' | 'week' | 'month';
export type NewsLifecycle = 'breaking' | 'active' | 'cooling' | 'historical';
export type SourceCadenceMode = 'suggest' | 'auto_apply' | 'manual';

export interface NewsCirculationPolicy {
    tenant_id: string;
    preset: 'latest_plus' | string;
    timezone: string;
    min_today_stories: number;
    carryover_hours: number;
    carryover_min_score: number;
    breaking_max_age_minutes: number;
    breaking_min_members: number;
    recency_weight: number;
    importance_weight: number;
    momentum_weight: number;
    coverage_weight: number;
    source_quality_weight: number;
    diversity_weight: number;
    trending_weight: number;
    source_cadence_mode: SourceCadenceMode;
    source_claim_interval_minutes: number;
    source_min_interval_minutes: number;
    source_max_interval_minutes: number;
    source_max_change_percent: number;
    created_at?: string;
    updated_at?: string;
}

export type UpdateCirculationPolicyRequest = Partial<NewsCirculationPolicy>;

export interface CirculationStoryMember {
    id: string;
    type: string;
    format?: string;
    title?: string;
    excerpt?: string;
    body_text?: string;
    author?: string;
    source_name?: string;
    thumbnail_url?: string;
    source_image_url?: string;
    published_at: string;
    like_count: number;
    comment_count: number;
    share_count: number;
    view_count: number;
}

export interface CirculationStorySummary {
    story_id: string;
    lead_id: string;
    label: string;
    last_member_at: string;
    lifecycle: NewsLifecycle;
    is_carryover?: boolean;
    summary?: string;
    bullets?: string[];
    title?: string;
    excerpt?: string;
    thumbnail_url?: string;
    source_name?: string;
    source_image_url?: string;
    published_at: string;
    member_count: number;
    source_count?: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    view_count: number;
}

export interface CirculationStoryFeatured extends CirculationStorySummary {
    members: CirculationStoryMember[];
}

export interface CirculationStorySlide {
    slide_id: string;
    featured: CirculationStoryFeatured;
    related: CirculationStorySummary[];
}

export interface CirculationPreviewResponse {
    cursor: string | null;
    slides: CirculationStorySlide[];
}

export interface CirculationWindowMetric {
    window: NewsWindow;
    stories: number;
    breaking: number;
    active: number;
    cooling: number;
    historical: number;
    carryover: number;
    primary_from: string;
}

export interface CirculationMetricsResponse {
    windows: CirculationWindowMetric[];
    active_sources: number;
    pending_recommendations: number;
    policy: NewsCirculationPolicy;
}

export interface NewsStoryOverride {
    id: string;
    tenant_id: string;
    story_id: string;
    pin_to_top: boolean;
    suppress: boolean;
    exclude_from_feed: boolean;
    importance_boost: number;
    notes?: string;
    set_by?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface UpsertStoryOverrideRequest {
    pin_to_top?: boolean;
    suppress?: boolean;
    exclude_from_feed?: boolean;
    importance_boost?: number;
    notes?: string;
    expires_at?: string | null;
}

export interface SourceCirculationRecommendation {
    id: string;
    tenant_id: string;
    source_id: string;
    source_name: string;
    source_type: string;
    current_interval_minutes: number;
    recommended_interval_minutes: number;
    score: number;
    reason: string;
    mode: SourceCadenceMode;
    metrics?: Record<string, unknown>;
    applied: boolean;
    applied_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SourceRecommendationsResponse {
    data: SourceCirculationRecommendation[];
    auto_applied?: boolean;
}

export interface StoryOverridesResponse {
    data: NewsStoryOverride[];
}

export interface AuditLogEntry {
    id: string;
    tenant_id: string;
    user_id: string;
    user_email: string;
    action: string;
    target_service: string;
    target_resource?: string;
    status: 'success' | 'failure';
    error_message?: string;
    payload?: Record<string, unknown>;
    created_at: string;
}

export interface AuditLogListResponse {
    data: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
