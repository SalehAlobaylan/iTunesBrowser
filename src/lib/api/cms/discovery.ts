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
    NetworkAuthority,
    MediaSourcesContext,
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
    category?: string;
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

export async function listNewsSources(profileId?: string, category?: string): Promise<ListResponse<NewsSource>> {
    const params: Record<string, string> = {};
    if (profileId) params.profile_id = profileId;
    if (category) params.category = category;
    return cmsClient.get<ListResponse<NewsSource>>(
        '/admin/discovery/sources',
        Object.keys(params).length ? params : undefined
    );
}

// ---------- Unified Media Sources context ----------

export async function getMediaSourcesContext(params?: {
    profile?: string | null;
    source?: string | null;
    suggestion?: string | null;
}): Promise<MediaSourcesContext> {
    const query: Record<string, string> = {};
    if (params?.profile) query.profile = params.profile;
    if (params?.source) query.source = params.source;
    if (params?.suggestion) query.suggestion = params.suggestion;
    return cmsClient.get<MediaSourcesContext>(
        '/admin/discovery/media-sources/context',
        Object.keys(query).length ? query : undefined,
    );
}

// ---------- Config (tuning + scheduling) ----------

export async function getDiscoveryConfig(): Promise<DiscoveryConfig> {
    return cmsClient.get<DiscoveryConfig>('/admin/discovery/config');
}

export async function updateDiscoveryConfig(data: DiscoveryConfig): Promise<DiscoveryConfig> {
    return cmsClient.put<DiscoveryConfig>('/admin/discovery/config', data);
}

export async function sweepNow(): Promise<{ message?: string }> {
    return cmsClient.post<{ message?: string }>('/admin/discovery/sweep-now');
}

export async function buildGraph(): Promise<{ message?: string }> {
    return cmsClient.post<{ message?: string }>('/admin/discovery/build-graph');
}

// ---------- Import from YouTube (manual seed) ----------

export interface ImportYouTubeResult {
    success?: boolean;
    channels?: number;
    imported?: number;
    upserted?: number;
    skipped?: number;
    message?: string;
}

// Paste a raw youtubei/v1 response (e.g. a personalized home feed); the backend
// parses the channels, enriches each via guest InnerTube, and queues them as
// suggestions for review under the given interest.
export async function importYouTubeFeed(
    raw: unknown,
    profileId?: string,
): Promise<ImportYouTubeResult> {
    return cmsClient.post<ImportYouTubeResult>('/admin/discovery/import-youtube', {
        raw,
        profile_id: profileId,
    });
}

// Paste YouTube references (one per line: a @handle, channel URL, or any video/
// share link); the backend resolves each to its channel via guest InnerTube,
// enriches it, and queues it as a suggestion for review. The low-friction seed
// path — no DevTools JSON.
export async function importYouTubeLinks(
    inputs: string[],
    profileId?: string,
): Promise<ImportYouTubeResult> {
    return cmsClient.post<ImportYouTubeResult>('/admin/discovery/import-youtube-links', {
        inputs,
        profile_id: profileId,
    });
}

export async function getAuthorities(kind?: string): Promise<ListResponse<NetworkAuthority>> {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    return cmsClient.get<ListResponse<NetworkAuthority>>(`/admin/discovery/authorities${q}`);
}
