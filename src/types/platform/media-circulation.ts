import type { StorageProofMetrics } from './storage';

export type MediaCirculationHeadline =
    | 'healthy'
    | 'watch'
    | 'feed_thin'
    | 'over_budget'
    | 'degraded';

export type RecommendationUnitType = 'source' | 'item_family';

export interface LibraryBucketHealth {
    bucket: string;
    visible_units: number;
    state: 'thin' | 'ok' | 'saturated' | string;
    /** Demand surface (stage 4) — measured serve-side demand in [0,1]. */
    demand_score: number;
    /** Value-weighted supply in [0,1] (10 junk units ≠ 10 good units). */
    coverage_score: number;
    /** demand − coverage, in [-1,1]. Positive = under-supplied. */
    gap: number;
    /** True once enough serve telemetry accumulated; false = estimated from supply counts. */
    measured: boolean;
}

/** One row of the per-topic demand table (Ranking/Intelligence diagnostics). */
export interface TopicDemand {
    topic: string;
    serves: number;
    repeat_serves: number;
    demand_score: number;
    coverage_score: number;
    gap: number;
    visible_units: number;
}

/** GET /admin/media/circulation/intelligence — observability read model. */
export interface IntelligenceDiagnostics {
    exploring_count: number;
    established_count: number;
    retrial_count: number;
    demoted_count: number;
    scored_count: number;
    unscored_count: number;
    stale_count: number;
    oldest_computed_at?: string;
    demand_measured: boolean;
    topic_demand: TopicDemand[];
}

