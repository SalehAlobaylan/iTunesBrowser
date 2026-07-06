import { cmsClient } from '@/lib/api/client';
import type {
    MediaStudioAutopilotInsights,
    MediaStudioAutopilotPolicy,
    MediaStudioAutopilotStatus,
    MediaStudioRun,
    MediaStudioRunDetail,
} from '@/types/platform/media-studio-autopilot';

const BASE = '/admin/media/studio/autopilot';

/** GET /admin/media/studio/autopilot/status — cockpit read-model. */
export async function getStudioAutopilotStatus(): Promise<MediaStudioAutopilotStatus> {
    const res = await cmsClient.get<{ data: MediaStudioAutopilotStatus }>(`${BASE}/status`);
    return res.data;
}

/** GET /admin/media/studio/autopilot/insights — visualization rollups. */
export async function getStudioAutopilotInsights(): Promise<MediaStudioAutopilotInsights> {
    const res = await cmsClient.get<{ data: MediaStudioAutopilotInsights }>(`${BASE}/insights`);
    return res.data;
}

/** GET /admin/media/studio/autopilot/policy */
export async function getStudioAutopilotPolicy(): Promise<MediaStudioAutopilotPolicy> {
    const res = await cmsClient.get<{ data: MediaStudioAutopilotPolicy }>(`${BASE}/policy`);
    return res.data;
}

/** PUT /admin/media/studio/autopilot/policy */
export async function updateStudioAutopilotPolicy(
    data: Partial<MediaStudioAutopilotPolicy>
): Promise<MediaStudioAutopilotPolicy> {
    const res = await cmsClient.put<{ data: MediaStudioAutopilotPolicy }>(`${BASE}/policy`, data);
    return res.data;
}

/** POST /admin/media/studio/autopilot/run — manual bounded run. */
export async function runStudioAutopilotNow(): Promise<MediaStudioRunDetail> {
    const res = await cmsClient.post<{ data: MediaStudioRunDetail }>(`${BASE}/run`);
    return res.data;
}

/** GET /admin/media/studio/autopilot/runs */
export async function listStudioAutopilotRuns(limit = 20): Promise<MediaStudioRun[]> {
    const res = await cmsClient.get<{ data: { items: MediaStudioRun[] } }>(
        `${BASE}/runs?limit=${limit}`
    );
    return res.data.items;
}

/** GET /admin/media/studio/autopilot/runs/:id */
export async function getStudioAutopilotRun(id: string): Promise<MediaStudioRunDetail> {
    const res = await cmsClient.get<{ data: MediaStudioRunDetail }>(`${BASE}/runs/${id}`);
    return res.data;
}

/** POST /admin/media/studio/autopilot/pause */
export async function pauseStudioAutopilot(minutes: number): Promise<{ paused_until: string }> {
    const res = await cmsClient.post<{ data: { paused_until: string } }>(`${BASE}/pause`, {
        minutes,
    });
    return res.data;
}
