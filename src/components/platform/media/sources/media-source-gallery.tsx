'use client';

import { Radio } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentSource } from '@/types/platform/source';
import type { NewsSource } from '@/types/platform/discovery';

import { MediaSourceCard } from './media-source-card';

interface MediaSourceGalleryProps {
    sources: ContentSource[];
    outputByName: Map<string, { items: number; failed: number }>;
    isLoading: boolean;
    selected: Set<string>;
    selectedSourceId?: string | null;
    sourceContextById?: Map<string, NewsSource>;
    profileNameById?: Map<string, string>;
    onToggleSelect: (id: string) => void;
    onSelectSource?: (id: string) => void;
    onRequestDelete: (id: string) => void;
    returnTo: string;
}

export function MediaSourceGallery({
    sources,
    outputByName,
    isLoading,
    selected,
    selectedSourceId,
    sourceContextById,
    profileNameById,
    onToggleSelect,
    onSelectSource,
    onRequestDelete,
    returnTo,
}: MediaSourceGalleryProps) {
    if (isLoading && sources.length === 0) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-[148px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <Card className="flex flex-col items-center gap-2 border-dashed py-16 text-center">
                <Radio className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No media sources match your filters.</p>
                <p className="text-xs text-muted-foreground">
                    Add a YouTube, podcast, or Telegram source to feed the For You pipeline.
                </p>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sources.map((source) => {
                const contextSource = sourceContextById?.get(source.id);
                const profileName = contextSource?.discovery_profile_id
                    ? profileNameById?.get(contextSource.discovery_profile_id)
                    : undefined;
                return (
                    <MediaSourceCard
                        key={source.id}
                        source={source}
                        output={outputByName.get(source.name)}
                        sourceContext={contextSource}
                        profileName={profileName}
                        selected={selected.has(source.id)}
                        selectedForInspect={selectedSourceId === source.id}
                        onToggleSelect={onToggleSelect}
                        onSelectSource={onSelectSource}
                        onRequestDelete={onRequestDelete}
                        returnTo={returnTo}
                    />
                );
            })}
        </div>
    );
}
