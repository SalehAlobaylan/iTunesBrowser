/** Status counts returned by GET /admin/content/status-counts */
export interface StatusCounts {
    PENDING: number;
    PROCESSING: number;
    READY: number;
    FAILED: number;
    ARCHIVED: number;
}

/** Request body for POST /admin/content/bulk-status */
export interface BulkStatusRequest {
    ids?: string[];
    from_status?: string;
    to_status: string;
    source_name?: string;
    type?: string;
    limit?: number;
    dry_run?: boolean;
}

/** Response from POST /admin/content/bulk-status */
export interface BulkStatusResponse {
    updated_count: number;
    message: string;
}

export type PipelineAutopilotMode = 'observe' | 'safe_auto';
export type PipelineAutopilotState = 'off' | 'observe' | 'safe_auto' | 'elevated' | 'paused';

export interface PipelineAutopilotPolicy {
    tenant_id: string;
    enabled: boolean;
    mode: PipelineAutopilotMode;
    interval_minutes: number;
    max_items_per_run: number;
    max_batches_per_run: number;
    max_attempts: number;
    retry_backoff_hours: number;
    pending_age_floor_minutes: number;
    processing_stuck_hours: number;
    max_queue_depth: number;
    per_source_daily_retries: number;
    recovery_cooldown_minutes: number;
    trust_min_outcomes: number;
    trust_min_success_pct: number;
    paused_until?: string | null;
    elevated_mode?: string;
    elevated_until?: string | null;
    last_run_at?: string | null;
    last_health_ok_at?: string | null;
}

export interface PipelineTrustStat {
    lane: string;
    outcomes: number;
    recovered: number;
    failed: number;
    success_pct: number;
    state: 'trusted' | 'probation' | 'demoted';
    earned: boolean;
}

export interface PipelineCohortSummary {
    lane: string;
    verdict: string;
    count: number;
    target_queue?: string;
    source?: string;
    item_ids?: string[];
}

export interface PipelineHealthSnapshot {
    timestamp: string;
    status_counts: StatusCounts;
    stuck_count: number;
    oldest_unprocessed?: string;
    queues?: Array<{
        queue: string;
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    queue_depth: number;
    dlq_depth: number;
    aggregation_healthy: boolean;
}

export interface PipelineAutopilotRun {
    id: string;
    tenant_id: string;
    trigger: string;
    mode: string;
    elevated_mode?: string;
    status: 'running' | 'completed' | 'partial' | 'failed';
    headline?: 'flowing' | 'repairing' | 'backlogged' | 'clogged' | 'degraded';
    started_at: string;
    finished_at?: string;
    summary?: string;
    health_before?: PipelineHealthSnapshot;
    health_after?: PipelineHealthSnapshot;
    created_by?: string;
    error?: string;
    error_class?: string;
}

export interface PipelineAutopilotAction {
    id: string;
    lane: string;
    verdict: string;
    source_filter?: string;
    target_queue?: string;
    content_item_id?: string;
    status: 'success' | 'error' | 'attention' | 'skipped' | 'would_execute' | 'would_skip';
    outcome?: 'pending' | 'recovered' | 'failed_again' | 'unresolved';
    reason?: string;
    guardrail?: string;
    requested_count: number;
    enqueued_count: number;
    error_count: number;
    started_at: string;
    finished_at?: string;
}

export interface PipelineAutopilotStatus {
    enabled: boolean;
    mode: PipelineAutopilotMode;
    state: PipelineAutopilotState;
    interval_minutes: number;
    elevated_mode?: string;
    elevated_until?: string | null;
    paused_until?: string | null;
    last_run_at?: string | null;
    last_health_ok_at?: string | null;
    next_run_at?: string | null;
    last_run?: PipelineAutopilotRun;
    trust: PipelineTrustStat[];
    cohorts: PipelineCohortSummary[];
    attention: PipelineCohortSummary[];
    recommended_action?: string;
    policy: PipelineAutopilotPolicy;
}

export interface PipelineAutopilotRunDetail {
    run: PipelineAutopilotRun;
    actions: PipelineAutopilotAction[];
}

export type ContentStageLane = 'news' | 'pods';
export type ContentStageVerdict = 'healthy' | 'degraded' | 'paused' | 'legacy';

export interface ContentStageControl {
    tenant_id: string;
    lane: ContentStageLane;
    scheduling_enabled: boolean;
    execution_enabled: boolean;
    optional_metadata_enabled: boolean;
    transcript_execution_enabled: boolean;
    reason?: string;
    updated_by?: string;
    updated_at?: string;
}

export interface ContentStageLaneHealth {
    lane: ContentStageLane;
    cutover: 'legacy' | 'shadow' | 'durable_required';
    verdict: ContentStageVerdict;
    reasons: string[];
    control: ContentStageControl;
    state_counts: Record<string, number>;
    stage_state_counts: Record<string, Record<string, number>>;
    oldest_queued_at?: string;
    oldest_active_at?: string;
    schema_state?: 'available' | 'pending' | string;
    latest_snapshot?: PipelineLaneSnapshot;
    latest_snapshots?: Partial<Record<'aggregation' | 'enrichment', PipelineLaneSnapshot>>;
}

export interface PipelineLaneSnapshot {
    owner_principal: 'aggregation' | 'enrichment' | string;
    captured_at: string;
    required_queue_depth: number;
    optional_queue_depth: number;
    required_oldest_age_seconds: number;
    optional_oldest_age_seconds: number;
    dlq_delta: number;
    failure_classes?: Record<string, number>;
    stage_counts?: Record<string, number>;
    enrichment_counts?: Record<string, {
        accepted: number;
        rejected: number;
        in_flight: number;
        retry_after_seconds: number;
    }>;
    process_metrics?: Record<string, unknown>;
    resource_metrics?: Record<string, unknown>;
}

export interface ContentStageHealth {
    tenant_id: string;
    worker_healthy: boolean;
    lanes: ContentStageLaneHealth[];
}

export interface ContentStageTrace {
    item: Record<string, unknown>;
    source_lineage: Record<string, unknown>;
    current_generation: number;
    historical_generations: number[];
    requests: Array<Record<string, unknown>>;
    attempts: Array<Record<string, unknown>>;
    receipts: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    artifacts: unknown[];
    lifecycle_decisions: unknown[];
    feed_generation_membership: unknown[];
    eligibility: Record<string, unknown>;
    preference: Record<string, unknown>;
    ranking?: {
        raw_rank?: number | null;
        final_rank?: number | null;
        freshness_reserved?: boolean;
        source_spacing_movement?: number;
    } | null;
    diagnostic: {
        classification: string;
        reason: string;
        schema_state: string;
        frozen_session_known?: boolean;
        boundary_observed?: boolean;
    };
}
