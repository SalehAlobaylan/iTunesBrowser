import type {
    SourceType,
    ContentSource,
    PreviewSourceResponse,
    CreateSourceRequest,
} from '@/types/platform/source';

export type WizardStep = 1 | 2 | 3 | 4;

export interface YoutubeConfig {
    max_results?: number;
    max_age_hours?: number;
    min_duration_minutes?: number;
    max_duration_minutes?: number;
}

export type TelegramMediaType = 'audio' | 'voice' | 'video' | 'photo' | 'text';

export interface TelegramConfig {
    channel_username?: string;
    media_types: TelegramMediaType[];
    min_duration_sec?: number;
    max_duration_sec?: number;
    max_results?: number;
    max_age_hours?: number;
    min_text_length?: number;
}

export interface WizardState {
    step: WizardStep;
    type: SourceType | null;
    feedUrl: string;
    name: string;
    fetchIntervalMinutes: number;
    isActive: boolean;
    youtube: YoutubeConfig;
    telegram: TelegramConfig;
    previewResult: PreviewSourceResponse | null;
    hasPreviewedSinceLastEdit: boolean;
}

export const initialWizardState: WizardState = {
    step: 1,
    type: null,
    feedUrl: '',
    name: '',
    fetchIntervalMinutes: 60,
    isActive: true,
    youtube: { max_results: 20 },
    telegram: { media_types: ['audio', 'voice'], min_duration_sec: 120 },
    previewResult: null,
    hasPreviewedSinceLastEdit: false,
};

export type WizardAction =
    | { kind: 'set_step'; step: WizardStep }
    | { kind: 'set_type'; type: SourceType }
    | { kind: 'set_feed_url'; url: string }
    | { kind: 'set_name'; name: string }
    | { kind: 'set_fetch_interval'; minutes: number }
    | { kind: 'set_is_active'; active: boolean }
    | { kind: 'patch_youtube'; patch: Partial<YoutubeConfig> }
    | { kind: 'patch_telegram'; patch: Partial<TelegramConfig> }
    | { kind: 'toggle_telegram_media'; media: TelegramMediaType; on: boolean }
    | { kind: 'set_preview_result'; result: PreviewSourceResponse | null }
    | { kind: 'mark_edited' };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.kind) {
        case 'set_step':
            return { ...state, step: action.step };
        case 'set_type': {
            // Switching type wipes type-specific config and any previous preview.
            if (action.type === state.type) return state;
            return {
                ...initialWizardState,
                step: state.step,
                type: action.type,
                // Carry the chosen interval forward — it's type-agnostic and useful as a default.
                fetchIntervalMinutes: state.fetchIntervalMinutes,
            };
        }
        case 'set_feed_url':
            return {
                ...state,
                feedUrl: action.url,
                hasPreviewedSinceLastEdit: false,
                previewResult: null,
            };
        case 'set_name':
            return { ...state, name: action.name };
        case 'set_fetch_interval':
            return { ...state, fetchIntervalMinutes: action.minutes };
        case 'set_is_active':
            return { ...state, isActive: action.active };
        case 'patch_youtube':
            return {
                ...state,
                youtube: { ...state.youtube, ...action.patch },
                hasPreviewedSinceLastEdit: false,
            };
        case 'patch_telegram':
            return {
                ...state,
                telegram: { ...state.telegram, ...action.patch },
                hasPreviewedSinceLastEdit: false,
            };
        case 'toggle_telegram_media': {
            const set = new Set(state.telegram.media_types);
            if (action.on) set.add(action.media);
            else set.delete(action.media);
            return {
                ...state,
                telegram: {
                    ...state.telegram,
                    media_types: Array.from(set) as TelegramMediaType[],
                },
                hasPreviewedSinceLastEdit: false,
            };
        }
        case 'set_preview_result':
            return {
                ...state,
                previewResult: action.result,
                hasPreviewedSinceLastEdit: true,
            };
        case 'mark_edited':
            return { ...state, hasPreviewedSinceLastEdit: false, previewResult: null };
    }
}

// ---------- Helpers ----------

export function isUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return Boolean(u.protocol && u.host);
    } catch {
        return false;
    }
}

/** Telegram channel URL → username (without @). */
export function deriveTelegramUsername(url: string): string | undefined {
    try {
        const u = new URL(url);
        if (!u.hostname.endsWith('t.me') && u.hostname !== 'telegram.me') return undefined;
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length === 0) return undefined;
        const first = seg[0];
        // skip 's/' prefix used in t.me/s/<channel>
        if (first === 's' && seg.length > 1) return seg[1];
        return first;
    } catch {
        return undefined;
    }
}

/**
 * Step 2 (connect) is valid when the per-type required input is provided
 * and looks reasonable. MANUAL has no URL, so it's always valid here.
 */
