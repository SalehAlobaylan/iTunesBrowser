import type { ServiceName } from '@/types/platform/system-health';

export type RestartTarget = Exclude<ServiceName, 'platform'>;

interface RestartResponse {
    service: RestartTarget;
    upstreamStatus?: number;
    upstreamBody?: unknown;
}

export async function restartService(service: RestartTarget): Promise<RestartResponse> {
    const resp = await fetch('/api/system-health/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
        cache: 'no-store',
    });

    if (!resp.ok) {
        let detail = '';
        try {
            const body = (await resp.json()) as { message?: string; error?: string };
            detail = body.message || body.error || '';
        } catch {
            // ignore
        }
        throw new Error(
            detail || `Restart failed (HTTP ${resp.status})`
        );
    }

    return (await resp.json()) as RestartResponse;
}
