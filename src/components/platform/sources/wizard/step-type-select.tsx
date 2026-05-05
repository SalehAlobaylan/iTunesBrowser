'use client';

import {
    Youtube,
    Send,
    Rss,
    Mic,
    Twitter,
    MessageCircle,
    PencilLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { SourceType } from '@/types/platform/source';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import { SourceTypeCard } from './source-type-card';

interface StepTypeSelectProps {
    selected: SourceType | null;
    onSelect: (type: SourceType) => void;
}

interface TypeMeta {
    icon: LucideIcon;
    description: string;
    feedHint?: 'For You' | 'News' | 'Both';
    priority: 1 | 2;
}

const TYPE_META: Record<SourceType, TypeMeta> = {
    YOUTUBE: {
        icon: Youtube,
        description: 'Channel videos via YouTube Data API. Filterable by duration & age.',
        feedHint: 'For You',
        priority: 1,
    },
    TELEGRAM: {
        icon: Send,
        description: 'Public channel messages. Pick which media types to ingest.',
        feedHint: 'Both',
        priority: 1,
    },
    RSS: {
        icon: Rss,
        description: 'Standard RSS / Atom feed. We can also discover feeds from a website URL.',
        feedHint: 'News',
        priority: 1,
    },
    PODCAST: {
        icon: Mic,
        description: 'Podcast RSS feed (audio episodes).',
        feedHint: 'For You',
        priority: 2,
    },
    TWITTER: {
        icon: Twitter,
        description: 'Twitter / X account or list.',
        feedHint: 'News',
        priority: 2,
    },
    REDDIT: {
        icon: MessageCircle,
        description: 'Subreddit feed.',
        feedHint: 'News',
        priority: 2,
    },
    MANUAL: {
        icon: PencilLine,
        description: 'No automatic ingestion — content added by hand from the console.',
        priority: 2,
    },
};

const TYPE_ORDER: SourceType[] = [
    'YOUTUBE',
    'TELEGRAM',
    'RSS',
    'PODCAST',
    'TWITTER',
    'REDDIT',
    'MANUAL',
];

export function StepTypeSelect({ selected, onSelect }: StepTypeSelectProps) {
    const priority = TYPE_ORDER.filter((t) => TYPE_META[t].priority === 1);
    const secondary = TYPE_ORDER.filter((t) => TYPE_META[t].priority === 2);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {priority.map((t) => {
                        const meta = TYPE_META[t];
                        return (
                            <SourceTypeCard
                                key={t}
                                icon={meta.icon}
                                label={SOURCE_TYPE_LABELS[t]}
                                description={meta.description}
                                feedHint={meta.feedHint}
                                selected={selected === t}
                                onSelect={() => onSelect(t)}
                            />
                        );
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Other types
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {secondary.map((t) => {
                        const meta = TYPE_META[t];
                        return (
                            <SourceTypeCard
                                key={t}
                                icon={meta.icon}
                                label={SOURCE_TYPE_LABELS[t]}
                                description={meta.description}
                                feedHint={meta.feedHint}
                                selected={selected === t}
                                onSelect={() => onSelect(t)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
