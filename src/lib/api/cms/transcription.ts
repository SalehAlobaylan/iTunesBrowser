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

export const triggerStt = (id: string) =>
    createTranscriptionJob({ content_id: id, force: true, trigger_source: 'manual' });
