'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { deriveTelegramUsername } from '../types';
import type { TelegramConfig, TelegramMediaType } from '../types';

interface ConnectTelegramProps {
    feedUrl: string;
    onFeedUrl: (url: string) => void;
    telegram: TelegramConfig;
    onPatch: (patch: Partial<TelegramConfig>) => void;
    onToggleMedia: (media: TelegramMediaType, on: boolean) => void;
}

const MEDIA_OPTIONS: Array<{ key: TelegramMediaType; label: string; hint: string }> = [
    { key: 'audio', label: 'Audio Files', hint: 'Pods' },
    { key: 'voice', label: 'Voice Notes', hint: 'Pods' },
    { key: 'video', label: 'Videos', hint: 'Pods' },
    { key: 'photo', label: 'Photos', hint: 'News' },
    { key: 'text', label: 'Text Posts', hint: 'News' },
];

export function ConnectTelegram({
    feedUrl,
    onFeedUrl,
    telegram,
    onPatch,
    onToggleMedia,
}: ConnectTelegramProps) {
    const derived = deriveTelegramUsername(feedUrl);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="tg_url">Channel URL</Label>
                <Input
                    id="tg_url"
                    type="url"
                    placeholder="https://t.me/channel_name"
                    value={feedUrl}
                    onChange={(e) => onFeedUrl(e.target.value)}
                />
                {derived && (
                    <p className="text-xs text-muted-foreground">
                        Username: <code>@{derived}</code>
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="tg_username">Channel Username (optional)</Label>
                <Input
                    id="tg_username"
                    placeholder={derived ? `@${derived}` : '@channel_name'}
                    value={telegram.channel_username ?? ''}
                    onChange={(e) => onPatch({ channel_username: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    Leave empty to auto-derive from the URL above.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Content Types to Fetch</Label>
                <p className="text-xs text-muted-foreground">
                    Audio / Voice / Video → <strong>Pods</strong> feed&nbsp;·&nbsp;
                    Text / Photos → <strong>News</strong> feed
                </p>
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    {MEDIA_OPTIONS.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={telegram.media_types.includes(opt.key)}
                                onCheckedChange={(checked) =>
                                    onToggleMedia(opt.key, Boolean(checked))
                                }
                            />
                            <span>
                                {opt.label}{' '}
                                <span className="text-muted-foreground">({opt.hint})</span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
