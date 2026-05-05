'use client';

import { useState } from 'react';
import { Loader2, Search, ExternalLink } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDiscoverFeeds } from '@/hooks/use-source-preview';
import type { DiscoveredFeed } from '@/types/platform/source';

interface ConnectRssProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    /** Only show the website-discover helper for RSS, not for PODCAST. */
    enableDiscover?: boolean;
}

export function ConnectRss({
    value,
    onChange,
    label = 'Feed URL',
    placeholder = 'https://example.com/feed.xml',
    enableDiscover = true,
}: ConnectRssProps) {
    const [website, setWebsite] = useState('');
    const discover = useDiscoverFeeds();
    const feeds: DiscoveredFeed[] = discover.data?.feeds ?? [];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="rss_url">{label}</Label>
                <Input
                    id="rss_url"
                    type="url"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>

            {enableDiscover && (
                <div className="rounded-md border border-dashed p-4">
                    <p className="text-sm font-medium">Don&apos;t have a feed URL?</p>
                    <p className="text-xs text-muted-foreground">
                        Paste a website and we&apos;ll try to find feeds in its HTML.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Input
                            type="url"
                            placeholder="https://blog.example.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!website.trim() || discover.isPending}
                            onClick={() => discover.mutate({ url: website.trim() })}
                        >
                            {discover.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" /> Find feeds
                                </>
                            )}
                        </Button>
                    </div>

                    {discover.isSuccess && feeds.length === 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            No feeds found in that page.
                        </p>
                    )}

                    {feeds.length > 0 && (
                        <ul className="mt-3 space-y-2">
                            {feeds.map((f) => (
                                <li
                                    key={f.url}
                                    className="flex items-center justify-between gap-2 rounded-md border bg-background p-2 text-sm"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {f.type || 'feed'}
                                            </Badge>
                                            <span className="truncate font-medium">
                                                {f.title || f.url}
                                            </span>
                                        </div>
                                        <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            {f.url}
                                        </a>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={value === f.url ? 'default' : 'outline'}
                                        onClick={() => onChange(f.url)}
                                    >
                                        {value === f.url ? 'Selected' : 'Use'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
