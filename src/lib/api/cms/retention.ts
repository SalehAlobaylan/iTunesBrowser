import { cmsClient } from '@/lib/api/client';
import type {
    RetentionAction,
    RetentionCompactionManifest,
    RetentionHistoricalManifest,
    RetentionMaintenanceReport,
    RetentionOwnerRequest,
    RetentionHold,
    RetentionPolicy,
    RetentionRun,
    RetentionStatus,
    MonthlyReviewArchive,
    MonthlyReviewPolicyVersion,
} from '@/types/platform/retention';

type Envelope<T> = { data: T };
const unwrap = async <T>(request: Promise<Envelope<T>>) => (await request).data;
const BASE = '/admin/retention';

export const getRetentionStatus = () =>
    unwrap(cmsClient.get<Envelope<RetentionStatus>>(`${BASE}/status`));
export const getRetentionPolicy = () =>
    unwrap(cmsClient.get<Envelope<RetentionPolicy>>(`${BASE}/policy`));
export const updateRetentionPolicy = (patch: Partial<RetentionPolicy>) =>
    unwrap(cmsClient.put<Envelope<RetentionPolicy>>(`${BASE}/policy`, patch));
export const runRetention = () =>
    unwrap(cmsClient.post<Envelope<RetentionRun>>(`${BASE}/run`, {}));
export const prepareRetentionCompaction = () =>
    unwrap(cmsClient.post<Envelope<RetentionCompactionManifest>>(`${BASE}/compaction/prepare`, {}));
export const approveRetentionAction = (id: string) =>
    unwrap(cmsClient.post<Envelope<RetentionAction>>(`${BASE}/actions/${id}/approve`, {}));
export const executeRetentionAction = (id: string) =>
    unwrap(cmsClient.post<Envelope<RetentionAction>>(`${BASE}/actions/${id}/execute`, {}));
export const resetRetentionBreaker = (actionClass: string) =>
    unwrap(cmsClient.post<Envelope<Record<string, unknown>>>(`${BASE}/autopilot/breakers/${encodeURIComponent(actionClass)}/reset`, {}));
export const prepareHistoricalRetention = () =>
    unwrap(cmsClient.post<Envelope<RetentionHistoricalManifest>>(`${BASE}/historical/prepare`, {}));
export const executeHistoricalRetention = (id: string) =>
    unwrap(cmsClient.post<Envelope<RetentionAction>>(`${BASE}/historical/actions/${id}/execute`, {}));
export const createRetentionMaintenanceReport = () =>
    unwrap(cmsClient.post<Envelope<RetentionMaintenanceReport>>(`${BASE}/maintenance/report`, {}));
export const prepareRetentionOwnerRequest = (owner: 'storage' | 'media_circulation') =>
    unwrap(cmsClient.post<Envelope<{ request: RetentionOwnerRequest }>>(`${BASE}/owners/${owner}/prepare`, {}));
export const executeRetentionOwnerRequest = (id: string) =>
    unwrap(cmsClient.post<Envelope<{ request_id: string; result: Record<string, unknown> }>>(`${BASE}/owner-requests/${id}/execute`, {}));
export const listRetentionOwnerRequests = () =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionOwnerRequest[] }>>(`${BASE}/owner-requests`));
export const pauseRetention = (minutes: number) =>
    unwrap(cmsClient.post<Envelope<{ paused_until: string }>>(`${BASE}/pause`, { minutes }));
export const listRetentionRuns = () =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionRun[] }>>(`${BASE}/runs`));
export const listRetentionRunActions = (runId: string) =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionAction[] }>>(`${BASE}/runs/${runId}/actions`));
export const listRetentionHolds = () =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionHold[] }>>(`${BASE}/holds`));
export const getMonthlyReviewPolicy = () =>
    unwrap(cmsClient.get<Envelope<MonthlyReviewPolicyVersion>>(`${BASE}/monthly-review/policy`));
export const updateMonthlyReviewPolicy = (config: MonthlyReviewPolicyVersion['config'], reason: string) =>
    unwrap(cmsClient.post<Envelope<MonthlyReviewPolicyVersion>>(`${BASE}/monthly-review/policy`, { config, reason }));
export const listMonthlyReviewArchives = () =>
    unwrap(cmsClient.get<Envelope<{ items: MonthlyReviewArchive[] }>>(`${BASE}/monthly-review/archives`));
export const buildMonthlyReview = (month: string) =>
    unwrap(cmsClient.post<Envelope<MonthlyReviewArchive>>(`${BASE}/monthly-review/archives/${month}/build`, {}));
export const verifyMonthlyReview = (month: string) =>
    unwrap(cmsClient.post<Envelope<MonthlyReviewArchive>>(`${BASE}/monthly-review/archives/${month}/verify`, {}));