export function isConnectValid(state: WizardState): boolean {
    if (!state.type) return false;
    if (state.type === 'MANUAL') return true;
    if (!state.feedUrl.trim()) return false;
    return isUrl(state.feedUrl.trim());
}

/** Step 4 (settings) is valid when name + interval are present. */
export function isSettingsValid(state: WizardState): boolean {
    return state.name.trim().length > 0 && state.fetchIntervalMinutes >= 1;
}

/**
 * Build the type-specific api_config blob for create/preview payloads.
 * Mirrors the structure used by source-form.tsx so the backend sees the same shape.
 */
export function buildApiConfig(state: WizardState): Record<string, unknown> | undefined {
    if (state.type === 'YOUTUBE') {
        const cfg: Record<string, unknown> = {};
        const { max_results, max_age_hours, min_duration_minutes, max_duration_minutes } =
            state.youtube;
        if (max_results) cfg.max_results = max_results;
        if (max_age_hours) cfg.max_age_hours = max_age_hours;
        if (min_duration_minutes) cfg.min_duration_minutes = min_duration_minutes;
        if (max_duration_minutes) cfg.max_duration_minutes = max_duration_minutes;
        return Object.keys(cfg).length > 0 ? cfg : undefined;
    }
    if (state.type === 'TELEGRAM') {
        const t = state.telegram;
        const username =
            t.channel_username?.trim() || deriveTelegramUsername(state.feedUrl) || undefined;
        const hasDurationMedia =
            t.media_types.includes('audio') ||
            t.media_types.includes('voice') ||
            t.media_types.includes('video');
        const cfg: Record<string, unknown> = {
            channel_username: username,
            media_types: t.media_types.length > 0 ? t.media_types : ['audio', 'voice'],
        };
        if (hasDurationMedia) {
            cfg.min_duration_sec = t.min_duration_sec ?? 120;
            if (t.max_duration_sec) cfg.max_duration_sec = t.max_duration_sec;
        }
        if (t.max_results) cfg.max_results = t.max_results;
        if (t.max_age_hours) cfg.max_age_hours = t.max_age_hours;
        if (t.min_text_length) cfg.min_text_length = t.min_text_length;
        return cfg;
    }
    return undefined;
}

export function buildCreatePayload(state: WizardState): CreateSourceRequest {
    return {
        name: state.name.trim(),
        type: state.type as SourceType,
        feed_url: state.feedUrl.trim() || undefined,
        api_config: buildApiConfig(state),
        is_active: state.isActive,
        fetch_interval_minutes: state.fetchIntervalMinutes,
    };
}

/** Hydrate wizard state from an existing ContentSource (edit mode). */
export function sourceToWizardState(source: ContentSource): WizardState {
    const cfg = (source.api_config ?? {}) as Record<string, unknown>;
    const mediaTypes = Array.isArray(cfg.media_types)
        ? (cfg.media_types as string[]).filter(
              (v): v is TelegramMediaType =>
                  typeof v === 'string' &&
                  ['audio', 'voice', 'video', 'photo', 'text'].includes(v)
          )
        : ['audio' as TelegramMediaType, 'voice' as TelegramMediaType];

    return {
        step: 2,
        type: source.type,
        feedUrl: source.feed_url ?? '',
        name: source.name,
        fetchIntervalMinutes: source.fetch_interval_minutes,
        isActive: source.is_active,
        youtube: {
            max_results: typeof cfg.max_results === 'number' ? cfg.max_results : 20,
            max_age_hours: typeof cfg.max_age_hours === 'number' ? cfg.max_age_hours : undefined,
            min_duration_minutes:
                typeof cfg.min_duration_minutes === 'number' ? cfg.min_duration_minutes : undefined,
            max_duration_minutes:
                typeof cfg.max_duration_minutes === 'number' ? cfg.max_duration_minutes : undefined,
        },
        telegram: {
            channel_username:
                typeof cfg.channel_username === 'string' ? cfg.channel_username : undefined,
            media_types: mediaTypes,
            min_duration_sec:
                typeof cfg.min_duration_sec === 'number' ? cfg.min_duration_sec : 120,
            max_duration_sec:
                typeof cfg.max_duration_sec === 'number' ? cfg.max_duration_sec : undefined,
            max_results: typeof cfg.max_results === 'number' ? cfg.max_results : undefined,
            max_age_hours: typeof cfg.max_age_hours === 'number' ? cfg.max_age_hours : undefined,
            min_text_length:
                typeof cfg.min_text_length === 'number' ? cfg.min_text_length : undefined,
        },
        previewResult: null,
        hasPreviewedSinceLastEdit: false,
    };
}
