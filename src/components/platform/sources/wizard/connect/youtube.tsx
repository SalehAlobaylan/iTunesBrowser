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
            <Label htmlFor="yt_url">Channel URL or @handle</Label>
            <Input
                id="yt_url"
                type="text"
                placeholder="https://www.youtube.com/@LexClips"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
                Paste a full channel URL (<code>/@handle</code>, <code>/channel/UC…</code>, or
                <code> /c/Name</code>). Aggregation resolves the canonical channel ID.
            </p>
        </div>
    );
}
