import { cmsClient } from '@/lib/api/client';

// Embedding & Model Lifecycle System (stage 10) — Console API client.
// The vector-space custodian: provenance audit + bounded re-embed campaigns.

const BASE = '/admin/embedding-lifecycle';

export interface EmbeddingExpectedSpace {
    Space: string;
    SpaceID: string;
    Dimensions: number;
    Model: string;
    Revision: string;
    ObservedAt: string;
    Err: string;
}

export interface EmbeddingSurface {
    Key: string;
    Label: string;
    Space: string;
    Kind: string;
    Owner: string;
    Dim: number;
    Recipe: string;
}

export interface EmbeddingPolicy {
    audit_enabled: boolean;
    audit_interval_minutes: number;
    numeric_sample_size: number;
    items_per_batch: number;
    batches_per_run: number;
    daily_item_cap: number;
    retry_ceiling: number;
    campaigns_paused_until?: string | null;
    last_audit_at?: string | null;
}

export interface EmbeddingRun {
    id: number;
    trigger: string;
    status: string;
    headline: string;
    per_surface?: Record<string, SurfaceSummary>;
    violations_major: number;
    violations_minor: number;
    check_errors: number;
    started_at: string;
    completed_at?: string;
    duration_ms: number;
}

export interface SurfaceSummary {
    verdict: string;
    with_vec: number;
    current: number;
    stale: number;
    unstamped: number;
    missing: number;
    mixed_space: number;
    space: string;
    note?: string;
    expected_space_id?: string;
}

export interface EmbeddingStatus {
    policy: EmbeddingPolicy;
    latest_run: EmbeddingRun;
    surfaces: EmbeddingSurface[];
    spaces: { text: EmbeddingExpectedSpace; image: EmbeddingExpectedSpace };
}

export interface EmbeddingCampaign {
    id: number;
    space: string;
    state: string;
    target_space_id: string;
    target_model: string;
    target_revision: string;
    items_per_batch: number;
    daily_item_cap: number;
    completed_count: number;
    failed_count: number;
    skipped_count: number;
    started_by?: string;
    approval_reason?: string;
    blocked_reason?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface EmbeddingCampaignAction {
    id: number;
    surface_key: string;
    tool: string;
    target_id: string;
    status: string;
    guardrail?: string;
    reason?: string;
    retry_number: number;
    latency_ms: number;
    created_at: string;
}

export interface EmbeddingCampaignException {
    id: number;
    surface_key: string;
    target_id: string;
    failure_class?: string;
    attempts: number;
    status: string;
    waiver_reason?: string;
    waiver_expires?: string;
}

export interface CampaignPreview {
    space: string;
    expected_space_id: string;
    resolved: boolean;
    dim_ok: boolean;
    surfaces: { key: string; kind: string; targets: number }[];
    total_targets: number;
    blockers: string[];
}

export const getEmbeddingStatus = () => cmsClient.get<EmbeddingStatus>(`${BASE}/status`);
export const updateEmbeddingPolicy = (patch: Partial<EmbeddingPolicy>) =>
    cmsClient.put<EmbeddingPolicy>(`${BASE}/policy`, patch);
export const runEmbeddingAudit = () => cmsClient.post<EmbeddingRun>(`${BASE}/run`, {});
export const listEmbeddingRuns = () => cmsClient.get<{ runs: EmbeddingRun[] }>(`${BASE}/runs`);
export const getEmbeddingRun = (id: number) =>
    cmsClient.get<{ run: EmbeddingRun; findings: unknown[] }>(`${BASE}/runs/${id}`);
export const listEmbeddingFindings = (params?: Record<string, string>) =>
    cmsClient.get<{ findings: unknown[] }>(`${BASE}/findings`, params);

export const previewCampaign = (space: string) =>
    cmsClient.post<CampaignPreview>(`${BASE}/campaigns/preview`, { space });
export const listCampaigns = () => cmsClient.get<{ campaigns: EmbeddingCampaign[] }>(`${BASE}/campaigns`);
export const getCampaign = (id: number) =>
    cmsClient.get<{ campaign: EmbeddingCampaign; actions: EmbeddingCampaignAction[]; exceptions: EmbeddingCampaignException[] }>(`${BASE}/campaigns/${id}`);
export const createCampaign = (space: string) =>
    cmsClient.post<EmbeddingCampaign>(`${BASE}/campaigns`, { space });
export const startCampaign = (id: number, reason: string) =>
    cmsClient.post<EmbeddingCampaign>(`${BASE}/campaigns/${id}/start`, { reason });
export const pauseCampaign = (id: number) => cmsClient.post<EmbeddingCampaign>(`${BASE}/campaigns/${id}/pause`, {});
export const resumeCampaign = (id: number) => cmsClient.post<EmbeddingCampaign>(`${BASE}/campaigns/${id}/resume`, {});
export const abortCampaign = (id: number) => cmsClient.post<EmbeddingCampaign>(`${BASE}/campaigns/${id}/abort`, {});
export const retryEmbeddingException = (id: number) =>
    cmsClient.post<EmbeddingCampaignException>(`${BASE}/exceptions/${id}/retry`, {});
export const waiveEmbeddingException = (id: number, reason: string, expiryHours: number) =>
    cmsClient.post<EmbeddingCampaignException>(`${BASE}/exceptions/${id}/waive`, { reason, expiry_hours: expiryHours });
