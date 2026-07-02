import { cmsClient } from '@/lib/api/client';
import type {
    GenerateRecommendationsResponse,
    MediaCirculationCockpit,
    MediaCirculationHealth,
    MediaCirculationOverride,
    MediaCirculationOverrideRequest,
    MediaCirculationPolicy,
    MediaCirculationRecommendation,
    OverrideListResponse,
    RecommendationListResponse,
    RecommendationUnitType,
} from '@/types/platform/media-circulation';

/** GET /admin/media/circulation/health */
export async function getMediaCirculationHealth(): Promise<MediaCirculationHealth> {
    return cmsClient.get<MediaCirculationHealth>('/admin/media/circulation/health');
}

/** GET /admin/media/circulation/cockpit */
export async function getMediaCirculationCockpit(): Promise<MediaCirculationCockpit> {
    return cmsClient.get<MediaCirculationCockpit>('/admin/media/circulation/cockpit');
}

/** GET /admin/media/circulation/policy */
export async function getMediaCirculationPolicy(): Promise<MediaCirculationPolicy> {
    return cmsClient.get<MediaCirculationPolicy>('/admin/media/circulation/policy');
}

/** PUT /admin/media/circulation/policy */
export async function updateMediaCirculationPolicy(
    data: Partial<MediaCirculationPolicy>
): Promise<MediaCirculationPolicy> {
    return cmsClient.put<MediaCirculationPolicy>('/admin/media/circulation/policy', data);
}

/** GET /admin/media/circulation/overrides */
export async function listMediaCirculationOverrides(): Promise<OverrideListResponse> {
    return cmsClient.get<OverrideListResponse>('/admin/media/circulation/overrides');
}

/** POST /admin/media/circulation/overrides */
export async function createMediaCirculationOverride(
    data: MediaCirculationOverrideRequest
): Promise<{ data: MediaCirculationOverride }> {
    return cmsClient.post<{ data: MediaCirculationOverride }>(
        '/admin/media/circulation/overrides',
        data
    );
}

/** DELETE /admin/media/circulation/overrides/:id */
export async function deleteMediaCirculationOverride(id: string): Promise<{ success: boolean }> {
    return cmsClient.delete<{ success: boolean }>(`/admin/media/circulation/overrides/${id}`);
}

/** GET /admin/media/circulation/recommendations */
export async function listMediaCirculationRecommendations(params: {
    unit_type?: RecommendationUnitType;
    status?: string;
}): Promise<RecommendationListResponse> {
    return cmsClient.get<RecommendationListResponse>(
        '/admin/media/circulation/recommendations',
        params
    );
}

/** POST /admin/media/circulation/recommendations/generate */
export async function generateMediaCirculationRecommendations(): Promise<GenerateRecommendationsResponse> {
    return cmsClient.post<GenerateRecommendationsResponse>(
        '/admin/media/circulation/recommendations/generate'
    );
}

/** POST /admin/media/circulation/recommendations/:id/apply */
export async function applyMediaCirculationRecommendation(
    id: string
): Promise<{ data: MediaCirculationRecommendation }> {
    return cmsClient.post<{ data: MediaCirculationRecommendation }>(
        `/admin/media/circulation/recommendations/${id}/apply`
    );
}

/** POST /admin/media/circulation/recommendations/:id/dismiss */
export async function dismissMediaCirculationRecommendation(
    id: string
): Promise<{ data: MediaCirculationRecommendation }> {
    return cmsClient.post<{ data: MediaCirculationRecommendation }>(
        `/admin/media/circulation/recommendations/${id}/dismiss`
    );
}

/** POST /admin/media/circulation/recommendations/:id/revert */
export async function revertMediaCirculationRecommendation(
    id: string
): Promise<{ data: MediaCirculationRecommendation }> {
    return cmsClient.post<{ data: MediaCirculationRecommendation }>(
        `/admin/media/circulation/recommendations/${id}/revert`
    );
}
