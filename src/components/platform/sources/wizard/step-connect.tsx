'use client';

import type { Dispatch } from 'react';
import type { WizardAction, WizardState } from './types';
import { ConnectYoutube } from './connect/youtube';
import { ConnectTelegram } from './connect/telegram';
import { ConnectRss } from './connect/rss';
import { ConnectGeneric, ConnectManual } from './connect/generic';

interface StepConnectProps {
    state: WizardState;
    dispatch: Dispatch<WizardAction>;
}

export function StepConnect({ state, dispatch }: StepConnectProps) {
    const setUrl = (url: string) => dispatch({ kind: 'set_feed_url', url });

    switch (state.type) {
        case 'YOUTUBE':
            return <ConnectYoutube value={state.feedUrl} onChange={setUrl} />;
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
                <ConnectRss
                    value={state.feedUrl}
                    onChange={setUrl}
                    label="Podcast feed URL"
                    placeholder="https://feeds.example.com/podcast.xml"
                    enableDiscover={false}
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
