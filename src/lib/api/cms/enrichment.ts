import { cmsClient } from '@/lib/api/client';
import type {
    EnrichmentStats,
    MissingEnrichmentsResponse,
    MissingEnrichmentsParams,
    EnrichmentHealthResponse,
    TriggerEnrichmentResponse,
    TriggerResultItem,
} from '@/types/platform/enrichment';

interface CmsEnvelope<T> {
    data: T;
    code: number;
    message: string;
}

const unwrapCmsData = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    const response = await promise;
    return response.data;
};

// ── Stats ───────────────────────────────────────────────────

export const getEnrichmentStats = () =>
    unwrapCmsData(cmsClient.get<CmsEnvelope<EnrichmentStats>>('/admin/enrichment/stats'));

// ── Missing Enrichments ─────────────────────────────────────

export const getMissingEnrichments = (params?: MissingEnrichmentsParams) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<MissingEnrichmentsResponse>>('/admin/enrichment/missing', params)
    );

// ── Trigger Single ──────────────────────────────────────────

export const triggerEnrichment = (
    id: string,
    types: string[] = ['transcript', 'embedding', 'news']
) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TriggerEnrichmentResponse>>(
            `/admin/enrichment/trigger/${id}`,
            { types }
        )
    );

// ── Trigger Batch ───────────────────────────────────────────

/** Backend caps trigger-batch at 10 ids per call. Callers must chunk. */
export const ENRICHMENT_BATCH_LIMIT = 10;

/** Default enrichment passes triggered when the caller doesn't specify. */
export const DEFAULT_ENRICHMENT_TYPES: string[] = [
    'transcript',
    'embedding',
    'news',
];

export const triggerBatchEnrichment = (
    contentIds: string[],
    types: string[] = DEFAULT_ENRICHMENT_TYPES
) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TriggerResultItem[]>>('/admin/enrichment/trigger-batch', {
            content_ids: contentIds,
            types,
        })
    );

// ── Service Health ──────────────────────────────────────────

export const getEnrichmentHealth = () =>
    unwrapCmsData(cmsClient.get<CmsEnvelope<EnrichmentHealthResponse>>('/admin/enrichment/health'));
