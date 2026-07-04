import { redirect } from 'next/navigation';

// The media-value diagnostics folded into the redesigned Intelligence hub
// (which is now the media-value control room). This route stays alive as a
// redirect so existing deep links — e.g. from the Media Circulation cockpit —
// still land somewhere sensible.
export default function MediaValueRedirect() {
    redirect('/platform/intelligence');
}
