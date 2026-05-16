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
}
