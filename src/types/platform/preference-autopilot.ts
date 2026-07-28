// Preferences Autopilot (stage 7) — cockpit types. Mirrors the CMS Go response
// shapes (preferenceAutopilotController.go / preferenceAutopilotRunner.go).

export type PreferenceAutopilotMode = 'observe' | 'safe_auto';

export type PreferenceHeadline =
    | 'curation_current'
    | 'review_ready'
    | 'backlog'
    | 'coverage_gap'
    | 'flip_eligible'
    | 'integrity_alert'
    | 'degraded'
    | 'not_observed';

export type FlipGateState = 'green' | 'amber' | 'red';

export interface PreferenceFlipGate {
    flag: string;
    enabled: boolean;
    coverage_pct: number;
    floor_pct: number;
    state: FlipGateState;
}

export interface DuplicatePair {
    a_slug: string;
    b_slug: string;
    a_id: string;
    b_id: string;
    cosine: number;
}

export interface PreferenceSnapshot {
    active_topics: number;
    null_centroid_topics: number;
    dead_topics: number;
    pending_proposals: number;
    oldest_pending_age_hours: number;
    high_confidence_pending: number;
    pods_coverage_pct: number;
    news_coverage_pct: number;
    story_coverage_pct: number;
    unmapped_backlog: number;
    near_duplicate_pairs: number;
    duplicate_pairs?: DuplicatePair[];
    recompute_queue_depth: number;
    recently_active_users: number;
    mute_violations: number;
    boosted_serves: number;
    total_serves: number;
    boost_sanity: 'ok' | 'unknown';
    flip_gates: Record<string, PreferenceFlipGate>;
}

export interface PreferenceAutopilotPolicy {
    tenant_id: string;
    enabled: boolean;
    mode: PreferenceAutopilotMode;
    interval_minutes: number;
    max_item_candidates: number;
    max_story_candidates: number;
    max_dirty_topics: number;
    max_users_recompute: number;
    max_proposals_enriched: number;
    max_embedding_calls: number;
    max_translation_calls: number;
    max_mined_proposals: number;
    max_centroid_refresh: number;
    max_pending_proposals: number;
    coverage_floor_pods_pct: number;
    coverage_floor_news_pct: number;
    coverage_floor_story_pct: number;
    high_confidence: number;
    advisory_reject_floor: number;
    duplicate_cosine: number;
    failure_breaker_pct: number;
    dead_topic_days: number;
    trust_min_decisions: number;
    trust_min_agreement_pct: number;
    auto_approve_enabled: boolean;
    auto_approve_min_confidence: number;
    max_auto_approvals: number;
    item_map_cursor?: number;
    story_map_cursor?: number;
    dirty_item_cursor?: number;
    dirty_story_cursor?: number;
    paused_until?: string | null;
    last_run_at?: string | null;
    last_mine_at?: string | null;
}

export interface PreferenceAutopilotRun {
    id: string;
    tenant_id: string;
    trigger: string;
    mode: PreferenceAutopilotMode;
    status: 'running' | 'completed' | 'partial' | 'failed';
    headline: PreferenceHeadline;
    started_at: string;
    finished_at?: string | null;
    summary?: string;
    recommended_action?: string;
    stats_before?: PreferenceSnapshot;
    stats_after?: PreferenceSnapshot;
    created_by?: string;
    error?: string;
}

export interface PreferenceAutopilotAction {
    id: string;
    action_class: string;
    subject_type: string;
    subject_ref?: string;
    status: string;
    guardrail?: string;
    reason?: string;
    duration_ms: number;
    started_at: string;
    finished_at?: string | null;
}

export interface PreferenceTrustBanner {
    decisions: number;
    agreements: number;
    agreement_pct: number;
    min_decisions: number;
    min_agreement_pct: number;
    eligible: boolean;
    mute_violation: boolean;
}

export interface PreferenceAttentionTopic {
    id: string;
    slug: string;
    label_en: string;
    member_count: number;
}

