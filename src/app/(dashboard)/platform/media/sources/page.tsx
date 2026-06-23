'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, Plus, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAllSources, useSourceStats } from '@/hooks/use-sources';
import { useListQueryState } from '@/components/platform/sources/list/use-list-query-state';
import { useSourceManagement } from '@/components/platform/sources/shared/use-source-management';
import { SelectionToolbar } from '@/components/platform/sources/shared/selection-toolbar';
import { SourceManagementDialogs } from '@/components/platform/sources/shared/source-management-dialogs';
import { MediaSourcesSummary } from '@/components/platform/media/sources/media-sources-summary';
import { MediaOutputChart } from '@/components/platform/media/sources/media-output-chart';
import { MediaSourcesToolbar } from '@/components/platform/media/sources/media-sources-toolbar';
import { MediaSourceGallery } from '@/components/platform/media/sources/media-source-gallery';
import { sourceHealth } from '@/lib/sources/health';
import type { ContentSource } from '@/types/platform/source';
import type { SortField, SortDir } from '@/components/platform/sources/list/use-list-query-state';

const RETURN_TO = '/platform/media/sources';

// Telegram media kinds that feed the For You pipeline. A Telegram channel that
// only pulls text/photo (e.g. a news channel) is NOT a media source.
const TELEGRAM_MEDIA_KINDS = ['audio', 'voice', 'video'];

function isMediaTelegram(s: ContentSource): boolean {
    if (s.type !== 'TELEGRAM') return false;
    const mediaTypes = (s.api_config as { media_types?: unknown } | undefined)?.media_types;
    return (
        Array.isArray(mediaTypes) &&
        mediaTypes.some((m) => typeof m === 'string' && TELEGRAM_MEDIA_KINDS.includes(m))
    );
}

/** A source belongs on the Media gallery if it's media-category, or a Telegram
 *  channel configured to pull audio/voice/video (dual channels show in both hubs). */
function isMediaSource(s: ContentSource): boolean {
    return s.category === 'media' || isMediaTelegram(s);
}

function sortSources(arr: ContentSource[], field: SortField, dir: SortDir) {
    const cmp = (a: ContentSource, b: ContentSource): number => {
        switch (field) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'fetch_interval_minutes':
                return a.fetch_interval_minutes - b.fetch_interval_minutes;
            case 'last_fetched_at': {
                const aT = a.last_fetched_at ? new Date(a.last_fetched_at).getTime() : null;
                const bT = b.last_fetched_at ? new Date(b.last_fetched_at).getTime() : null;
                if (aT === null && bT === null) return 0;
                if (aT === null) return 1;
                if (bT === null) return -1;
                return aT - bT;
            }
        }
    };
    const sorted = [...arr].sort(cmp);
    return dir === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Media Sources — a channel card gallery for the For You ingestion roster
 * (YouTube, podcast, and Telegram channels set to Media). The visual counterpart
 * to News → Feeds Finding.
 */
export default function MediaSourcesPage() {
    const { state, setState } = useListQueryState();
    const [bulkBusy, setBulkBusy] = useState(false);

    // Load the whole fleet, then keep media-category sources PLUS every Telegram
    // channel — Telegram is dual (audio/video → For You, text/photo → News), so a
    // channel feeds the media pipeline regardless of which hub "owns" it.
    const fleet = useAllSources({ paused: bulkBusy });
    const stats = useSourceStats({ category: 'media' });
    const sources = useMemo(
        () => (fleet.data ?? []).filter((s) => s.category === 'media' || s.type === 'TELEGRAM'),
        [fleet.data]
    );

    const mgmt = useSourceManagement({
        sources,
        refetch: fleet.refetch,
        onBusyChange: setBulkBusy,
    });

    const filtered = useMemo(() => {
        const q = state.search.trim().toLowerCase();
        const arr = sources.filter((s) => {
            if (q && !s.name.toLowerCase().includes(q)) return false;
            if (state.type !== 'all' && s.type !== state.type) return false;
            if (state.status === 'active' && !s.is_active) return false;
            if (state.status === 'disabled' && s.is_active) return false;
            if (state.health !== 'all' && sourceHealth(s).status !== state.health) return false;
            return true;
        });
        return sortSources(arr, state.sortField, state.sortDir);
    }, [sources, state.search, state.type, state.status, state.health, state.sortField, state.sortDir]);

    const outputByName = useMemo(() => {
        const map = new Map<string, { items: number; failed: number }>();
        for (const s of stats.data?.top_sources ?? []) {
            map.set(s.name, { items: s.items, failed: s.failed });
        }
        return map;
    }, [stats.data]);

    const staleSources = useMemo(
        () => filtered.filter((s) => sourceHealth(s).isStale),
        [filtered]
    );

    const filteredIds = filtered.map((s) => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => mgmt.selected.has(id));

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <span className="brand-overline text-gold">For You</span>
                    <h1 className="text-2xl font-semibold">Media Sources</h1>
                    <p className="text-sm text-muted-foreground">
                        Channels feeding the For You pipeline — video, podcast, and Telegram.
                        Telegram channels appear here and in{' '}
                        <Link href="/platform/news/finding" className="underline">
                            Feeds Finding
                        </Link>{' '}
                        since they feed both.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => mgmt.openRunStale(staleSources)}
                        disabled={mgmt.bulkBusy || staleSources.length === 0}
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Run all stale{staleSources.length > 0 ? ` (${staleSources.length})` : ''}
                    </Button>
                    <Button asChild>
                        <Link href="/platform/sources/new?category=media&from=/platform/media/sources">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Source
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Summary + output chart */}
            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <MediaSourcesSummary sources={sources} isLoading={fleet.isLoading} />
                <MediaOutputChart stats={stats.data} isLoading={stats.isLoading} />
            </div>

            {/* Toolbar */}
            <MediaSourcesToolbar
                state={state}
                setState={setState}
                count={filtered.length}
                total={sources.length}
            />

            {/* Selection toolbar (cross-fades in when sources are picked) */}
            <SelectionToolbar
                count={mgmt.selected.size}
                busy={mgmt.bulkBusy}
                progress={mgmt.progress}
                onClear={mgmt.clear}
                onRun={mgmt.actions.runSelected}
                onEnable={mgmt.actions.enableSelected}
                onDisable={mgmt.actions.disableSelected}
                onChangeInterval={mgmt.actions.openChangeInterval}
                onMoveToNews={mgmt.actions.moveSelectedToNews}
                onDelete={mgmt.actions.openBulkDelete}
            />

            {/* Select-all affordance */}
            {filtered.length > 0 && (
                <button
                    type="button"
                    onClick={() => mgmt.toggleMany(filteredIds, !allSelected)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {allSelected ? 'Clear selection' : `Select all ${filtered.length}`}
                </button>
            )}

            {/* Gallery */}
            <MediaSourceGallery
                sources={filtered}
                outputByName={outputByName}
                isLoading={fleet.isLoading}
                selected={mgmt.selected}
                onToggleSelect={mgmt.toggleOne}
                onRequestDelete={mgmt.requestDelete}
                returnTo={RETURN_TO}
            />

            <SourceManagementDialogs dialogs={mgmt.dialogs} />
        </div>
    );
}
