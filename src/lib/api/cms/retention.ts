import { cmsClient } from '@/lib/api/client';
import type {
    RetentionAction,
    RetentionCompactionManifest,
    RetentionHold,
    RetentionPolicy,
    RetentionRun,
    RetentionStatus,
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
export const pauseRetention = (minutes: number) =>
    unwrap(cmsClient.post<Envelope<{ paused_until: string }>>(`${BASE}/pause`, { minutes }));
export const listRetentionRuns = () =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionRun[] }>>(`${BASE}/runs`));
export const listRetentionRunActions = (runId: string) =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionAction[] }>>(`${BASE}/runs/${runId}/actions`));
export const listRetentionHolds = () =>
    unwrap(cmsClient.get<Envelope<{ items: RetentionHold[] }>>(`${BASE}/holds`));
