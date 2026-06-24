'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { useAllSources, useSourceStats } from '@/hooks/use-sources';
import { isMediaSource } from '@/lib/sources/media';
import { MediaSourcesSummary } from '@/components/platform/media/sources/media-sources-summary';
import { MediaOutputChart } from '@/components/platform/media/sources/media-output-chart';
import { MediaSourcesManager } from '@/components/platform/sources/manage/media-sources-manager';

const RETURN_TO = '/platform/media/sources';

/**
 * Media Sources — a channel card gallery for the For You ingestion roster
 * (YouTube, podcast, and Telegram channels that pull audio/video). The visual
 * counterpart to News → Feeds Finding.
 */
export default function MediaSourcesPage() {
    const [bulkBusy, setBulkBusy] = useState(false);

    // Load the whole fleet, then keep media-category sources PLUS Telegram
    // channels configured for audio/video (dual channels feed both hubs).
    const fleet = useAllSources({ paused: bulkBusy });
    const stats = useSourceStats({ category: 'media' });
    const sources = useMemo(() => (fleet.data ?? []).filter(isMediaSource), [fleet.data]);

    const outputByName = useMemo(() => {
        const map = new Map<string, { items: number; failed: number }>();
        for (const s of stats.data?.top_sources ?? []) {
            map.set(s.name, { items: s.items, failed: s.failed });
        }
        return map;
    }, [stats.data]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <span className="brand-overline text-gold">For You</span>
                <h1 className="text-2xl font-semibold">Media Sources</h1>
                <p className="text-sm text-muted-foreground">
                    Channels feeding the For You pipeline — video, podcast, and Telegram channels
                    that pull audio/video. Text-only Telegram news channels live in{' '}
                    <Link href="/platform/news/finding" className="underline">
                        Feeds Finding
                    </Link>
                    .
                </p>
            </div>

            {/* Summary + output chart */}
            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <MediaSourcesSummary sources={sources} isLoading={fleet.isLoading} />
                <MediaOutputChart stats={stats.data} isLoading={stats.isLoading} />
            </div>

            {/* Management */}
            <MediaSourcesManager
                sources={sources}
                outputByName={outputByName}
                isLoading={fleet.isLoading}
                onBusyChange={setBulkBusy}
                refetch={fleet.refetch}
                returnTo={RETURN_TO}
            />
        </div>
    );
}
