'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConnectYoutubeProps {
    value: string;
    onChange: (value: string) => void;
}

export function ConnectYoutube({ value, onChange }: ConnectYoutubeProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="yt_url">Channel, playlist, or hashtag URL</Label>
            <Input
                id="yt_url"
                type="text"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
                Accepts channel URLs (<code>/@handle</code>, <code>/channel/UC…</code>, <code>/c/Name</code>),
                playlist URLs, or hashtag URLs. Aggregation resolves the right mode.
            </p>
        </div>
    );
}
