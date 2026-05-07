// Quality Management types — shape mirrors CMS adminQualityController responses.

export type VideoCodec = 'h264' | 'h265' | 'av1';
export type AudioCodec = 'aac' | 'opus';

export interface QualityProfile {
    id: number;
    tenant_id?: string | null;
    name: string;
    description: string;
    video_codec: VideoCodec;
    max_height: number;
    target_bitrate_kbps: number;
    crf: number;
    preset: string;
    audio_codec: AudioCodec;
    audio_bitrate_kbps: number;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface QualityProfileInput {
    scope?: 'global' | 'tenant';
    name: string;
    description: string;
    video_codec: VideoCodec;
    max_height: number;
    target_bitrate_kbps: number;
    crf: number;
    preset: string;
    audio_codec: AudioCodec;
    audio_bitrate_kbps: number;
    is_default?: boolean;
    is_active?: boolean;
}

export interface QualityRule {
    id: number;
    tenant_id?: string | null;
    name: string;
    enabled: boolean;
    priority: number;
    min_age_days: number;
    max_view_count?: number | null;
    max_views_per_day?: number | null;
    content_type: string;
    source_id?: number | null;
    only_if_higher_than?: number | null;
    target_profile_id: number;
    sweep_interval_minutes: number;
    last_sweep_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface QualityRuleInput {
    scope?: 'global' | 'tenant';
    name: string;
    enabled?: boolean;
    priority?: number;
    min_age_days?: number;
    max_view_count?: number | null;
    max_views_per_day?: number | null;
    content_type?: string;
    source_id?: number | null;
    only_if_higher_than?: number | null;
    target_profile_id: number;
    sweep_interval_minutes?: number;
}

export interface QualityCandidate {
    id: string;
    type: string;
    title: string;
    view_count: number;
    duration_sec?: number;
    file_size_bytes: number;
    current_bitrate_kbps?: number;
    current_quality_profile_id?: number;
    storage_tier?: string;
    created_at: string;
    projected_size_bytes: number;
    projected_savings_bytes: number;
}

export interface QualityCandidatesResponse {
    data: QualityCandidate[];
    total: number;
    limit: number;
    total_projected_bytes: number;
    total_savings_bytes: number;
    target_profile_id: number;
}

export interface QualityCandidatesParams {
    rule_id?: number;
    profile_id?: number;
    min_age_days?: number;
    max_view_count?: number;
    content_type?: string;
    limit?: number;
}

export interface ReEncodeRequest {
    ids?: string[];
    rule_id?: number;
    profile_id?: number;
    trigger?: string;
    dry_run?: boolean;
}

export interface ReEncodeResponse {
    enqueued: number;
    estimated_freed_bytes: number;
    dry_run?: boolean;
}

export interface ProbeProjectionEntry {
    profile_id: number;
    profile_name: string;
    projected_size_bytes: number;
    projected_savings_bytes: number;
}

export interface ProbeResult {
    content_item_id: string;
    duration_sec?: number;
    width?: number;
    height?: number;
    bitrate_kbps?: number;
    video_codec?: string;
    audio_codec?: string;
    file_size_bytes: number;
    storage_tier?: string;
    current_quality_profile_id?: number;
    projections: ProbeProjectionEntry[];
}

export interface QualityHistoryEntry {
    id: number;
    content_item_id: string;
    tenant_id: string;
    from_profile_id?: number | null;
    to_profile_id: number;
    original_size_bytes: number;
    new_size_bytes: number;
    savings_bytes: number;
    original_bitrate_kbps: number;
    new_bitrate_kbps: number;
    duration_ms: number;
    trigger: string;
    rule_id?: number | null;
    error?: string;
    created_at: string;
}

export interface QualityHistoryResponse {
    data: QualityHistoryEntry[];
    total: number;
}

export interface ProfileSavingsEntry {
    profile_id: number;
    profile_name: string;
    item_count: number;
    bytes_saved: number;
}

export interface QualityStats {
    total_reencoded: number;
    total_bytes_saved: number;
    estimated_egress_saved_bytes: number;
    savings_by_profile: ProfileSavingsEntry[];
    last_reencode_at?: string;
    items_at_non_default_profile: number;
}
