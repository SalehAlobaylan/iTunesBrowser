import { cmsClient } from '@/lib/api/client';
import type {
    ExperienceAction,
    ExperienceIncident,
    ExperienceMetrics,
    ExperiencePolicy,
    ExperienceRun,
    ExperienceStatus,
    ExperienceSuppression,
    IncidentCloseReason,
} from '@/types/platform/real-experience';

type Envelope<T> = { data: T };
const unwrap = async <T>(request: Promise<Envelope<T>>) => (await request).data;
const BASE = '/admin/experience';

export const getExperienceStatus = () =>
    unwrap(cmsClient.get<Envelope<ExperienceStatus>>(`${BASE}/status`));
export const getExperienceMetrics = () =>
    unwrap(cmsClient.get<Envelope<ExperienceMetrics>>(`${BASE}/metrics`));
export const updateExperiencePolicy = (patch: Partial<ExperiencePolicy>) =>
    unwrap(cmsClient.put<Envelope<ExperiencePolicy>>(`${BASE}/policy`, patch));
export const runExperienceNow = () =>
    unwrap(cmsClient.post<Envelope<ExperienceRun>>(`${BASE}/run`, {}));
export const pauseExperienceSchedule = (minutes: number) =>
    unwrap(cmsClient.post<Envelope<ExperiencePolicy>>(`${BASE}/pause`, { minutes }));
export const listExperienceRuns = () =>
    unwrap(cmsClient.get<Envelope<ExperienceRun[]>>(`${BASE}/runs`));
export const listExperienceIncidents = (status?: string) =>
    unwrap(cmsClient.get<Envelope<ExperienceIncident[]>>(`${BASE}/incidents${status ? `?status=${status}` : ''}`));
export const closeExperienceIncident = (id: string, reason_class: IncidentCloseReason, notes = '') =>
    unwrap(cmsClient.post<Envelope<ExperienceIncident>>(`${BASE}/incidents/${id}/close`, { reason_class, notes }));
export const listExperienceActions = () =>
    unwrap(cmsClient.get<Envelope<ExperienceAction[]>>(`${BASE}/actions?limit=100`));
export const listExperienceSuppressions = () =>
    unwrap(cmsClient.get<Envelope<ExperienceSuppression[]>>(`${BASE}/suppressions`));
export const createExperienceSuppression = (payload: { metric_key?: string; surface?: string; reason: string; ttl_minutes: number }) =>
    unwrap(cmsClient.post<Envelope<ExperienceSuppression>>(`${BASE}/suppressions`, payload));
export const revokeExperienceSuppression = (id: string) =>
    unwrap(cmsClient.delete<Envelope<ExperienceSuppression>>(`${BASE}/suppressions/${id}`));
