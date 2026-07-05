import { cmsClient } from '@/lib/api/client';
import type {
    AutopilotRunDetail,
    GenerateRecommendationsResponse,
    IntelligenceDiagnostics,
    MediaAutopilotElevatedMode,
    MediaCirculationCockpit,
    MediaCirculationHealth,
    MediaCirculationOverride,
    MediaCirculationOverrideRequest,
    MediaCirculationPolicy,
    MediaCirculationRecommendation,
    MediaCirculationRun,
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

/** GET /admin/media/circulation/intelligence */
export async function getMediaIntelligenceDiagnostics(): Promise<IntelligenceDiagnostics> {
    return cmsClient.get<IntelligenceDiagnostics>('/admin/media/circulation/intelligence');
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

// ---- Autopilot (stage 5) ----

/** POST /admin/media/circulation/autopilot/run */
export async function runMediaAutopilotNow(): Promise<{ data: AutopilotRunDetail }> {
    return cmsClient.post<{ data: AutopilotRunDetail }>('/admin/media/circulation/autopilot/run');
}

/** GET /admin/media/circulation/autopilot/runs */
export async function listMediaAutopilotRuns(limit = 20): Promise<{ data: { items: MediaCirculationRun[] } }> {
    return cmsClient.get<{ data: { items: MediaCirculationRun[] } }>(
        '/admin/media/circulation/autopilot/runs',
        { limit }
    );
}

/** GET /admin/media/circulation/autopilot/runs/:id */
export async function getMediaAutopilotRun(id: string): Promise<{ data: AutopilotRunDetail }> {
    return cmsClient.get<{ data: AutopilotRunDetail }>(`/admin/media/circulation/autopilot/runs/${id}`);
}

/** POST /admin/media/circulation/autopilot/pause — minutes=0 resumes */
export async function pauseMediaAutopilot(minutes: number): Promise<{ data: { paused_until: string | null } }> {
    return cmsClient.post<{ data: { paused_until: string | null } }>(
        '/admin/media/circulation/autopilot/pause',
        { minutes }
    );
}

/** POST /admin/media/circulation/autopilot/elevate — mode='' clears */
export async function elevateMediaAutopilot(
    mode: MediaAutopilotElevatedMode | '',
    minutes?: number
): Promise<{ data: { mode: string; until: string | null } }> {
    return cmsClient.post<{ data: { mode: string; until: string | null } }>(
        '/admin/media/circulation/autopilot/elevate',
        { mode, minutes }
    );
}
