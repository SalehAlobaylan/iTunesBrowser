// Transcription / STT admin config for the Media tab.

export interface TranscriptionConfig {
    tenant_id: string;
    /** Auto-run STT on auto-caption / caption-less media when ON. */
    auto_stt_enabled: boolean;
    /** Informational engine name for the UI badge (actual engine is a Media env). */
    provider: string;
    /** Rolling 30-day spend cap in USD. 0 = no cap. */
    monthly_budget_cap_usd: number;
    /** Estimated STT spend in the current window (server-managed, read-only). */
    monthly_spend_usd: number;
    monthly_reserved_usd: number;
    auto_repair_enabled: boolean;
    quality_review_threshold: number;
    quality_auto_repair_threshold: number;
    monthly_window_start: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateTranscriptionConfigRequest {
    auto_stt_enabled?: boolean;
    provider?: string;
    monthly_budget_cap_usd?: number;
    auto_repair_enabled?: boolean;
    quality_review_threshold?: number;
    quality_auto_repair_threshold?: number;
}
