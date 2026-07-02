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
    last_evaluated_at?: string | null;
    last_generated_at?: string | null;
    created_at?: string;
    updated_at?: string;
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
