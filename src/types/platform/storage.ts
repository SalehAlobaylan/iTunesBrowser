export interface StorageStats {
    used_bytes: number;
    object_count: number;
    quota_bytes: number;
    utilization_pct: number;
    by_artifact_type: Record<string, number>;
    by_content_type: Record<string, { bytes: number; count: number }>;
    db_tracked_bytes: number;
    live_stats_at: string;
    aggregation_error?: string;
    cold_enabled?: boolean;
    cold?: {
        used_bytes: number;
        object_count: number;
        by_artifact_type: Record<string, number>;
    };
}

export interface StorageProofMetrics {
    used_bytes: number;
    quota_bytes: number;
    utilization_pct: number;
    db_tracked_bytes: number;
    protected_count: number;
    protected_bytes: number;
    candidate_count: number;
    candidate_bytes: number;
    parent_source_count: number;
    parent_source_bytes: number;
    recoverable_deleted_count: number;
    missing_count: number;
    cold_enabled: boolean;
}

export interface StorageRecommendation {
    key: string;
    label: string;
    detail: string;
    severity: 'info' | 'warning' | 'critical' | string;
    action: string;
    estimated_bytes?: number;
    metadata?: Record<string, unknown>;
}

export interface StorageHealth {
    state: 'healthy' | 'watch' | 'pressure' | 'critical' | 'degraded_no_cold' | 'degraded' | string;
    score: number;
    summary: string;
    generated_at: string;
    policy: StoragePolicy;
    proof: StorageProofMetrics;
    recommendations: StorageRecommendation[];
}

export interface StorageRecommendationsResponse {
    data: StorageRecommendation[];
    proof: StorageProofMetrics;
}

export interface SweepPreview {
    enabled: boolean;
    next_run_at?: string;
    candidates_count: number;
    bytes_to_free: number;
    archive_action: 'delete' | 'move_to_cold' | 're_encode';
    protected_count: number;
    protected_bytes: number;
}

export interface StoragePolicy {
    id: number;
    tenant_id: string | null;
    enabled: boolean;
    preset?: 'balanced' | 'conservative' | 'storage_saver' | 'critical_pressure' | string;
    max_storage_bytes: number;
    target_utilization_pct: number;
    min_age_days: number;
    min_view_count_for_keep: number;
    sweep_interval_minutes: number;
    delete_failed_immediately: boolean;
    preserve_thumbnails: boolean;
    protect_top_n_by_views: number;
    protect_top_n_window_days: number;
    archive_action: 'delete' | 'move_to_cold' | 're_encode';
    /** When archive_action='re_encode', which QualityProfile to shrink down to.
     *  null/undefined = auto-pick the per-item resolved ingest profile. */
    re_encode_target_profile_id?: number | null;
    // Operation budgets (Cloudflare R2 free-tier defaults).
    class_a_free_budget: number;
    class_b_free_budget: number;
    class_a_warn_pct: number;
    class_a_cap_pct: number;
    class_b_warn_pct: number;
    class_b_cap_pct: number;
    last_sweep_at?: string;
    updated_at: string;
    created_at: string;
}

export interface PolicyResponse extends StoragePolicy {
    effective: { tenant_id?: string | null; scope: 'global' | 'tenant' };
}

export interface UpdatePolicyRequest {
    scope?: 'global' | 'tenant';
    tenant_id?: string;
    enabled?: boolean;
    preset?: 'balanced' | 'conservative' | 'storage_saver' | 'critical_pressure' | string;
    max_storage_bytes?: number;
    target_utilization_pct?: number;
    min_age_days?: number;
    min_view_count_for_keep?: number;
    sweep_interval_minutes?: number;
    delete_failed_immediately?: boolean;
    preserve_thumbnails?: boolean;
    protect_top_n_by_views?: number;
    protect_top_n_window_days?: number;
    archive_action?: 'delete' | 'move_to_cold' | 're_encode';
    re_encode_target_profile_id?: number;
    class_a_free_budget?: number;
    class_b_free_budget?: number;
    class_a_warn_pct?: number;
    class_a_cap_pct?: number;
    class_b_warn_pct?: number;
    class_b_cap_pct?: number;
}

export interface PolicyOverridesResponse {
    global: StoragePolicy;
    overrides: StoragePolicy[];
}

export interface StorageCandidate {
    id: string;
    type: string;
    status: string;
    title: string;
    source_name?: string;
    view_count: number;
    file_size_bytes: number;
    created_at: string;
    published_at?: string;
    media_url?: string;
    thumbnail_url?: string;
    parent_content_item_id?: string;
    is_feed_unit?: boolean;
    feed_visibility?: string;
    duration_sec?: number;
    original_url?: string;
    source_feed_url?: string;
    source_episode_id?: string;
    storage_state?: string;
    storage_recovery_status?: string;
    media_suitability?: string;
    content_role?: string;
    protection_reason?: string;
}

export interface StorageCandidatesResponse {
    data: StorageCandidate[];
    total: number;
    limit: number;
    total_bytes: number;
}

export interface StorageCandidatesParams {
    min_age_days?: number;
    max_view_count?: number;
    status?: string;
    source_name?: string;
    limit?: number;
}

export interface PurgeFilters {
    min_age_days?: number;
    max_view_count?: number;
    status?: string;
    source_name?: string;
    max_bytes?: number;
    trigger?: string;
}

export interface PurgeRequest {
    ids?: string[];
    filters?: PurgeFilters;
    dry_run?: boolean;
    preserve_thumbnails?: boolean;
}

export interface PurgeResponse {
    deleted_count: number;
    freed_bytes: number;
    dry_run?: boolean;
    message: string;
}

export interface SweepRun {
    id: number;
    tenant_id: string;
    started_at: string;
    finished_at?: string;
    deleted_count: number;
    freed_bytes: number;
    trigger: string;
    error?: string;
}

export interface SweepRunsResponse {
    data: SweepRun[];
    total: number;
}

export interface ReconcileResponse {
    orphan_keys: string[];
    missing_objects: string[];
    orphan_count: number;
    missing_count: number;
    scanned_object_count?: number;
    scanned_cms_item_count?: number;
    partial?: boolean;
    truncated_reason?: string;
}

export interface StorageArtifactEvent {
    id: string;
    tenant_id: string;
    content_item_id: string;
    parent_content_item_id?: string | null;
    event_type: string;
    status: 'success' | 'skipped' | 'error' | 'approval_required' | string;
    reason?: string;
    trigger?: string;
    source?: string;
    storage_tier?: string;
    old_storage_tier?: string;
    old_media_url?: string;
    new_media_url?: string;
    old_size_bytes?: number;
    new_size_bytes?: number;
    freed_bytes?: number;
    deleted_bytes?: number;
    quality_profile_id?: number;
    artifact_keys?: unknown;
    recovery_payload?: unknown;
    error?: string;
    created_by?: string;
    created_at: string;
}

export interface StorageArtifactEventsResponse {
    data: StorageArtifactEvent[];
    total: number;
    limit: number;
    offset?: number;
}
