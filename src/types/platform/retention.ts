export type RetentionMode = 'observe' | 'assist' | 'safe_auto';
export type RetentionVerdict =
    | 'healthy'
    | 'warning'
    | 'action_required'
    | 'critical'
    | 'maintenance_required'
    | 'recovery_in_progress'
    | 'inconclusive';

export interface RetentionPolicy {
    id?: string;
    tenant_id: string;
    enabled: boolean;
    mode: RetentionMode;
    schedule_interval_minutes: number;
    paused_until?: string | null;
    last_run_at?: string | null;
    policy_version: number;
    news_timezone: string;
    database_target_bytes: number;
    database_warning_bytes: number;
    database_action_bytes: number;
    database_critical_bytes: number;
    warning_forecast_days: number;
    action_forecast_days: number;
    critical_forecast_hours: number;
    max_rows_per_run: number;
    max_bytes_per_run: number;
    max_actions_per_run: number;
    action_modes?: Record<string, RetentionMode>;
    updated_by?: string;
}

export interface RetentionDBSample {
    id: string;
    database_bytes: number;
    provider_bytes?: number | null;
    provider_source: 'supabase_api' | 'neon_api' | 'operator_readback' | 'unavailable';
    relation_bytes: number;
    index_bytes: number;
    toast_bytes: number;
    allocated_bytes: number;
    reusable_bytes: number;
    live_tuples: number;
    dead_tuples: number;
    relation_breakdown?: Array<{
        schema_name: string;
        table_name: string;
        total_bytes: number;
        index_bytes: number;
        toast_bytes: number;
    }>;
    measured_at: string;
}

export interface RetentionForecast {
    growth_bytes_per_day: number;
    runway_to_target_days?: number | null;
    runway_to_action_days?: number | null;
    runway_to_critical_days?: number | null;
    sample_count: number;
    window_hours: number;
}

export interface RetentionPreview {
    eligible_stories: number;
    candidate_rows: number;
    estimated_bytes: number;
    protected_rows: number;
    blocked_stories: number;
}

export interface RetentionRun {
    id: string;
    correlation_id: string;
    trigger: string;
    mode: RetentionMode;
    status: string;
    verdict: RetentionVerdict;
    policy_version: number;
    counts?: RetentionPreview;
    started_at: string;
    finished_at?: string | null;
    error?: string;
}

export interface RetentionAction {
    id: string;
    action_class: string;
    owner_system: string;
    target_scope: string;
    mode: RetentionMode;
    decision: string;
    outcome: string;
    target_count: number;
    protected_count: number;
    estimated_bytes: number;
    guardrail?: string;
    created_at: string;
}

export interface RetentionHold {
    id: string;
    target_type: 'content' | 'story' | 'month';
    target_id: string;
    hold_class: 'manual' | 'editorial' | 'legal' | 'moderation' | 'recovery';
    reason: string;
    created_by: string;
    expires_at?: string | null;
    created_at: string;
}

export interface RetentionStatus {
    policy: RetentionPolicy;
    latest_sample?: RetentionDBSample | null;
    latest_run?: RetentionRun | null;
    forecast: RetentionForecast;
    verdict: RetentionVerdict;
    preview: RetentionPreview;
    paused: boolean;
    observe_only: boolean;
    guarantees: {
        full_fidelity_days: number;
        history_retention_days: number;
        canonical_row_deletion: string;
        sources_preserved: boolean;
        physical_rewrites: string;
    };
}
