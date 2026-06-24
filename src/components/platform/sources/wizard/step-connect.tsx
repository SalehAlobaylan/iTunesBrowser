'use client';

import type { Dispatch } from 'react';
import type { WizardAction, WizardState } from './types';
import { ConnectYoutube } from './connect/youtube';
import { ConnectTelegram } from './connect/telegram';
import { ConnectRss } from './connect/rss';
import { ConnectPodcast } from './connect/podcast';
import { ConnectGeneric, ConnectManual } from './connect/generic';

interface StepConnectProps {
    state: WizardState;
    dispatch: Dispatch<WizardAction>;
}

export function StepConnect({ state, dispatch }: StepConnectProps) {
    const setUrl = (url: string) => dispatch({ kind: 'set_feed_url', url });

    switch (state.type) {
        case 'YOUTUBE':
            return (
                <ConnectYoutube
                    value={state.feedUrl}
                    onChange={setUrl}
                    onResolved={(channel) => {
                        if (channel.thumbnail) dispatch({ kind: 'set_image_url', url: channel.thumbnail });
                        if (channel.title && !state.name.trim())
                            dispatch({ kind: 'set_name', name: channel.title });
                    }}
                />
            );
        case 'TELEGRAM':
            return (
                <ConnectTelegram
                    feedUrl={state.feedUrl}
                    onFeedUrl={setUrl}
                    telegram={state.telegram}
                    onPatch={(patch) => dispatch({ kind: 'patch_telegram', patch })}
                    onToggleMedia={(media, on) =>
                        dispatch({ kind: 'toggle_telegram_media', media, on })
                    }
                />
            );
        case 'RSS':
            return (
                <ConnectRss
                    value={state.feedUrl}
                    onChange={setUrl}
                    label="RSS / Atom feed URL"
                    placeholder="https://example.com/feed.xml"
                    enableDiscover
                />
            );
        case 'PODCAST':
            return (
                <ConnectPodcast
                    value={state.feedUrl}
                    onChange={setUrl}
                    onPick={(podcast) => {
                        dispatch({ kind: 'set_feed_url', url: podcast.feed_url });
                        if (podcast.image_url) dispatch({ kind: 'set_image_url', url: podcast.image_url });
                        if (podcast.name) dispatch({ kind: 'set_name', name: podcast.name });
                    }}
                />
            );
        case 'TWITTER':
            return (
                <ConnectGeneric
                    value={state.feedUrl}
                    onChange={setUrl}
                    label="Twitter / X URL"
                    placeholder="https://x.com/username"
                    helper="User profile URL or list URL."
                />
            );
        case 'REDDIT':
            return (
                <ConnectGeneric
                    value={state.feedUrl}
                    onChange={setUrl}
                    label="Subreddit URL"
                    placeholder="https://www.reddit.com/r/programming"
                />
            );
        case 'MANUAL':
            return <ConnectManual />;
        default:
            return null;
    }
}
