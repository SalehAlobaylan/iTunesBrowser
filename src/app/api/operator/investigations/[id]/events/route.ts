import { NextRequest, NextResponse } from 'next/server';

import { operatorEventResponseSchema } from '@/lib/operator/schemas';

const ACCESS_COOKIE = 'console_access_token';
const INVESTIGATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseCursor(request: NextRequest): number | null {
  const raw = request.headers.get('last-event-id') || request.nextUrl.searchParams.get('after') || '0';
  if (!/^(0|[1-9]\d*)$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

// This is intentionally not the generic CMS proxy. Its fixed upstream path
// makes it impossible for a browser to supply an arbitrary event target.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const cmsBaseUrl = process.env.CMS_BASE_URL?.replace(/\/$/, '');
  if (!cmsBaseUrl) return NextResponse.json({ message: 'CMS_BASE_URL is not configured' }, { status: 500 });
  const { id } = await context.params;
  if (!INVESTIGATION_ID.test(id)) return NextResponse.json({ message: 'Invalid Operator investigation' }, { status: 400 });
  const cursor = parseCursor(request);
  if (cursor === null) return NextResponse.json({ message: 'Invalid Operator event cursor' }, { status: 400 });
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });

  try {
    const upstream = await fetch(
      `${cmsBaseUrl}/admin/operator/investigations/${id}/events?after=${cursor}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(request.headers.get('x-request-id') ? { 'X-Request-ID': request.headers.get('x-request-id')! } : {}),
        },
        cache: 'no-store',
      }
    );
    const responseHeaders = new Headers();
    responseHeaders.set('content-type', upstream.headers.get('content-type') || 'application/json');
    responseHeaders.set('cache-control', 'no-store');
    if (upstream.ok) {
      const payload = operatorEventResponseSchema.safeParse(await upstream.json());
      if (!payload.success) return NextResponse.json({ message: 'CMS returned an invalid Operator event payload' }, { status: 502, headers: responseHeaders });
      return NextResponse.json(payload.data, { status: upstream.status, headers: responseHeaders });
    }
    return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ message: 'Operator event stream is unavailable' }, { status: 502 });
  }
}
