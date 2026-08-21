import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const session = (await cookies()).get('console_access_token')?.value;
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const base = process.env.MIGRATION_COORDINATOR_URL?.replace(/\/$/, '');
  const token = process.env.MIGRATION_COORDINATOR_READ_TOKEN?.trim();
  if (!base || !token) return NextResponse.json({ message: 'Migration coordinator is not configured' }, { status: 503 });
  const segment = new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
  if (!segment || !['actions', 'status', 'programs'].includes(segment)) return NextResponse.json({ message: 'Unsupported migration coordinator read' }, { status: 404 });
  try {
    const response = await fetch(`${base}/admin/database-migrations/${segment}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { 'content-type': 'application/json' } });
  } catch { return NextResponse.json({ message: 'Migration coordinator unavailable' }, { status: 502 }); }
}
