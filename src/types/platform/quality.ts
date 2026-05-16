// Quality / Ingest Configuration types — shape mirrors CMS adminQualityController
// after the Phase 7 pivot.
//
// Removed in Phase 7 (re-encoding is now a Storage system action):
//   - QualityRule / QualityRuleInput
//   - QualityCandidate / QualityCandidatesResponse / QualityCandidatesParams
//   - ReEncodeRequest / ReEncodeResponse
//   - QualityHistoryEntry / QualityHistoryResponse
//   - QualityStats / ProfileSavingsEntry
//   - QualityQueueDepth

export type VideoCodec = 'h264' | 'h265' | 'av1';
export type AudioCodec = 'aac' | 'opus';
export type OutputContainer = 'mp4' | 'webm' | 'mov';

/** Subset of models.SourceType the resolver and forms recognise. */
export type IngestSourceType =
    | 'RSS'
    | 'WEBSITE'
    | 'TELEGRAM'
    | 'PODCAST'
    | 'YOUTUBE'
    | 'UPLOAD'
    | 'MANUAL';

export interface QualityProfile {
    id: number;
    tenant_id?: string | null;
    source_type?: IngestSourceType | null;
    name: string;
    description: string;

    // Encode params
    video_codec: VideoCodec;
    max_height: number;
    target_bitrate_kbps: number;
    crf: number;
    preset: string;
    audio_codec: AudioCodec;
    audio_bitrate_kbps: number;

    // Output container — drives file extension chosen by the media worker.
    output_container: OutputContainer;

    // Thumbnail extraction params.
    thumbnail_offset_seconds: number;
    thumbnail_max_height: number;

    // Input pre-flight constraints. Empty/null array = accept anything.
    allowed_input_mime_types?: string[] | null;
    max_input_size_bytes?: number | null;
    max_input_duration_sec?: number | null;

    /** Phase 8: which Console preset (if any) spawned this profile.
     *  Empty string = custom / hand-built. Descriptive metadata only. */
    preset_key?: string;

    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface QualityProfileInput {
    scope?: 'global' | 'tenant';
    source_type?: IngestSourceType | null;
    name: string;
    description: string;
    video_codec: VideoCodec;
    max_height: number;
    target_bitrate_kbps: number;
    crf: number;
    preset: string;
    audio_codec: AudioCodec;
    audio_bitrate_kbps: number;
    output_container: OutputContainer;
    thumbnail_offset_seconds: number;
    thumbnail_max_height: number;
    allowed_input_mime_types?: string[];
    max_input_size_bytes?: number | null;
    max_input_duration_sec?: number | null;
    /** Preset lineage tag — '' for custom-built profiles. */
    preset_key?: string;
    is_active?: boolean;
}

export interface ResolveResult {
    profile?: QualityProfile;
    /** tenant+source | tenant | source | global | none */
    matched_on: string;
    used_default?: boolean;
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
    projections: ProbeProjectionEntry[];
}
