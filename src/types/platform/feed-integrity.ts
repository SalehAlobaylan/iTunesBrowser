export type FeedIntegrityTier = 'light' | 'deep';

export interface FeedIntegrityPolicy {
    tenant_id: string;
    scheduled_enabled: boolean;
    light_interval_minutes: number;
    deep_interval_hours: number;
    confirm_runs: number;
    resolve_runs: number;
    edge_pages_per_feed: number;
    probe_url_budget: number;
    probe_concurrency: number;
    probe_timeout_ms: number;
    foryou_latency_budget_ms: number;
    news_latency_budget_ms: number;
    expected_min_foryou_units: number;
    expected_min_news_slides: number;
    paused_until?: string | null;
    last_light_run_at?: string | null;
    last_deep_run_at?: string | null;
}

export interface FeedIntegrityRun {
    id: string;
    trigger: string;
    tier: FeedIntegrityTier;
    status: 'running' | 'completed' | 'partial' | 'failed' | string;
    headline: string;
    started_at: string;
    finished_at?: string | null;
    summary?: string;
    feed_results?: Record<string, FeedIntegrityFeedResult>;
    counts?: { findings?: number; violations?: number };
    error?: string;
}

export interface FeedIntegrityFeedResult {
    feed: 'foryou' | 'news' | string;
    variant: string;
    consumer_verdict: string;
    readiness_verdict: string;
    consumer_score: number;
    readiness_score: number;
    violations: number;
    checked: number;
}

export interface FeedIntegrityFinding {
    id: string;
    lane: string;
    check_key: string;
    axis: 'consumer' | 'readiness' | string;
    feed: string;
    variant: string;
    target_type?: string;
    target_ref?: string;
    candidate_count: number;
    status: string;
    severity?: string;
    evidence?: unknown;
    created_at: string;
}

export interface FeedIntegrityEpisode {
    id: string;
    check_key: string;
    axis: string;
    feed: string;
    variant: string;
    status: string;
    severity: string;
    summary: string;
    first_detected_at: string;
    last_seen_at: string;
    close_reason_class?: string;
}

export interface FeedIntegritySuppression {
    id: string;
    check_key: string;
    feed?: string;
    variant?: string;
    reason: string;
    expires_at: string;
}

export interface FeedIntegrityCheck {
    Key: string;
    Label: string;
    Lane: string;
    Feed: string;
    Axis: string;
    OwnerSurface: string;
    Severity: string;
}

export interface FeedIntegrityStatus {
    policy: FeedIntegrityPolicy;
    latest_run?: FeedIntegrityRun | null;
    open_episodes: FeedIntegrityEpisode[];
    active_suppressions: FeedIntegritySuppression[];
    checks: FeedIntegrityCheck[];
}
