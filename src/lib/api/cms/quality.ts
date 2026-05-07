import { cmsClient } from '@/lib/api/client';
import type {
    ProbeResult,
    QualityCandidatesParams,
    QualityCandidatesResponse,
    QualityHistoryResponse,
    QualityProfile,
    QualityProfileInput,
    QualityRule,
    QualityRuleInput,
    QualityStats,
    ReEncodeRequest,
    ReEncodeResponse,
} from '@/types/platform/quality';

// Profiles -------------------------------------------------------------------

export async function listQualityProfiles(scope: 'all' | 'global' | 'tenant' = 'all'): Promise<{ data: QualityProfile[] }> {
    return cmsClient.get<{ data: QualityProfile[] }>('/admin/quality/profiles', { scope });
}

export async function createQualityProfile(input: QualityProfileInput): Promise<QualityProfile> {
    return cmsClient.post<QualityProfile>('/admin/quality/profiles', input);
}

export async function updateQualityProfile(id: number, input: QualityProfileInput): Promise<QualityProfile> {
    return cmsClient.put<QualityProfile>(`/admin/quality/profiles/${id}`, input);
}

export async function deleteQualityProfile(id: number): Promise<{ success: boolean }> {
    return cmsClient.delete<{ success: boolean }>(`/admin/quality/profiles/${id}`);
}

// Rules ----------------------------------------------------------------------

export async function listQualityRules(): Promise<{ data: QualityRule[] }> {
    return cmsClient.get<{ data: QualityRule[] }>('/admin/quality/rules');
}

export async function createQualityRule(input: QualityRuleInput): Promise<QualityRule> {
    return cmsClient.post<QualityRule>('/admin/quality/rules', input);
}

export async function updateQualityRule(id: number, input: QualityRuleInput): Promise<QualityRule> {
    return cmsClient.put<QualityRule>(`/admin/quality/rules/${id}`, input);
}

export async function deleteQualityRule(id: number): Promise<{ success: boolean }> {
    return cmsClient.delete<{ success: boolean }>(`/admin/quality/rules/${id}`);
}

// Candidates / re-encode / probe / history / stats ---------------------------

export async function listQualityCandidates(params: QualityCandidatesParams): Promise<QualityCandidatesResponse> {
    return cmsClient.get<QualityCandidatesResponse>('/admin/quality/candidates', params);
}

export async function triggerReEncode(req: ReEncodeRequest): Promise<ReEncodeResponse> {
    return cmsClient.post<ReEncodeResponse>('/admin/quality/re-encode', req);
}

export async function probeContentItem(id: string): Promise<ProbeResult> {
    return cmsClient.post<ProbeResult>(`/admin/quality/probe/${id}`);
}

export async function listQualityHistory(limit = 50): Promise<QualityHistoryResponse> {
    return cmsClient.get<QualityHistoryResponse>('/admin/quality/history', { limit });
}

export async function getQualityStats(): Promise<QualityStats> {
    return cmsClient.get<QualityStats>('/admin/quality/stats');
}
