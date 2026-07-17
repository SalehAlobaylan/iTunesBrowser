import { cmsClient } from '@/lib/api/client';
import type {
  SystemAutopilotPolicy,
  SystemAutopilotRun,
  SystemAutopilotRunDetail,
  SystemAutopilotStatus,
  SystemIncidentEpisode,
  SystemIncidentEpisodeDetail,
} from '@/types/platform/system-autopilot';

const BASE = '/admin/system/autopilot';

interface CmsEnvelope<T> {
  data: T;
}

const unwrap = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
  const response = await promise;
  return response.data;
};

function normalizeSystemAutopilotStatus(
  status: SystemAutopilotStatus
): SystemAutopilotStatus {
  const policy = status.policy ?? {
    scope: 'platform' as const,
    enabled: false,
    mode: 'observe' as const,
    interval_minutes: 10,
    confirm_probes: 2,
    resolve_probes: 3,
    flap_cycles_24h: 3,
    containment_ttl_minutes: 60,
    containment_disabled_for: [
      'news_circulation',
      'media_circulation',
      'media_studio',
    ],
  };
  return {
    ...status,
    policy,
    state: status.state ?? (policy.enabled ? policy.mode : 'off'),
    latest_run: status.latest_run ?? null,
    open_episodes: Array.isArray(status.open_episodes)
      ? status.open_episodes
      : [],
    recent_episodes: Array.isArray(status.recent_episodes)
      ? status.recent_episodes
      : [],
    registered_autopilots: Array.isArray(status.registered_autopilots)
      ? status.registered_autopilots
      : [],
  };
}

export const getSystemAutopilotStatus = () =>
  unwrap(
    cmsClient.get<CmsEnvelope<SystemAutopilotStatus>>(`${BASE}/status`)
  ).then(normalizeSystemAutopilotStatus);

export const getSystemAutopilotPolicy = () =>
  unwrap(cmsClient.get<CmsEnvelope<SystemAutopilotPolicy>>(`${BASE}/policy`));

export const updateSystemAutopilotPolicy = (
  patch: Partial<SystemAutopilotPolicy>
) =>
  unwrap(
    cmsClient.put<CmsEnvelope<SystemAutopilotPolicy>>(`${BASE}/policy`, patch)
  );

export const runSystemAutopilotNow = () =>
  unwrap(cmsClient.post<CmsEnvelope<SystemAutopilotRunDetail>>(`${BASE}/run`));

export const pauseSystemAutopilotContainment = (minutes: number) =>
  unwrap(
    cmsClient.post<CmsEnvelope<{ containment_paused_until: string | null }>>(
      `${BASE}/pause`,
      {
        minutes,
      }
    )
  );

export const listSystemIncidentEpisodes = (limit = 50) =>
  unwrap(
    cmsClient.get<CmsEnvelope<{ items: SystemIncidentEpisode[] }>>(
      `${BASE}/episodes`,
      {
        limit,
      }
    )
  );

export const getSystemIncidentEpisode = (id: string) =>
  unwrap(
    cmsClient.get<CmsEnvelope<SystemIncidentEpisodeDetail>>(
      `${BASE}/episodes/${id}`
    )
  );

export const closeSystemIncidentEpisode = (id: string, reason: string) =>
  unwrap(
    cmsClient.post<CmsEnvelope<SystemIncidentEpisode>>(
      `${BASE}/episodes/${id}/close`,
      {
        reason,
      }
    )
  );

export const listSystemAutopilotRuns = (limit = 20) =>
  unwrap(
    cmsClient.get<CmsEnvelope<{ items: SystemAutopilotRun[] }>>(
      `${BASE}/runs`,
      {
        limit,
      }
    )
  );

export const getSystemAutopilotRun = (id: string) =>
  unwrap(
    cmsClient.get<CmsEnvelope<SystemAutopilotRunDetail>>(`${BASE}/runs/${id}`)
  );
