import { cmsClient } from '@/lib/api/client';
import type {
    ProbeResult,
    QualityProfile,
    QualityProfileInput,
    ResolveResult,
} from '@/types/platform/quality';

// Phase 7: Quality is now a pure ingest-configuration surface.
// Removed wrappers: rules CRUD, candidates, re-encode trigger, history,
// stats, queue-depth. Re-encoding is driven by Storage policies.

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

// Resolve -------------------------------------------------------------------

/**
 * Preview which profile wins for a (tenant, source_type) combination.
 * Used by the "What would apply?" widget so admins can sanity-check their
 * scoping before saving a profile or kicking off an ingest.
 */
export async function resolveQualityProfile(params: { tenant_id?: string; source_type?: string }): Promise<ResolveResult> {
    return cmsClient.get<ResolveResult>('/admin/quality/profiles/resolve', params);
}

// Probe --------------------------------------------------------------------

export async function probeContentItem(id: string): Promise<ProbeResult> {
    return cmsClient.post<ProbeResult>(`/admin/quality/probe-item/${id}`);
}
