import { cmsClient } from '@/lib/api/client';
import type {
    EnrichmentStats,
    MissingEnrichmentCounts,
    MissingEnrichmentsResponse,
    MissingEnrichmentsParams,
    EnrichmentHealthResponse,
    TriggerEnrichmentResponse,
    TriggerResultItem,
    TriggerAllResponse,
    BulkEnrichStatus,
    EnrichmentAutopilotStatus,
    EnrichmentAutopilotPolicy,
    EnrichmentAutopilotRun,
    EnrichmentAutopilotRunDetail,
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

export const getMissingEnrichmentCounts = (params?: Pick<MissingEnrichmentsParams, 'type' | 'status'>) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<MissingEnrichmentCounts>>('/admin/enrichment/missing-counts', params)
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

// ── Trigger All Missing (background run) ────────────────────

/**
 * Kick off a background run that enriches every READY item missing one of
 * `types`, scoped to `type` (a comma-separated content-type filter, e.g.
 * "VIDEO,PODCAST"). Returns immediately; poll getBulkEnrichStatus for progress.
 */
export const triggerAllEnrichment = (types: string[], type?: string, max?: number) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<TriggerAllResponse>>('/admin/enrichment/trigger-all', {
            types,
            type,
            max,
        })
    );

export const getBulkEnrichStatus = () =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<BulkEnrichStatus>>('/admin/enrichment/bulk-status')
    );

// ── Service Health ──────────────────────────────────────────

export const getEnrichmentHealth = () =>
    unwrapCmsData(cmsClient.get<CmsEnvelope<EnrichmentHealthResponse>>('/admin/enrichment/health'));

// ── Enrichment Coverage Autopilot ───────────────────────────

export const getEnrichmentAutopilot = () =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<EnrichmentAutopilotStatus>>('/admin/enrichment/autopilot')
    );

export const updateEnrichmentAutopilotPolicy = (patch: Partial<EnrichmentAutopilotPolicy>) =>
    unwrapCmsData(
        cmsClient.put<CmsEnvelope<EnrichmentAutopilotStatus>>(
            '/admin/enrichment/autopilot/policy',
            patch
        )
    );

export const runEnrichmentAutopilotNow = () =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<EnrichmentAutopilotRunDetail>>('/admin/enrichment/autopilot/run')
    );

export const pauseEnrichmentAutopilot = (minutes: number) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<{ paused_until: string | null }>>(
            '/admin/enrichment/autopilot/pause',
            { minutes }
        )
    );

export const elevateEnrichmentAutopilot = (mode: string, minutes?: number) =>
    unwrapCmsData(
        cmsClient.post<CmsEnvelope<{ mode: string; until: string | null }>>(
            '/admin/enrichment/autopilot/elevate',
            { mode, minutes }
        )
    );

export const listEnrichmentAutopilotRuns = (limit = 20) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<{ items: EnrichmentAutopilotRun[] }>>(
            '/admin/enrichment/autopilot/runs',
            { limit }
        )
    );

export const getEnrichmentAutopilotRun = (id: string) =>
    unwrapCmsData(
        cmsClient.get<CmsEnvelope<EnrichmentAutopilotRunDetail>>(
            `/admin/enrichment/autopilot/runs/${id}`
        )
    );
