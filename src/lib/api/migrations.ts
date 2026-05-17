interface MigrateUpUpstreamBody {
    message?: string;
    applied?: boolean;
    // null when no migrations have been applied yet (vs 0 which would mean version zero)
    start_version?: number | null;
    current_version?: number | null;
    dirty?: boolean;
}

export interface MigrateUpResponse {
    service: 'iam';
    upstreamStatus: number;
    upstreamBody: MigrateUpUpstreamBody;
}

export async function migrateUp(service: 'iam' = 'iam'): Promise<MigrateUpResponse> {
    const resp = await fetch('/api/system-health/migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
        cache: 'no-store',
    });

    if (!resp.ok) {
        let detail = '';
        try {
            const body = (await resp.json()) as {
                message?: string;
                error?: string;
                upstreamBody?: { error?: string; details?: string };
            };
            detail =
                body.upstreamBody?.error ||
                body.upstreamBody?.details ||
                body.message ||
                body.error ||
                '';
        } catch {
            // ignore parse failure
        }
        throw new Error(detail || `Migration failed (HTTP ${resp.status})`);
    }

    return (await resp.json()) as MigrateUpResponse;
}
