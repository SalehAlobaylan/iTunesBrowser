import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACCESS_COOKIE = 'console_access_token';
const PROBE_TIMEOUT_MS = 10_000;

type RestartTarget = 'cms' | 'iam' | 'aggregation' | 'enrichment';

interface RestartBody {
    service?: RestartTarget;
}

interface TargetConfig {
    name: RestartTarget;
    envKey: string;
    path: string;
    auth: 'cookie-jwt' | 'service-token';
}

const TARGETS: Record<RestartTarget, TargetConfig> = {
    cms: { name: 'cms', envKey: 'CMS_BASE_URL', path: '/admin/restart', auth: 'cookie-jwt' },
    iam: {
        name: 'iam',
        envKey: 'IAM_BASE_URL',
        path: '/api/v1/admin/restart',
        auth: 'cookie-jwt',
    },
    aggregation: {
        name: 'aggregation',
        envKey: 'AGGREGATION_BASE_URL',
        path: '/admin/restart',
        auth: 'cookie-jwt',
    },
    enrichment: {
        name: 'enrichment',
        envKey: 'ENRICHMENT_BASE_URL',
        path: '/v1/admin/restart',
        auth: 'service-token',
    },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    let body: RestartBody;
    try {
        body = (await request.json()) as RestartBody;
    } catch {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const service = body.service;
    if (!service || !TARGETS[service]) {
        return NextResponse.json(
            { message: `service must be one of: ${Object.keys(TARGETS).join(', ')}` },
            { status: 400 }
        );
    }

    const target = TARGETS[service];
    const baseUrl = process.env[target.envKey];
    if (!baseUrl) {
        return NextResponse.json(
            { message: `${target.envKey} is not configured` },
            { status: 500 }
        );
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });

    if (target.auth === 'cookie-jwt') {
        const cookieStore = await cookies();
        const token = cookieStore.get(ACCESS_COOKIE)?.value;
        if (!token) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            );
        }
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        const serviceToken = process.env.ENRICHMENT_SERVICE_TOKEN;
        if (!serviceToken) {
            return NextResponse.json(
                { message: 'ENRICHMENT_SERVICE_TOKEN is not configured' },
                { status: 500 }
            );
        }
        headers.set('Authorization', `Bearer ${serviceToken}`);
    }

    const url = `${baseUrl.replace(/\/$/, '')}${target.path}`;

    try {
        const upstream = await fetch(url, {
            method: 'POST',
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });

        const text = await upstream.text();
        let parsed: unknown = null;
        try {
            parsed = text ? JSON.parse(text) : null;
        } catch {
            parsed = text;
        }

        return NextResponse.json(
            { service, upstreamStatus: upstream.status, upstreamBody: parsed },
            { status: upstream.ok ? 202 : upstream.status }
        );
    } catch (err) {
        return NextResponse.json(
            {
                service,
                message: 'Restart request failed',
                error: err instanceof Error ? err.message : 'Unknown error',
            },
            { status: 502 }
        );
    }
}
