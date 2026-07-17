import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP_RESPONSE_HEADERS = [
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
    'upgrade',
];

const ACCESS_COOKIE = 'console_access_token';

interface ProxyHandlers {
    GET: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
    POST: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
    PUT: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
    PATCH: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
    DELETE: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
    OPTIONS: (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => Promise<NextResponse>;
}

export function createProxyHandlers(envVarName: string): ProxyHandlers {
    async function proxy(
        request: NextRequest,
        context: { params: Promise<{ path: string[] }> }
    ): Promise<NextResponse> {
        const baseUrl = process.env[envVarName];
        if (!baseUrl) {
            return NextResponse.json(
                { message: `${envVarName} is not configured` },
                { status: 500 }
            );
        }

        try {
            const { path } = await context.params;
            const incomingUrl = new URL(request.url);
            const targetPath = path.join('/');
            const targetUrl = `${baseUrl.replace(/\/$/, '')}/${targetPath}${incomingUrl.search}`;

            const headers = new Headers(request.headers);
            headers.delete('host');
            headers.delete('cookie');
            headers.delete('content-length');

            if (!headers.has('authorization')) {
                const cookieStore = await cookies();
                const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
                if (accessToken) {
                    headers.set('Authorization', `Bearer ${accessToken}`);
                }
            }

            const body =
                request.method === 'GET' || request.method === 'HEAD'
                    ? undefined
                    : await request.arrayBuffer();

            const upstream = await fetch(targetUrl, {
                method: request.method,
                headers,
                body,
                cache: 'no-store',
            });

            const responseHeaders = new Headers(upstream.headers);
            for (const h of HOP_BY_HOP_RESPONSE_HEADERS) {
                responseHeaders.delete(h);
            }

            // Fetch exposes a zero-length ArrayBuffer even when an upstream
            // correctly returns 204. Passing that buffer to NextResponse still
            // counts as a response body, which is invalid for 204/205/304 and
            // turns successful DELETEs into a proxy 502.
            if ([204, 205, 304].includes(upstream.status)) {
                return new NextResponse(null, {
                    status: upstream.status,
                    headers: responseHeaders,
                });
            }

            const responseBody = await upstream.arrayBuffer();

            return new NextResponse(responseBody, {
                status: upstream.status,
                headers: responseHeaders,
            });
        } catch (error) {
            return NextResponse.json(
                {
                    message: 'Proxy request failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                { status: 502 }
            );
        }
    }

    return {
        GET: proxy,
        POST: proxy,
        PUT: proxy,
        PATCH: proxy,
        DELETE: proxy,
        OPTIONS: proxy,
    };
}
