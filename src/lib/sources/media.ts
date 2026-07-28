import type { ContentSource } from '@/types/platform/source';

// Telegram media kinds that feed the Pods pipeline. A Telegram channel that
// only pulls text/photo (e.g. a news channel) is NOT a media source.
const TELEGRAM_MEDIA_KINDS = ['audio', 'voice', 'video'];

/** A Telegram channel configured to pull audio/voice/video (feeds Pods). */
export function isMediaTelegram(s: ContentSource): boolean {
    if (s.type !== 'TELEGRAM') return false;
    const mediaTypes = (s.api_config as { media_types?: unknown } | undefined)?.media_types;
    return (
        Array.isArray(mediaTypes) &&
        mediaTypes.some((m) => typeof m === 'string' && TELEGRAM_MEDIA_KINDS.includes(m))
    );
}

/**
 * A source belongs on the Media surface if it's media-category, or a Telegram
 * channel configured to pull audio/voice/video. Dual Telegram channels show in
 * both Media and Feeds Finding.
 */
export function isMediaSource(s: ContentSource): boolean {
    return s.category === 'media' || isMediaTelegram(s);
}
