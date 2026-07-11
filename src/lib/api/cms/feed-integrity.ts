import { cmsClient } from '@/lib/api/client';
import type {
    FeedIntegrityEpisode,
    FeedIntegrityFinding,
    FeedIntegrityPolicy,
    FeedIntegrityRun,
    FeedIntegrityStatus,
    FeedIntegritySuppression,
    FeedIntegrityTier,
    FeedIntegrityAction,
    FeedIntegrityAutopilotStatus,
} from '@/types/platform/feed-integrity';

type Envelope<T> = { data: T };
const unwrap = async <T>(request: Promise<Envelope<T>>) => (await request).data;
const BASE = '/admin/feed-integrity';

export const getFeedIntegrityStatus = () =>
    unwrap(cmsClient.get<Envelope<FeedIntegrityStatus>>(`${BASE}/status`));
export const updateFeedIntegrityPolicy = (patch: Partial<FeedIntegrityPolicy>) =>
    unwrap(cmsClient.put<Envelope<FeedIntegrityPolicy>>(`${BASE}/policy`, patch));
export const runFeedIntegrity = (tier: FeedIntegrityTier) =>
    unwrap(cmsClient.post<Envelope<FeedIntegrityRun>>(`${BASE}/run`, { tier }));
export const pauseFeedIntegritySchedule = (minutes: number) =>
    unwrap(cmsClient.post<Envelope<{ paused_until: string | null }>>(`${BASE}/schedule/pause`, { minutes }));
export const listFeedIntegrityRuns = () =>
    unwrap(cmsClient.get<Envelope<{ items: FeedIntegrityRun[] }>>(`${BASE}/runs`));
export const listFeedIntegrityFindings = () =>
    unwrap(cmsClient.get<Envelope<{ items: FeedIntegrityFinding[] }>>(`${BASE}/findings`));
export const listFeedIntegrityEpisodes = () =>
    unwrap(cmsClient.get<Envelope<{ items: FeedIntegrityEpisode[] }>>(`${BASE}/episodes`));
export const closeFeedIntegrityEpisode = (id: string, reason_class = 'resolved') =>
    unwrap(cmsClient.post<Envelope<FeedIntegrityEpisode>>(`${BASE}/episodes/${id}/close`, { reason_class }));
export const revokeFeedIntegritySuppression = (id: string) =>
    unwrap(cmsClient.delete<Envelope<{ revoked_at: string }>>(`${BASE}/suppressions/${id}`));
export const getFeedIntegrityAutopilotStatus = () =>
    unwrap(cmsClient.get<Envelope<FeedIntegrityAutopilotStatus>>(`${BASE}/autopilot/status`));
export const updateFeedIntegrityAutopilotPolicy = (patch: Partial<FeedIntegrityPolicy>) =>
    unwrap(cmsClient.put<Envelope<FeedIntegrityPolicy>>(`${BASE}/autopilot/policy`, patch));
export const runFeedIntegrityAutopilot = () =>
    unwrap(cmsClient.post<Envelope<FeedIntegrityRun>>(`${BASE}/autopilot/run`, {}));
export const pauseFeedIntegrityAutopilot = (minutes: number) =>
    unwrap(cmsClient.post<Envelope<{ autopilot_paused_until: string | null }>>(`${BASE}/autopilot/pause`, { minutes }));
export const listFeedIntegrityAutopilotActions = () =>
    unwrap(cmsClient.get<Envelope<{ items: FeedIntegrityAction[] }>>(`${BASE}/autopilot/actions?limit=100`));
export const approveFeedIntegrityAutopilotAction = (id: string) =>
    unwrap(cmsClient.post<Envelope<FeedIntegrityAction>>(`${BASE}/autopilot/actions/${id}/approve`, {}));
export const rejectFeedIntegrityAutopilotAction = (id: string, reason: string) =>
    unwrap(cmsClient.post<Envelope<FeedIntegrityAction>>(`${BASE}/autopilot/actions/${id}/reject`, { reason }));
