import { redirect } from 'next/navigation';

interface MediaStudioItemRedirectProps {
    params: Promise<{ id: string }>;
}

export default async function MediaStudioItemRedirect({ params }: MediaStudioItemRedirectProps) {
    const { id } = await params;
    redirect(`/platform/media/atomization?tab=studio&item=${encodeURIComponent(id)}`);
}
