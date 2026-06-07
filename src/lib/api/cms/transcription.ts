import { cmsClient } from '@/lib/api/client';
import type {
    TranscriptionConfig,
    UpdateTranscriptionConfigRequest,
} from '@/types/platform/media';
import type { TriggerEnrichmentResponse } from '@/types/platform/enrichment';

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

// ── Manual STT upgrade (force bypasses the toggle; budget cap still applies) ──

export const triggerStt = (id: string) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TriggerEnrichmentResponse>>(
            `/admin/enrichment/trigger/${id}`,
            { types: ['transcript'], force: true }
        )
    );
