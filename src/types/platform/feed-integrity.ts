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
    pods_latency_budget_ms: number;
    news_latency_budget_ms: number;
    expected_min_pods_units: number;
    expected_min_news_slides: number;
    paused_until?: string | null;
    last_light_run_at?: string | null;
    last_deep_run_at?: string | null;
    autopilot_enabled: boolean;
    autopilot_mode: FeedIntegrityAutopilotMode;
    autopilot_paused_until?: string | null;
    autopilot_action_modes?: Record<string, FeedIntegrityAutopilotMode>;
    autopilot_action_hourly_cap: number;
    autopilot_diagnostic_hourly_cap: number;
    autopilot_cooldown_minutes: number;
    autopilot_evidence_max_age_minutes: number;
    autopilot_retry_limit: number;
    autopilot_trust_min_decisions: number;
    autopilot_trust_min_agreement_pct: number;
}

export type FeedIntegrityAutopilotMode = 'observe' | 'assist' | 'safe_auto';

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
    lane_results?: Record<string, { executed: number }>;
    autopilot_evaluated_at?: string | null;
    autopilot_decision?: string;
    autopilot_counts?: { considered?: number; proposed?: number; blocked?: number };
    autopilot_error_class?: string;
}

export interface FeedIntegrityFeedResult {
    feed: 'pods' | 'news' | string;
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
    scope?: string;
    violation_streak?: number;
    clean_streak?: number;
    flap_count_24h?: number;
    attribution?: { owner?: string; action_class?: string; deep_link?: string };
    recommended_action?: string;
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

export interface FeedIntegrityAction {
    id: string;
    tenant_id: string;
    action_class: string;
    owner_system: string;
    target_scope: string;
    mode: FeedIntegrityAutopilotMode;
    outcome: string;
    decision: string;
    guardrail?: string;
    reason?: string;
    input?: { check_key?: string; feed?: string; variant?: string; deep_link?: string };
    output?: unknown;
    verification?: unknown;
    actor?: string;
    approved_at?: string;
    executed_at?: string;
    verification_due_at?: string;
    finished_at?: string;
    duration_ms: number;
    error_class: string;
    created_at: string;
}

export interface FeedIntegrityTrustStat {
    action_class: string;
    state: 'probation' | 'trusted' | 'demoted' | string;
    decisions: number;
    agreed: number;
    agreement_pct: number;
    failures: number;
    breaker_open: boolean;
}

export interface FeedIntegrityAutopilotStatus {
    policy: FeedIntegrityPolicy;
    latest_run?: FeedIntegrityRun | null;
    decision?: string;
    self_health: 'healthy' | 'degraded' | string;
    action_state: string;
    pending_evaluations: number;
    stuck_actions: number;
    recent_actions: FeedIntegrityAction[];
    trust: FeedIntegrityTrustStat[];
    registry_version: string;
}
