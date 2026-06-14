import { cmsClient } from '@/lib/api/client';
import type {
    DiscoveryProfile,
    CreateProfileRequest,
    UpdateProfileRequest,
    NewsSource,
    ListResponse,
    SuggestionsResponse,
    SuggestedProfileDraft,
    DiscoveryConfig,
} from '@/types/platform/discovery';

// ---------- Profiles ----------

export async function listProfiles(): Promise<ListResponse<DiscoveryProfile>> {
    return cmsClient.get<ListResponse<DiscoveryProfile>>('/admin/discovery/profiles');
}

export async function createProfile(data: CreateProfileRequest): Promise<DiscoveryProfile> {
    return cmsClient.post<DiscoveryProfile>('/admin/discovery/profiles', data);
}

export async function updateProfile(id: string, data: UpdateProfileRequest): Promise<DiscoveryProfile> {
    return cmsClient.put<DiscoveryProfile>(`/admin/discovery/profiles/${id}`, data);
}

export async function deleteProfile(id: string): Promise<void> {
    return cmsClient.delete<void>(`/admin/discovery/profiles/${id}`);
}

export async function runProfile(id: string): Promise<{ message: string; job_id?: string }> {
    return cmsClient.post<{ message: string; job_id?: string }>(`/admin/discovery/profiles/${id}/run`);
}

export async function suggestProfiles(): Promise<ListResponse<SuggestedProfileDraft>> {
    return cmsClient.post<ListResponse<SuggestedProfileDraft>>('/admin/discovery/suggest-profiles');
}

// ---------- Suggestions ----------

export async function listSuggestions(params: {
    status?: string;
    profile_id?: string;
    page?: number;
    limit?: number;
}): Promise<SuggestionsResponse> {
    return cmsClient.get<SuggestionsResponse>('/admin/discovery/suggestions', params);
}

export async function approveSuggestion(id: string): Promise<unknown> {
    return cmsClient.post<unknown>(`/admin/discovery/suggestions/${id}/approve`);
}

export async function rejectSuggestion(id: string, reason?: string): Promise<unknown> {
    return cmsClient.post<unknown>(`/admin/discovery/suggestions/${id}/reject`, reason ? { reason } : {});
}

export async function bulkApproveSuggestions(ids: string[]): Promise<unknown> {
    return cmsClient.post<unknown>('/admin/discovery/suggestions/bulk-approve', { ids });
}

export async function bulkRejectSuggestions(ids: string[]): Promise<unknown> {
    return cmsClient.post<unknown>('/admin/discovery/suggestions/bulk-reject', { ids });
}

// ---------- Active news sources (hub) ----------

export async function listNewsSources(profileId?: string): Promise<ListResponse<NewsSource>> {
    return cmsClient.get<ListResponse<NewsSource>>(
        '/admin/discovery/sources',
        profileId ? { profile_id: profileId } : undefined
    );
}

// ---------- Config (tuning + scheduling) ----------

export async function getDiscoveryConfig(): Promise<DiscoveryConfig> {
    return cmsClient.get<DiscoveryConfig>('/admin/discovery/config');
}

export async function updateDiscoveryConfig(data: DiscoveryConfig): Promise<DiscoveryConfig> {
    return cmsClient.put<DiscoveryConfig>('/admin/discovery/config', data);
}
