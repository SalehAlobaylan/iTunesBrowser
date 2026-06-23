import { cmsClient } from '@/lib/api/client';
import type {
    TranscriptionConfig,
    UpdateTranscriptionConfigRequest,
} from '@/types/platform/media';
import type { TranscriptionJobSummary } from '@/types/platform/content';

interface CmsEnvelope<T> {
    data: T;
    code: number;
    message: string;
}

const unwrapCmsData = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    const response = await promise;
    return response.data;
};

// ── STT / transcription config (GET/PATCH return the raw config object) ──────

export const getTranscriptionConfig = () =>
    cmsClient.get<TranscriptionConfig>('/admin/transcription-config');

export const updateTranscriptionConfig = (data: UpdateTranscriptionConfigRequest) =>
    cmsClient.patch<TranscriptionConfig>('/admin/transcription-config', data);

export interface CreateTranscriptionJobRequest {
    content_id: string;
    force?: boolean;
    trigger_source?: string;
}

export interface CreateTranscriptionJobResponse {
    job: TranscriptionJobSummary;
    triggered: boolean;
    reason?: string;
}

export interface BulkCreateTranscriptionJobsResponse {
    accepted: number;
    skipped: number;
    failed: number;
    results: Array<{
        content_id: string;
        status: string;
        job_id?: string;
        reason?: string;
        error?: string;
    }>;
}

export interface TranscriptionBatchItem {
    id: string;
    content_item_id: string;
    job_id?: string;
    job?: TranscriptionJobSummary;
    status: 'pending' | 'accepted' | 'skipped' | 'failed' | 'canceled' | 'done';
    reason?: string;
    error?: string;
    created_at: string;
    updated_at: string;
}

export interface TranscriptionBatch {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'canceled' | 'failed';
    force: boolean;
    actor?: string;
    total_count: number;
    accepted_count: number;
    skipped_count: number;
    failed_count: number;
    canceled_count: number;
    completed_count: number;
    latest_error?: string;
    canceled_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    items?: TranscriptionBatchItem[];
}

export interface TranscriptionBatchListResponse {
    data: TranscriptionBatch[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ListTranscriptionBatchesParams {
    status?: 'active' | 'terminal' | TranscriptionBatch['status'] | 'all';
    page?: number;
    limit?: number;
}

export interface ListTranscriptionJobsParams {
    status?: TranscriptionJobSummary['status'];
    content_id?: string;
    limit?: number;
}

export interface RepairSweepResponse {
    accepted: number;
    skipped: number;
    failed: number;
    reasons: Record<string, number>;
    results: Array<{
        content_id: string;
        status: 'accepted' | 'skipped' | 'failed';
        job_id?: string;
        reason?: string;
        error?: string;
    }>;
    job_ids: string[];
}

export const createTranscriptionJob = (data: CreateTranscriptionJobRequest) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<CreateTranscriptionJobResponse>>(
            '/admin/transcription/jobs',
            data
        )
    );

export const bulkCreateTranscriptionJobs = (contentIds: string[], force = true) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<BulkCreateTranscriptionJobsResponse>>(
            '/admin/transcription/jobs/bulk',
            { content_ids: contentIds, force }
        )
    );

export const createTranscriptionBatch = (contentIds: string[], force = true) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TranscriptionBatch>>(
            '/admin/transcription/batches',
            { content_ids: contentIds, force }
        )
    );

export const getTranscriptionBatch = (id: string) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<TranscriptionBatch>>(
            `/admin/transcription/batches/${id}`
        )
    );

export const listTranscriptionBatches = (params?: ListTranscriptionBatchesParams) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<TranscriptionBatchListResponse>>(
            '/admin/transcription/batches',
            params
        )
    );

export const cancelTranscriptionBatch = (id: string) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TranscriptionBatch>>(
            `/admin/transcription/batches/${id}/cancel`,
            {}
        )
    );

export const listTranscriptionJobs = (params?: ListTranscriptionJobsParams) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<TranscriptionJobSummary[]>>(
            '/admin/transcription/jobs',
            params
        )
    );

export const repairTranscriptionQualitySweep = (limit = 100) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<RepairSweepResponse>>(
            `/admin/transcription/quality/repair-sweep?limit=${limit}`,
            {}
        )
    );

export const triggerStt = (id: string) =>
    createTranscriptionJob({ content_id: id, force: true, trigger_source: 'manual' });
