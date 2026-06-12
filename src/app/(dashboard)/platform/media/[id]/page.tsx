import { redirect } from 'next/navigation';

interface LegacyMediaStudioRedirectProps {
    params: Promise<{ id: string }>;
}

export default async function LegacyMediaStudioRedirect({
    params,
}: LegacyMediaStudioRedirectProps) {
    const { id } = await params;
    redirect(`/platform/media-studio/${id}`);
}
