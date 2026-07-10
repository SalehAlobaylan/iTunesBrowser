import { cmsClient } from '@/lib/api/client';
import type {
    PreferenceActionFilters,
    PreferenceAutopilotInsights,
    PreferenceAutopilotPolicyPatch,
    PreferenceAutopilotRun,
    PreferenceAutopilotStatus,
    PreferenceLedgerPage,
    RecomputeQueueRow,
    RunWithActions,
} from '@/types/platform/preference-autopilot';

const BASE = '/admin/preferences/autopilot';

interface CmsEnvelope<T> {
    data: T;
}

const unwrap = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    const response = await promise;
    return response.data;
};

export const getPreferenceAutopilotStatus = () =>
    unwrap(cmsClient.get<CmsEnvelope<PreferenceAutopilotStatus>>(`${BASE}/status`));

export const updatePreferenceAutopilotPolicy = (patch: PreferenceAutopilotPolicyPatch) =>
    unwrap(cmsClient.put<CmsEnvelope<PreferenceAutopilotStatus>>(`${BASE}/policy`, patch));

export const runPreferenceAutopilotNow = () =>
    unwrap(cmsClient.post<CmsEnvelope<RunWithActions>>(`${BASE}/run`, {}));

export const listPreferenceAutopilotRuns = (limit = 20) =>
    unwrap(
        cmsClient.get<CmsEnvelope<{ items: PreferenceAutopilotRun[] }>>(`${BASE}/runs`, { limit })
    );

export const getPreferenceAutopilotRunActions = (id: string) =>
    unwrap(cmsClient.get<CmsEnvelope<RunWithActions>>(`${BASE}/runs/${id}/actions`));

// Human-only catalog-topic merge (not an autopilot endpoint, but driven from the
// cockpit's merge-suggestion attention list).
export const mergeCatalogTopic = (sourceId: string, into: string) =>
    cmsClient.post<{ message: string; data: { source: string; target: string; affected_users: number } }>(
        `/admin/topics/catalog/${sourceId}/merge`,
        { into }
    );

// ─── Deep logging + ops (cockpit redesign) ─────────────────────────

export const getPreferenceAutopilotInsights = () =>
    unwrap(cmsClient.get<CmsEnvelope<PreferenceAutopilotInsights>>(`${BASE}/insights`));

export const listPreferenceAutopilotActions = (filters: PreferenceActionFilters = {}) =>
    unwrap(cmsClient.get<CmsEnvelope<PreferenceLedgerPage>>(`${BASE}/actions`, filters));

export const listRecomputeQueue = (limit = 50) =>
    unwrap(
        cmsClient.get<CmsEnvelope<{ items: RecomputeQueueRow[]; total: number }>>(
            `${BASE}/recompute-queue`,
            { limit }
        )
    );

export const requeueRecompute = (userId: string) =>
    cmsClient.post<{ message: string }>(`${BASE}/recompute-queue/requeue`, { user_id: userId });

export const deleteRecomputeRow = (userId: string) =>
    cmsClient.delete<{ message: string }>(`${BASE}/recompute-queue/${userId}`);

export const resetPreferenceCursors = (cursors: string[] = []) =>
    cmsClient.post<{ message: string }>(`${BASE}/cursors/reset`, { cursors });

// Human-only one-click revert of a quarantined autopilot-approved topic.
export const revertAutopilotTopic = (topicId: string) =>
    cmsClient.post<{ message: string; data: { slug: string; affected_users: number } }>(
        `/admin/topics/catalog/${topicId}/revert-autopilot`,
        {}
    );