export interface PreferenceAutopilotStatus {
    enabled: boolean;
    mode: PreferenceAutopilotMode;
    state: 'off' | 'observe' | 'safe_auto' | 'paused';
    interval_minutes: number;
    paused_until?: string | null;
    last_run_at?: string | null;
    next_run_at?: string | null;
    snapshot_age_sec?: number | null;
    headline: PreferenceHeadline;
    recommended_action?: string;
    last_run?: PreferenceAutopilotRun | null;
    snapshot?: PreferenceSnapshot | null;
    flip_gates?: Record<string, PreferenceFlipGate>;
    trust: PreferenceTrustBanner;
    null_centroid_topics: PreferenceAttentionTopic[];
    dead_topics: PreferenceAttentionTopic[];
    pending_proposals: number;
    policy: PreferenceAutopilotPolicy;
}

export interface RunWithActions {
    run: PreferenceAutopilotRun;
    actions: PreferenceAutopilotAction[];
}

// The policy PUT also accepts a transient paused_minutes (0 = resume) that maps to
// paused_until server-side — it is not a stored policy field.
export type PreferenceAutopilotPolicyPatch = Partial<PreferenceAutopilotPolicy> & {
    paused_minutes?: number;
};

// ─── Insights (deep logging read-model) ────────────────────────────

export interface PrefRunBuckets {
    map_sweep: number;
    dirty_sweep: number;
    centroid_refresh: number;
    member_refresh: number;
    recompute: number;
    mine: number;
    proposal_enrich: number;
    auto_approve: number;
    merge_suggest: number;
    baseline: number;
    skipped: number;
    errored: number;
}

export interface PrefRunHistoryEntry {
    id: string;
    started_at: string;
    trigger: string;
    mode: PreferenceAutopilotMode;
    status: string;
    headline: PreferenceHeadline;
    buckets: PrefRunBuckets;
    coverage_before: number;
    coverage_after: number;
}

export interface PrefCoveragePoint {
    started_at: string;
    pods_pct: number;
    news_pct: number;
    story_pct: number;
    unmapped_backlog: number;
    pending: number;
    queue_depth: number;
}

export interface PrefClassBreaker {
    class: string;
    tripped: boolean;
    last_status: string;
    at: string;
}

export interface PrefTrustPoint {
    week: string;
    decisions: number;
    agreements: number;
}

export interface PrefAutoApprovedTopic {
    id: string;
    slug: string;
    label_en: string;
    active: boolean;
    member_count: number;
    created_at: string;
}

export interface PrefLatestFlow {
    buckets: PrefRunBuckets;
    observe: boolean;
    run_id: string;
}

export interface PreferenceAutopilotInsights {
    run_history: PrefRunHistoryEntry[];
    coverage_series: PrefCoveragePoint[];
    coverage_floors: { pods: number; news: number; story: number };
    guardrail_totals: Record<string, number>;
    outcome_totals: Record<string, number>;
    latest_flow: PrefLatestFlow | null;
    class_breakers: PrefClassBreaker[];
    trust_series: PrefTrustPoint[];
    auto_approved: PrefAutoApprovedTopic[];
}

// ─── Cross-run ledger explorer ──────────────────────────────────────

export interface PreferenceActionFilters {
    action_class?: string;
    status?: string;
    guardrail?: string;
    subject_type?: string;
    subject_ref?: string;
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
}

export interface PreferenceLedgerItem extends PreferenceAutopilotAction {
    run_id: string;
}

export interface PreferenceLedgerPage {
    items: PreferenceLedgerItem[];
    limit: number;
    offset: number;
    has_more: boolean;
}

// ─── Recompute-queue ops ────────────────────────────────────────────

export interface RecomputeQueueRow {
    tenant_id: string;
    user_id: string;
    reason: string;
    attempts: number;
    last_error?: string;
    created_at: string;
    updated_at: string;
}
