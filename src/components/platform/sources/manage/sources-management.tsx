'use client';

import { useMemo } from 'react';
import { Newspaper, Video } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSourceStats } from '@/hooks/use-sources';
import { useNewsSources } from '@/hooks/use-discovery';
import { isMediaSource } from '@/lib/sources/media';
import type { ContentSource } from '@/types/platform/source';
import { NewsSourcesManager } from './news-sources-manager';
import { MediaSourcesManager } from './media-sources-manager';

export type ManageTab = 'news' | 'media';

interface SourcesManagementProps {
    /** The full fleet (drives the Media tab + its counts). */
    allSources: ContentSource[];
    isLoading: boolean;
    onBusyChange: (busy: boolean) => void;
    refetch: () => Promise<unknown> | void;
    returnTo: string;
    value: ManageTab;
    onValueChange: (tab: ManageTab) => void;
}

/**
 * Tabbed source management — News and Media are different management problems, so
 * each tab is a tailored manager (news = ingestion-flow table, media = card
 * gallery). The overview (Fleet Grid + charts) lives above this on the page.
 */
export function SourcesManagement({
    allSources,
    isLoading,
    onBusyChange,
    refetch,
    returnTo,
    value,
    onValueChange,
}: SourcesManagementProps) {
    // News count for the tab label (deduped with the News tab's own query).
    const news = useNewsSources();
    const mediaStats = useSourceStats({ category: 'media' });

    const mediaSources = useMemo(() => allSources.filter(isMediaSource), [allSources]);
    const outputByName = useMemo(() => {
        const map = new Map<string, { items: number; failed: number }>();
        for (const s of mediaStats.data?.top_sources ?? []) {
            map.set(s.name, { items: s.items, failed: s.failed });
        }
        return map;
    }, [mediaStats.data]);

    const newsCount = news.data?.data?.length ?? 0;
    const mediaCount = mediaSources.length;

    return (
        <Tabs value={value} onValueChange={(v) => onValueChange(v as ManageTab)} className="space-y-4">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Manage sources</h2>
                <TabsList>
                    <TabsTrigger value="news" className="gap-1.5">
                        <Newspaper className="h-3.5 w-3.5" />
                        News{newsCount > 0 ? ` (${newsCount})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="media" className="gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        Media{mediaCount > 0 ? ` (${mediaCount})` : ''}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="news" className="mt-0">
                <NewsSourcesManager onBusyChange={onBusyChange} returnTo={returnTo} />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
                <MediaSourcesManager
                    sources={mediaSources}
                    outputByName={outputByName}
                    isLoading={isLoading}
                    onBusyChange={onBusyChange}
                    refetch={refetch}
                    returnTo={returnTo}
                />
            </TabsContent>
        </Tabs>
    );
}
