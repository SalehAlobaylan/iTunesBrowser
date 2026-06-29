import { redirect } from 'next/navigation';

export default function MediaStudioIndexRedirect() {
    redirect('/platform/media/atomization?tab=studio');
}