export interface MediaCirculationPolicy {
    tenant_id?: string;
    enabled: boolean;
    preset: 'conservative' | 'balanced' | 'intake_hungry' | string;
    value_floor: number;
    marginal_margin: number;
    max_intake_per_source_per_cycle: number;
    max_intake_per_cycle: number;
    source_min_interval_minutes: number;
    source_max_interval_minutes: number;
    freshness_demand_weight: number;
    // ---- Autopilot (stage 5) ----
    autopilot_enabled: boolean;
    autopilot_mode: 'observe' | 'safe_auto' | string;
    autopilot_interval_minutes: number;
    autopilot_max_actions_per_run: number;
    autopilot_max_atomize_per_run: number;
    autopilot_max_queue_depth: number;
    autopilot_max_bytes_per_run: number;
    autopilot_evict_confidence_floor: number;
    autopilot_trust_min_decisions: number;
    autopilot_trust_max_revert_pct: number;
    autopilot_paused_until?: string | null;
    autopilot_elevated_mode?: MediaAutopilotElevatedMode | '' | null;
    autopilot_elevated_until?: string | null;
    autopilot_last_run_at?: string | null;
    last_evaluated_at?: string | null;
    last_generated_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

// ---- Autopilot (stage 5) ----

export type MediaAutopilotElevatedMode =
    | 'storage_relief'
    | 'quality_repair'
    | 'atomization_catchup';

export type MediaAutopilotActionStatus =
    | 'running'
    | 'success'
    | 'error'
    | 'skipped'
    | 'approval_required'
    | 'would_apply'
    | 'would_skip';

export interface MediaAutopilotTrustStat {
    verdict: string;
    decisions: number;
    applied: number;
    reverts: number;
    revert_pct: number;
    earned: boolean;
}

export interface MediaCirculationRun {
    id: string;
    tenant_id: string;
    trigger: 'scheduled' | 'manual' | string;
    mode: 'observe' | 'safe_auto' | string;
    elevated_mode?: string;
    status: 'running' | 'completed' | 'partial' | 'failed' | string;
    started_at: string;
    finished_at?: string | null;
    summary?: string;
    health_before?: unknown;
    health_after?: unknown;
    created_by?: string;
    error?: string;
}

export interface MediaCirculationAction {
    id: string;
    tenant_id: string;
    recommendation_id?: string | null;
    tool_name: string;
    status: MediaAutopilotActionStatus | string;
    reason?: string;
    guardrail?: string;
    input?: unknown;
    output?: unknown;
    error?: string;
    byte_impact: number;
    queue_impact: number;
    feed_impact: number;
    started_at: string;
    finished_at?: string | null;
}

export interface MediaAutopilotStatus {
    enabled: boolean;
    mode: 'observe' | 'safe_auto' | string;
    state: 'off' | 'observe' | 'safe_auto' | 'elevated' | 'paused' | string;
    interval_minutes: number;
    elevated_mode?: string;
    elevated_until?: string | null;
    paused_until?: string | null;
    last_run_at?: string | null;
    next_run_at?: string | null;
    last_run?: MediaCirculationRun | null;
    trust: MediaAutopilotTrustStat[];
    recommended_action?: string;
}

export interface AutopilotRunDetail {
    run: MediaCirculationRun;
    actions: MediaCirculationAction[];
}

export interface OpBudgetStatus {
    class_a_status: 'ok' | 'warn' | 'cap' | string;
    class_b_status: 'ok' | 'warn' | 'cap' | string;
    class_a_used: number;
    class_b_used: number;
    class_a_remaining: number;
    class_b_remaining: number;
    class_a_budget: number;
    class_b_budget: number;
}

export interface AtomizationBacklog {
    pending_runs: number;
    running_runs: number;
    transcript_wait_count: number;
    backlog_depth: number;
    intake_dampening_factor: number;
}

export interface BucketYield {
    predicted: number;
    delivered: number;
}

export interface MediaCirculationProof {
    storage: StorageProofMetrics;
    op_budget: OpBudgetStatus;
    atomization_backlog: AtomizationBacklog;
    buckets: LibraryBucketHealth[];
    thin_buckets: string[];
    evict_by_verdict: Record<string, number>;
    applied_yield_by_bucket?: Record<string, BucketYield>;
}

export interface MediaCirculationHealth {
    headline: MediaCirculationHeadline | string;
    score: number;
    summary: string;
    storage_state: string;
    reasons: string[];
    generated_at: string;
    proof: MediaCirculationProof;
    policy: MediaCirculationPolicy;
}

export interface MediaCirculationRecommendation {
    id: string;
    tenant_id: string;
    unit_type: RecommendationUnitType | string;
    subject_id: string;
    subject_kind?: string;
    verdict: string;
    action: string;
    score: number;
    reasons?: string[];
    metrics?: Record<string, unknown>;
    status: string;
    outcome?: string;
    applied: boolean;
    applied_at?: string | null;
    applied_by?: string;
    created_at: string;
    updated_at: string;
}

export type RecommendationActionLane =
    | 'pull'
    | 'atomize'
    | 'limit_skip'
    | 'protect'
    | 'cool'
    | 'downrank'
    | 'review'
    | string;

export interface MediaCirculationCockpitHealth {
    headline: MediaCirculationHeadline | string;
    score: number;
    summary: string;
    reasons: string[];
    generated_at: string;
    enabled: boolean;
}

export interface MediaCirculationCockpitBucket extends LibraryBucketHealth {
    thin_floor: number;
    saturated_ceil: number;
    share_pct: number;
}

export interface MediaCirculationCockpitSummary {
    total: number;
    pending: number;
    applied: number;
    dismissed: number;
    superseded: number;
    by_unit_type: Record<string, number>;
    by_verdict: Record<string, number>;
    by_status: Record<string, number>;
    by_action_lane: Record<string, number>;
    needs_attention: number;
}

export interface MediaCirculationCockpitRecommendation extends MediaCirculationRecommendation {
    display_title: string;
    display_subtitle: string;
    action_lane: RecommendationActionLane;
    priority_label: string;
    primary_metric: string;
    proof_points: string[];
}

export interface MediaCirculationCockpit {
    health: MediaCirculationCockpitHealth;
    storage: StorageProofMetrics;
    op_budget: OpBudgetStatus;
    atomization_backlog: AtomizationBacklog;
    applied_yield_by_bucket?: Record<string, BucketYield>;
    buckets: MediaCirculationCockpitBucket[];
    summary: MediaCirculationCockpitSummary;
    policy: MediaCirculationPolicy;
    recommendations: MediaCirculationCockpitRecommendation[];
    autopilot: MediaAutopilotStatus;
}

export interface MediaCirculationOverride {
    id: string;
    tenant_id: string;
    subject_kind: 'source' | 'item' | 'family' | string;
    subject_id: string;
    override_type:
        | 'never_archive'
        | 'keep_latest_n_hot'
        | 'premium_source'
        | 'no_atomize'
        | 'editorial_hold'
        | string;
    params?: Record<string, unknown>;
    expires_at?: string | null;
    set_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MediaCirculationOverrideRequest {
    subject_kind: string;
    subject_id: string;
    override_type: string;
    params?: Record<string, unknown>;
    expires_at?: string | null;
    notes?: string;
}

export interface OverrideListResponse {
    data: MediaCirculationOverride[];
}

export interface RecommendationListResponse {
    data: MediaCirculationRecommendation[];
}

export interface VerdictBucketCount {
    count: number;
    by_verdict: Record<string, number>;
}

export interface GenerateRecommendationsResponse {
    data: {
        item_family: VerdictBucketCount;
        source: VerdictBucketCount;
    };
}
