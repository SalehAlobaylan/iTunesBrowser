import { cmsClient } from '@/lib/api/client';
import type {
    PolicyOverridesResponse,
    PolicyResponse,
    PurgeRequest,
    PurgeResponse,
    ReconcileResponse,
    StorageArtifactEventsResponse,
    StorageCandidatesParams,
    StorageCandidatesResponse,
    StorageHealth,
    StoragePolicy,
    StorageRecommendationsResponse,
    StorageStats,
    SweepPreview,
    SweepRunsResponse,
    UpdatePolicyRequest,
} from '@/types/platform/storage';

/** GET /admin/storage/stats */
export async function getStorageStats(): Promise<StorageStats> {
    return cmsClient.get<StorageStats>('/admin/storage/stats');
}

/** GET /admin/storage/health */
export async function getStorageHealth(): Promise<StorageHealth> {
    return cmsClient.get<StorageHealth>('/admin/storage/health');
}

/** GET /admin/storage/recommendations */
export async function getStorageRecommendations(): Promise<StorageRecommendationsResponse> {
    return cmsClient.get<StorageRecommendationsResponse>('/admin/storage/recommendations');
}

/** GET /admin/storage/preview */
export async function getStoragePreview(): Promise<SweepPreview> {
    return cmsClient.get<SweepPreview>('/admin/storage/preview');
}

/** GET /admin/storage/candidates */
export async function listStorageCandidates(
    params?: StorageCandidatesParams
): Promise<StorageCandidatesResponse> {
    return cmsClient.get<StorageCandidatesResponse>('/admin/storage/candidates', params);
}

/** GET /admin/storage/artifact-events */
export async function listStorageArtifactEvents(limit = 25): Promise<StorageArtifactEventsResponse> {
    return cmsClient.get<StorageArtifactEventsResponse>('/admin/storage/artifact-events', { limit });
}

/** POST /admin/storage/purge */
export async function purgeStorage(data: PurgeRequest): Promise<PurgeResponse> {
    return cmsClient.post<PurgeResponse>('/admin/storage/purge', data);
}

/** POST /admin/storage/restore/:id */
export async function restoreStorageItem(id: string): Promise<{ success: boolean; message: string }> {
    return cmsClient.post<{ success: boolean; message: string }>(`/admin/storage/restore/${id}`);
}

/** GET /admin/storage/policy */
export async function getStoragePolicy(scope: 'global' | 'tenant' = 'tenant'): Promise<PolicyResponse> {
    return cmsClient.get<PolicyResponse>('/admin/storage/policy', { scope });
}

/** PUT /admin/storage/policy */
export async function updateStoragePolicy(data: UpdatePolicyRequest): Promise<StoragePolicy> {
    return cmsClient.put<StoragePolicy>('/admin/storage/policy', data);
}

/** GET /admin/storage/policy/overrides */
export async function listPolicyOverrides(): Promise<PolicyOverridesResponse> {
    return cmsClient.get<PolicyOverridesResponse>('/admin/storage/policy/overrides');
}

/** DELETE /admin/storage/policy/overrides/:tenant_id */
export async function deletePolicyOverride(tenantId: string): Promise<{ success: boolean }> {
    return cmsClient.delete<{ success: boolean }>(`/admin/storage/policy/overrides/${tenantId}`);
}

/** POST /admin/storage/policy/run-now */
export async function runSweepNow(): Promise<{ success: boolean; message: string }> {
    return cmsClient.post<{ success: boolean; message: string }>('/admin/storage/policy/run-now');
}

/** GET /admin/storage/sweep-runs */
export async function listSweepRuns(limit = 50): Promise<SweepRunsResponse> {
    return cmsClient.get<SweepRunsResponse>('/admin/storage/sweep-runs', { limit });
}

/** POST /admin/storage/reconcile */
export async function reconcileStorage(): Promise<ReconcileResponse> {
    return cmsClient.post<ReconcileResponse>('/admin/storage/reconcile');
}
