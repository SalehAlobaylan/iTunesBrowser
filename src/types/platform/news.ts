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
 * Filters for the board's content list (GET /admin/content). `story_id` is a
 * topic UUID, or the sentinel "none" for unclassified, or undefined for All.
 */
export interface TopicContentParams {
    story_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    type?: string;
    source_name?: string;
    created_before?: string;
    /** Published-date range as CMS operator filters (repeated `published_at=` keys). */
    published_at?: string[];
    /** Server-side sort (CMS query parser: `sort` + `order`). */
    sort?: string;
    order?: string;
}

/** A bulk action's selection: either explicit ids OR the active filter set. */
export interface BulkSelection {
    ids?: string[];
    status?: string;
    type?: string;
    topic?: string;
    story_id?: string;
    source_name?: string;
    created_before?: string;
}

/** Body for POST /admin/content/bulk-topic (move/assign). */
export interface BulkTopicBody extends BulkSelection {
    target_story_id?: string; // empty / "null" => uncategorize
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

/** Result of a full re-cluster pass (POST /admin/stories/recluster). */
export interface ReclusterResult {
    clusters: number;
    articles: number;
    message: string;
}

/** Result of one topic-naming batch (POST /admin/stories/label-batch). */
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

// ─── News Circulation ──────────────────────────────────────

export type NewsWindow = 'today' | 'week' | 'month';
export type NewsLifecycle = 'breaking' | 'active' | 'cooling' | 'historical';
export type SourceCadenceMode = 'suggest' | 'auto_apply' | 'manual';
export type AutopilotMode = 'assist' | 'safe_auto';
export type AutopilotToolScope = 'core' | 'boosted';
export type AutopilotState = 'healthy' | 'watching' | 'boosting' | 'safety' | 'paused' | 'degraded';
export type AutopilotRunStatus = 'running' | 'completed' | 'partial' | 'failed';
export type AutopilotActionStatus = 'running' | 'success' | 'skipped' | 'error';

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
    source_claim_batch_size: number;
    source_min_interval_minutes: number;
    source_max_interval_minutes: number;
    source_max_change_percent: number;
    // Automation heartbeat — the self-running recommendation loop and its guardrails.
    automation_enabled: boolean;
    automation_interval_minutes: number;
    auto_apply_speedups: boolean;
    max_auto_applies_per_run: number;
    min_runs_for_auto: number;
    last_automation_run_at?: string;
    autopilot_enabled: boolean;
    autopilot_mode: AutopilotMode;
    autopilot_interval_minutes: number;
    autopilot_boost_until?: string;
    autopilot_paused_until?: string;
    autopilot_last_run_at?: string;
    autopilot_max_queue_depth: number;
    autopilot_max_actions_per_run: number;
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
    reason?: string;
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

export interface AutopilotQueueStat {
    queue: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

export interface AutopilotSnapshotSignal {
    window: NewsWindow;
    built_at?: string;
    dirty: boolean;
    age_seconds?: number;
}

export interface AutopilotHealthSignal {
    state: AutopilotState;
    aggregation_reachable: boolean;
    aggregation_error?: string;
    queue_depth: number;
    max_queue_depth: number;
    today_story_count: number;
    today_carryover_count: number;
    today_carryover_ratio: number;
    active_sources: number;
    due_sources: number;
    pending_recommendations: number;
    source_error_rate: number;
    snapshots: AutopilotSnapshotSignal[];
    queues: AutopilotQueueStat[];
    generated_at: string;
}

export type NewsFreshnessVerdictValue = 'fresh' | 'watching' | 'thin' | 'stale' | 'blocked' | 'degraded';
export type NewsFreshnessRecommendedAction = 'none' | 'run_once' | 'boost_freshness' | 'review_sources' | 'pause';

export interface NewsFreshnessReason {
    tone: 'good' | 'warning' | 'danger';
    label: string;
    detail: string;
}

export interface NewsFreshnessVerdict {
    score: number;
    verdict: NewsFreshnessVerdictValue;
    summary: string;
    reasons: NewsFreshnessReason[];
    recommended_action: NewsFreshnessRecommendedAction;
}

export interface AutopilotBlockedTool {
    name: string;
    reason: string;
}

export interface NewsAutopilotAction {
    id: string;
    tenant_id: string;
    tool_name: string;
    status: AutopilotActionStatus;
    reason?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    started_at: string;
    finished_at?: string;
    created_at: string;
    updated_at: string;
}

export interface NewsAutopilotRun {
    id: string;
    tenant_id: string;
    trigger: string;
    mode: AutopilotMode;
    tool_scope: AutopilotToolScope;
    status: AutopilotRunStatus;
    started_at: string;
    finished_at?: string;
    summary?: string;
    health_before?: AutopilotHealthSignal;
    health_after?: AutopilotHealthSignal;
    created_by?: string;
    error?: string;
    created_at: string;
    updated_at: string;
    action_count?: number;
    actions?: NewsAutopilotAction[];
}

export interface NewsAutopilotStatus {
    state: AutopilotState;
    policy: NewsCirculationPolicy;
    health: AutopilotHealthSignal;
    freshness: NewsFreshnessVerdict;
    next_run_at?: string | null;
    boost_until?: string | null;
    paused_until?: string | null;
    allowed_tools: string[];
    blocked_tools: AutopilotBlockedTool[];
    latest_run?: NewsAutopilotRun | null;
    latest_actions: NewsAutopilotAction[];
}

export interface UpdateAutopilotSettingsRequest {
    autopilot_enabled?: boolean;
    autopilot_mode?: AutopilotMode;
    autopilot_interval_minutes?: number;
    autopilot_max_queue_depth?: number;
    autopilot_max_actions_per_run?: number;
}

export interface BoostAutopilotRequest {
    duration_minutes?: number;
}

export interface AutopilotRunsResponse {
    data: NewsAutopilotRun[];
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
