// Real User Experience (RUX) — Console types mirroring the CMS admin surface.

export type RuxVerdict =
    | 'healthy'
    | 'watching'
    | 'degraded'
    | 'critical'
    | 'insufficient_data'
    | 'telemetry_degraded';

export type RuxIncidentStatus = 'open' | 'recovering' | 'resolved' | 'closed';
export type RuxSeverity = 'watching' | 'degraded' | 'critical';

export interface ExperiencePolicy {
    tenant_id: string;
    ingest_enabled: boolean;
    evaluation_enabled: boolean;
    enabled_surfaces: string;
    min_sample_floor: number;
    confirm_windows: number;
    resolve_windows: number;
    telemetry_freshness_minutes: number;
    raw_retention_days: number;
    max_release_cohorts: number;
    paused_until: string | null;
    last_evaluated_bucket: string | null;
    updated_at: string;
}

export interface ExperienceRun {
    id: string;
    trigger: string;
    status: 'running' | 'completed' | 'partial' | 'failed';
    telemetry_fresh: boolean;
    surface_verdicts: Record<string, SurfaceVerdict> | null;
    summary: string;
    buckets_processed: number;
    started_at: string;
    finished_at: string | null;
    error: string;
    error_class: string;
}

export interface SliStatus {
    metric: string;
    label: string;
    value: number;
    target: number;
    denominator: number;
    p75_ms?: number;
    p75_budget_ms?: number;
    status: 'ok' | 'breach' | 'latency_breach' | 'insufficient';
    critical: boolean;
    likely_owner?: string;
}

export interface SurfaceVerdict {
    verdict: RuxVerdict;
    slis: SliStatus[];
}

export interface ExperienceMetrics {
    bucket: string;
    telemetry_fresh: boolean;
    surfaces: Record<string, SurfaceVerdict>;
}

export interface ExperienceIncident {
    id: string;
    fingerprint: string;
    metric_key: string;
    surface: string;
    cohort_dim: string;
    cohort_val: string;
    severity: RuxSeverity;
    status: RuxIncidentStatus;
    summary: string;
    evidence: Record<string, unknown> | null;
    recommendation: string;
    likely_owner: string;
    violation_streak: number;
    clean_streak: number;
    first_seen_at: string;
    last_seen_at: string;
    resolved_at: string | null;
    close_reason_class?: string;
}

export interface ExperienceAction {
    id: string;
    action_class: string;
    label: string;
    metric_key: string;
    surface: string;
    guardrail: string;
    created_at: string;
}

export interface ExperienceSuppression {
    id: string;
    metric_key: string;
    surface: string;
    reason: string;
    starts_at: string;
    expires_at: string;
    created_by: string;
}

export interface ExperienceStatus {
    policy: ExperiencePolicy;
    latest_run: ExperienceRun;
    telemetry_fresh: boolean;
    open_incidents: number;
    surface_verdicts: Record<string, SurfaceVerdict> | null;
}

export type IncidentCloseReason =
    | 'resolved_externally'
    | 'expected_behavior'
    | 'false_positive'
    | 'accepted_risk';
