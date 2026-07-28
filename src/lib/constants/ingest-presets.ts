/**
 * Ingest Profile Presets — the load-bearing UX simplification of Phase 8.
 *
 * Five named recipes that map to real operator intents. The Console's "New
 * profile" flow asks the operator to pick one, then pre-fills every form
 * field from the chosen preset. Only operators with truly non-standard needs
 * touch the Custom path.
 *
 * Numbers are calibrated against Wahb's reality: mobile-first vertical
 * video feeds on Cloudflare R2's 5 GB free tier, podcast support via the
 * still-image MP4 wrapper, data-saver tier for emerging-market viewers.
 *
 * Editing these values is fine; the values just ship in the bundle. Older
 * profiles spawned from a preset retain their stored field values (the
 * preset_key remembers lineage, not live binding).
 */
import {
    Smartphone,
    Sparkles,
    Archive,
    Mic,
    Wifi,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import type { QualityProfileInput } from '@/types/platform/quality';

export interface IngestPreset {
    /** Stable key written to `quality_profiles.preset_key`. Never change once shipped. */
    key: string;
    displayName: string;
    icon: LucideIcon;
    /** Tailwind text-color class for the card icon + accent border. */
    accentColor: string;
    /** Single-sentence summary used on the preset card. */
    tagline: string;
    /** 2-3 sentence longer description shown in the form's "what this preset does" panel. */
    description: string;
    /** Use-case tags rendered as small badges on the preset card. */
    bestFor: string[];
    /** Plain-English estimate, e.g. "~55% smaller than default". */
    estimatedReduction: string;
    /** Plain-English estimate, e.g. "Indistinguishable on phones". */
    estimatedQuality: string;
    /** Single-line technical summary, e.g. "720p · H.264 · CRF 26 · AAC 96k · mp4". */
    keySpecs: string;
    /** True for the preset we want to highlight as the default recommendation. */
    recommended?: boolean;
    /**
     * The fully-filled profile input that gets copied into the form when the
     * operator selects this preset. Every field must be set so the form
     * never sees `undefined` from a missing key.
     */
    profile: QualityProfileInput;
}

/** Preset key for the "build your own" path. Not in INGEST_PRESETS. */
export const CUSTOM_PRESET_KEY = 'custom';

/**
 * Reusable defaults for fields that are the same across most presets.
 * Centralized so a global tweak (e.g. "all presets should use the medium
 * preset for slower-but-tighter encodes") is one edit.
 */
const COMMON_INPUT_BASE = {
    output_container: 'mp4' as const,
    allowed_input_mime_types: [] as string[], // empty = accept anything
    max_input_size_bytes: null,
    max_input_duration_sec: null,
    is_active: true,
    scope: 'global' as const,
    source_type: null,
    name: '',
    description: '',
};

export const INGEST_PRESETS: IngestPreset[] = [
    // -----------------------------------------------------------------
    // 1) Mobile Feed — the recommended default for Wahb's primary use case.
    // -----------------------------------------------------------------
    {
        key: 'mobile-feed',
        displayName: 'Mobile Feed',
        icon: Smartphone,
        accentColor: 'text-cyan-400',
        recommended: true,
        tagline: 'TikTok-style vertical / horizontal feeds on phones.',
        description:
            'The right choice for the Pods feed and most video ingest. Caps resolution at 720p (saturates a phone screen), uses CRF 26 for a strong size-vs-quality balance, and 96 kbps AAC audio that sounds great over phone speakers / earbuds without wasting bytes.',
        bestFor: ['Vertical feeds', 'News slides', 'Mobile UGC'],
        estimatedReduction: '~55% smaller than default',
        estimatedQuality: 'Indistinguishable on a 6" screen',
        keySpecs: '720p · H.264 · CRF 26 · AAC 96k · mp4',
        profile: {
            ...COMMON_INPUT_BASE,
            video_codec: 'h264',
            max_height: 720,
            target_bitrate_kbps: 0,
            crf: 26,
            preset: 'fast',
            audio_codec: 'aac',
            audio_bitrate_kbps: 96,
            thumbnail_offset_seconds: 2,
            thumbnail_max_height: 360,
        },
    },

    // -----------------------------------------------------------------
    // 2) High Quality — hero / premium content destined for desktop preview.
    // -----------------------------------------------------------------
    {
        key: 'high-quality',
        displayName: 'High Quality',
        icon: Sparkles,
        accentColor: 'text-amber-400',
        tagline: 'Premium content where quality matters more than bytes.',
        description:
            'Near-source quality at 1080p with CRF 22 and 160 kbps audio. Use for hero items, anything destined for desktop preview, or content where the source recording cost real money. Storage cost is modest (~10% smaller than raw); CPU cost is higher because we use the `medium` preset for a tighter encode.',
        bestFor: ['Hero content', 'Desktop preview', 'Premium uploads'],
        estimatedReduction: '~10% smaller (mostly unchanged)',
        estimatedQuality: 'Near-source',
        keySpecs: '1080p · H.264 · CRF 22 · AAC 160k · mp4',
        profile: {
            ...COMMON_INPUT_BASE,
            video_codec: 'h264',
            max_height: 1080,
            target_bitrate_kbps: 0,
            crf: 22,
            preset: 'medium',
            audio_codec: 'aac',
            audio_bitrate_kbps: 160,
            thumbnail_offset_seconds: 3,
            thumbnail_max_height: 540,
        },
    },

    // -----------------------------------------------------------------
    // 3) Storage Saver — the natural partner for archive_action='re_encode'.
    // -----------------------------------------------------------------
    {
        key: 'storage-saver',
        displayName: 'Storage Saver',
        icon: Archive,
        accentColor: 'text-emerald-400',
        tagline: 'Aggressive shrink for old / low-engagement content.',
        description:
            'Pair this with a storage policy whose archive_action is "re-encode" to shrink old / low-engagement items in place. 480p / CRF 28 / 64 kbps audio. Files end up roughly 25% of the original size. Visibly softer than the source, but fine for occasional revisits where storage cost matters more than fidelity.',
        bestFor: ['Archival', 'Re-encode action', 'Old content'],
        estimatedReduction: '~75% smaller than default',
        estimatedQuality: 'Visibly softer, fine for casual viewing',
        keySpecs: '480p · H.264 · CRF 28 · AAC 64k · mp4',
        profile: {
            ...COMMON_INPUT_BASE,
            video_codec: 'h264',
            max_height: 480,
            target_bitrate_kbps: 0,
            crf: 28,
            preset: 'medium',
            audio_codec: 'aac',
            audio_bitrate_kbps: 64,
            thumbnail_offset_seconds: 2,
            thumbnail_max_height: 240,
        },
    },

    // -----------------------------------------------------------------
    // 4) Podcast — audio-driven, video side pinned (still-image MP4 trick).
    // -----------------------------------------------------------------
    {
        key: 'podcast',
        displayName: 'Podcast',
        icon: Mic,
        accentColor: 'text-purple-400',
        tagline: 'Audio-first content. Cover-art video, quality audio.',
        description:
            'For PODCAST source types. The pipeline produces an MP4 wrapper around the audio (Pods feed needs a video container), with a static cover image as the visual track. Audio side gets 128 kbps AAC. The "video" side encodes are fast and cheap because the image never changes.',
        bestFor: ['Podcasts', 'Audio-only sources', 'Telegram voice notes'],
        estimatedReduction: 'N/A (audio-dominated)',
        estimatedQuality: 'Matches source audio',
        keySpecs: 'Audio: AAC 128k · Cover: 480p H.264 CRF 30 · mp4',
        profile: {
            ...COMMON_INPUT_BASE,
            source_type: 'PODCAST',
            video_codec: 'h264',
            max_height: 480,
            target_bitrate_kbps: 0,
            crf: 30,
            preset: 'fast',
            audio_codec: 'aac',
            audio_bitrate_kbps: 128,
            // Grab the cover frame near the start.
            thumbnail_offset_seconds: 0,
            thumbnail_max_height: 360,
        },
    },

    // -----------------------------------------------------------------
    // 5) Data Saver — emerging-market / metered-data viewers.
    // -----------------------------------------------------------------
    {
        key: 'data-saver',
        displayName: 'Data Saver',
        icon: Wifi,
        accentColor: 'text-orange-400',
        tagline: 'Tiny files for users on 3G or metered data plans.',
        description:
            'Aggressive 360p / CRF 30 / 48 kbps audio for the smallest reasonable mobile experience. Watchable, low-detail. Choose this when bandwidth or per-user data caps are the binding constraint — not storage cost.',
        bestFor: ['3G networks', 'Metered data', 'Emerging markets'],
        estimatedReduction: '~90% smaller than default',
        estimatedQuality: 'Watchable, low-detail',
        keySpecs: '360p · H.264 · CRF 30 · AAC 48k · mp4',
        profile: {
            ...COMMON_INPUT_BASE,
            video_codec: 'h264',
            max_height: 360,
            target_bitrate_kbps: 0,
            crf: 30,
            preset: 'fast',
            audio_codec: 'aac',
            audio_bitrate_kbps: 48,
            thumbnail_offset_seconds: 2,
            thumbnail_max_height: 180,
        },
    },
];

/** Convenience: O(1) lookup by key. */
const presetsByKey: Record<string, IngestPreset> = Object.fromEntries(
    INGEST_PRESETS.map((p) => [p.key, p])
);

export function getPreset(key: string | null | undefined): IngestPreset | null {
    if (!key) return null;
    return presetsByKey[key] ?? null;
}

/** Metadata shown on the "Custom" card — kept here so the picker stays declarative. */
export const CUSTOM_PRESET_META = {
    key: CUSTOM_PRESET_KEY,
    displayName: 'Custom',
    icon: Wrench,
    accentColor: 'text-muted-foreground',
    tagline: 'Build your own — full control of every field.',
    description: 'Empty form. Use when none of the presets fit your workflow.',
};
