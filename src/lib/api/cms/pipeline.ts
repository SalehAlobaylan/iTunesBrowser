import { cmsClient } from '@/lib/api/client';
import type {
    StatusCounts,
    BulkStatusRequest,
    BulkStatusResponse,
    PipelineAutopilotPolicy,
    PipelineAutopilotRun,
    PipelineAutopilotRunDetail,
    PipelineAutopilotStatus,
} from '@/types/platform/pipeline';

interface CmsEnvelope<T> {
    data: T;
}

const unwrapCmsData = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    const response = await promise;
    return response.data;
};

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
    );

export const updatePipelineAutopilotPolicy = (patch: Partial<PipelineAutopilotPolicy>) =>
    unwrapCmsData(
        cmsClient.put<CmsEnvelope<PipelineAutopilotStatus>>(
            '/admin/pipeline/autopilot/policy',
            patch
        )
    );

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
