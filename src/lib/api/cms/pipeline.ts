import { cmsClient } from '@/lib/api/client';
import type {
    StatusCounts,
    BulkStatusRequest,
    BulkStatusResponse,
    PipelineAutopilotPolicy,
    PipelineAutopilotRun,
    PipelineAutopilotRunDetail,
    PipelineAutopilotStatus,
	ContentStageHealth,
	ContentStageLane,
	ContentStageControl,
	ContentStageTrace,
} from '@/types/platform/pipeline';

interface CmsEnvelope<T> {
    data: T;
}

const unwrapCmsData = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    const response = await promise;
    return response.data;
};

function normalizePipelineAutopilotStatus(
    status: PipelineAutopilotStatus
): PipelineAutopilotStatus {
    const policy = status.policy ?? {
        tenant_id: 'default',
        enabled: status.enabled ?? false,
        mode: status.mode ?? 'observe',
        interval_minutes: status.interval_minutes ?? 180,
        max_items_per_run: 200,
        max_batches_per_run: 4,
        max_attempts: 3,
        retry_backoff_hours: 12,
        pending_age_floor_minutes: 30,
        processing_stuck_hours: 4,
        max_queue_depth: 100,
        per_source_daily_retries: 100,
        recovery_cooldown_minutes: 60,
        trust_min_outcomes: 20,
        trust_min_success_pct: 40,
    };

    return {
        ...status,
        enabled: status.enabled ?? policy.enabled ?? false,
        mode: status.mode ?? policy.mode ?? 'observe',
        state: status.state ?? 'off',
        interval_minutes: status.interval_minutes ?? policy.interval_minutes ?? 180,
        trust: Array.isArray(status.trust) ? status.trust : [],
        cohorts: Array.isArray(status.cohorts) ? status.cohorts : [],
        attention: Array.isArray(status.attention) ? status.attention : [],
        policy,
    };
}

/**
 * Get content item counts grouped by status.
 * GET /admin/content/status-counts
 */
export async function fetchStatusCounts(): Promise<StatusCounts> {
    return cmsClient.get<StatusCounts>('/admin/content/status-counts');
}

/**
 * Bulk change content item status with filters.
 * POST /admin/content/bulk-status
 */
export async function bulkStatusChange(data: BulkStatusRequest): Promise<BulkStatusResponse> {
    return cmsClient.post<BulkStatusResponse>('/admin/content/bulk-status', data);
}

export const getPipelineAutopilot = () =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<PipelineAutopilotStatus>>('/admin/pipeline/autopilot/status')
    ).then(normalizePipelineAutopilotStatus);

export const updatePipelineAutopilotPolicy = (patch: Partial<PipelineAutopilotPolicy>) =>
    unwrapCmsData(
        cmsClient.put<CmsEnvelope<PipelineAutopilotStatus>>(
            '/admin/pipeline/autopilot/policy',
            patch
        )
    ).then(normalizePipelineAutopilotStatus);

export const runPipelineAutopilotNow = () =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<PipelineAutopilotRunDetail>>('/admin/pipeline/autopilot/run')
    );

export const pausePipelineAutopilot = (minutes: number) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<{ paused_until: string | null }>>(
            '/admin/pipeline/autopilot/pause',
            { minutes }
        )
    );

export const elevatePipelineAutopilot = (mode: string, minutes?: number) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<{ mode: string; until: string | null }>>(
            '/admin/pipeline/autopilot/elevate',
            { mode, minutes }
        )
    );

export const resetPipelineAutopilotTrust = () =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<PipelineAutopilotStatus>>('/admin/pipeline/autopilot/trust/reset', {})
    );

export const listPipelineAutopilotRuns = (limit = 20) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<{ items: PipelineAutopilotRun[] }>>(
            '/admin/pipeline/autopilot/runs',
            { limit }
        )
    );

export const getPipelineAutopilotRun = (id: string) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<PipelineAutopilotRunDetail>>(
            `/admin/pipeline/autopilot/runs/${id}`
        )
    );

export const getContentStageHealth = () =>
    cmsClient.get<ContentStageHealth>('/admin/content-stages/health');

export const updateContentStageControl = (
    lane: ContentStageLane,
    patch: Partial<Pick<ContentStageControl, 'scheduling_enabled' | 'execution_enabled' | 'optional_metadata_enabled' | 'transcript_execution_enabled'>> & { reason: string }
) => cmsClient.patch<ContentStageControl>(`/admin/content-stages/${lane}/control`, patch);

export const getContentStageQualification = (lane: ContentStageLane) =>
    cmsClient.get<{ lane: ContentStageLane; verification_digest: string }>(`/admin/content-stages/${lane}/qualification`);

export const getContentStageTrace = ({ contentId, sessionId, playbackDigest }: { contentId: string; sessionId?: string; playbackDigest?: string }) => {
    const query = new URLSearchParams();
    if (sessionId?.trim()) query.set('session_id', sessionId.trim());
    if (playbackDigest?.trim()) query.set('playback_digest', playbackDigest.trim());
    const suffix = query.size ? `?${query.toString()}` : '';
    return cmsClient.get<ContentStageTrace>(`/admin/content-stages/items/${encodeURIComponent(contentId)}/trace${suffix}`);
};
