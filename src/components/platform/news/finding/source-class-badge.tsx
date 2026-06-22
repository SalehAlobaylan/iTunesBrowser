'use client';

import { Landmark, Newspaper, User, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceSuggestion } from '@/types/platform/discovery';

// Deterministic source classification surfaced from suggestion.evidence.source_class.
export type SourceClass = 'official' | 'news' | 'person' | 'other';

const META: Record<SourceClass, { label: string; icon: typeof Landmark; cls: string }> = {
    official: { label: 'Official', icon: Landmark, cls: 'bg-info/10 text-info' },
    news: { label: 'News', icon: Newspaper, cls: 'bg-news/10 text-news' },
    person: { label: 'Person', icon: User, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    other: { label: 'Other', icon: Circle, cls: 'bg-muted text-muted-foreground' },
};

// Filter chips, in display order. 'all' is the no-filter sentinel.
export const CLASS_FILTERS: { k: SourceClass | 'all'; label: string }[] = [
    { k: 'all', label: 'All' },
    { k: 'official', label: 'Official' },
    { k: 'news', label: 'News' },
    { k: 'person', label: 'Person' },
    { k: 'other', label: 'Other' },
];

export function sourceClassOf(s: SourceSuggestion): SourceClass | null {
    const c = s.evidence?.source_class;
    return c === 'official' || c === 'news' || c === 'person' || c === 'other' ? c : null;
}

export function ClassBadge({ value, className }: { value?: string | null; className?: string }) {
    if (value !== 'official' && value !== 'news' && value !== 'person' && value !== 'other') return null;
    const m = META[value];
    const Icon = m.icon;
    return (
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', m.cls, className)}>
            <Icon className="h-3 w-3" /> {m.label}
        </span>
    );
}

// Segmented class filter. `value` is the active class or 'all'.
export function ClassFilter({ value, onChange, counts }: {
    value: SourceClass | 'all';
    onChange: (v: SourceClass | 'all') => void;
    counts?: Partial<Record<SourceClass | 'all', number>>;
}) {
    return (
        <div className="flex items-center overflow-hidden rounded-md border text-xs">
            {CLASS_FILTERS.map((f) => {
                const n = counts?.[f.k];
                return (
                    <button
                        key={f.k}
                        type="button"
                        onClick={() => onChange(f.k)}
                        className={cn(
                            'px-2 py-1.5 transition-colors',
                            value === f.k ? 'bg-news/10 text-news' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        {f.label}{typeof n === 'number' ? ` ${n}` : ''}
                    </button>
                );
            })}
        </div>
    );
}
