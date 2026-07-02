'use client';

import { Check, Filter, Inbox, Search, Undo2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { MediaCirculationCockpitRecommendation } from '@/types/platform/media-circulation';
import { laneChipClass, laneRuleClass, statusChipClass } from './verdict-styles';

export type QueueTab = 'attention' | 'pull' | 'atomize' | 'evict' | 'review' | 'held' | 'history';

/** Which action lanes each tab collects. `evict` deliberately merges the soft
 *  (downrank) and hard (cool/bytes) sides of the eviction gradient. */
const TAB_LANES: Record<Exclude<QueueTab, 'attention' | 'history'>, string[]> = {
    pull: ['pull'],
    atomize: ['atomize'],
    evict: ['downrank', 'cool'],
    review: ['review'],
    held: ['protect', 'limit_skip'],
};

const ATTENTION_LANES = ['pull', 'atomize', 'downrank', 'cool', 'review'];

export const QUEUE_TABS: Array<{ value: QueueTab; label: string }> = [
    { value: 'attention', label: 'Attention' },
    { value: 'pull', label: 'Pull' },
    { value: 'atomize', label: 'Atomize' },
    { value: 'evict', label: 'Evict' },
    { value: 'review', label: 'Review' },
    { value: 'held', label: 'Held' },
    { value: 'history', label: 'History' },
];

export function recommendationMatchesTab(rec: MediaCirculationCockpitRecommendation, tab: QueueTab): boolean {
    if (tab === 'history') return rec.status !== 'pending';
    if (rec.status !== 'pending') return false;
    if (tab === 'attention') return ATTENTION_LANES.includes(rec.action_lane);
    return TAB_LANES[tab].includes(rec.action_lane);
}

export function isRevertible(rec: MediaCirculationCockpitRecommendation): boolean {
    return rec.status === 'applied' && ['ranked_down', 'paused'].includes(rec.outcome ?? '');
}

interface DecisionQueueProps {
    rows: MediaCirculationCockpitRecommendation[];
    tabCounts: Record<QueueTab, number>;
    tab: QueueTab;
    query: string;
    historyStatus: string;
    activeBucket: string;
    selectedID?: string;
    engineEnabled: boolean;
    acting: boolean;
    onTab: (tab: QueueTab) => void;
    onQuery: (query: string) => void;
    onHistoryStatus: (status: string) => void;
    onClearBucket: () => void;
    onSelect: (id: string, openDetails?: boolean) => void;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
    onRevert: (id: string) => void;
    onGenerate: () => void;
    onToggleEngine: () => void;
}

export function DecisionQueue({
    rows,
    tabCounts,
    tab,
    query,
    historyStatus,
    activeBucket,
    selectedID,
    engineEnabled,
    acting,
    onTab,
    onQuery,
    onHistoryStatus,
    onClearBucket,
    onSelect,
    onApply,
    onDismiss,
    onRevert,
    onGenerate,
    onToggleEngine,
}: DecisionQueueProps) {
    return (
        <section className="flex min-w-0 flex-col rounded-xl border border-border bg-card">
            {/* Tab rail — the one and only lane navigation */}
            <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto border-b border-border px-2 pt-2">
                {QUEUE_TABS.map(({ value, label }) => {
                    const active = tab === value;
                    const count = tabCounts[value];
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onTab(value)}
                            className={cn(
                                'relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {label}
                            <span
                                className={cn(
                                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none',
                                    active ? 'bg-news/15 text-news' : 'bg-muted text-muted-foreground'
                                )}
                            >
                                {count}
                            </span>
                            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-news" />}
                        </button>
                    );
                })}
            </div>

            {/* Search + contextual filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => onQuery(e.target.value)}
                        placeholder="Search sources, items, or proof"
                        className="h-9 pl-9"
                    />
                </div>
                {tab === 'history' && (
                    <Select value={historyStatus} onValueChange={onHistoryStatus}>
                        <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All outcomes</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                            <SelectItem value="superseded">Superseded</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                {activeBucket !== 'all' && (
                    <Badge variant="outline" className="h-9 gap-1.5 rounded-md border-news/40 bg-news/10 px-3 text-news">
                        {activeBucket} bucket
                        <button type="button" onClick={onClearBucket} aria-label="Clear bucket filter">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </Badge>
                )}
            </div>

            {/* Rows */}
            <div className="flex-1">
                {!engineEnabled && tab !== 'history' ? (
                    <QueueEmpty
                        title="The engine is off"
                        detail="Recommendations pause while circulation is disabled. Turn the engine on to resume triage."
                        actionLabel="Turn engine on"
                        onAction={onToggleEngine}
                    />
                ) : rows.length === 0 ? (
                    <QueueEmpty
                        title={tab === 'history' ? 'No decisions recorded yet' : 'Nothing to decide here'}
                        detail={
                            tab === 'history'
                                ? 'Applied and dismissed recommendations will build the track record shown here.'
                                : 'Generate a fresh recommendation set, or check another lane.'
                        }
                        actionLabel={tab === 'history' ? undefined : 'Generate recommendations'}
                        onAction={tab === 'history' ? undefined : onGenerate}
                    />
                ) : (
                    <ul className="divide-y divide-border">
                        {rows.map((rec) => (
                            <DecisionRow
                                key={rec.id}
                                rec={rec}
                                selected={selectedID === rec.id}
                                engineEnabled={engineEnabled}
                                acting={acting}
                                showStatus={tab === 'history' || tab === 'held'}
                                onSelect={(openDetails) => onSelect(rec.id, openDetails)}
                                onApply={onApply}
                                onDismiss={onDismiss}
                                onRevert={onRevert}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function DecisionRow({
    rec,
    selected,
    engineEnabled,
    acting,
    showStatus,
    onSelect,
    onApply,
    onDismiss,
    onRevert,
}: {
    rec: MediaCirculationCockpitRecommendation;
    selected: boolean;
    engineEnabled: boolean;
    acting: boolean;
    showStatus: boolean;
    onSelect: (openDetails?: boolean) => void;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
    onRevert: (id: string) => void;
}) {
    const proof = rec.proof_points?.[0] ?? rec.reasons?.[0] ?? '';
    return (
        <li
            className={cn(
                'group relative flex cursor-pointer items-center gap-3 py-2.5 pl-4 pr-3 transition-colors',
                selected ? 'bg-news/5' : 'hover:bg-muted/60'
            )}
            onClick={() => onSelect(true)}
        >
            {/* Lane rule */}
            <span className={cn('absolute inset-y-2 left-0 w-0.5 rounded-full', laneRuleClass(rec.action_lane), selected && 'w-1')} />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('shrink-0 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide', laneChipClass(rec.action_lane))}>
                        {rec.verdict.replace(/_/g, ' ')}
                    </Badge>
                    {showStatus && (
                        <Badge variant="outline" className={cn('shrink-0 px-1.5 py-0 text-[10px] capitalize', statusChipClass(rec.status))}>
                            {rec.outcome ? rec.outcome.replace(/_/g, ' ') : rec.status}
                        </Badge>
                    )}
                    <p className="truncate text-sm font-medium" dir="auto">
                        {rec.display_title}
                    </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="auto">
                    {proof || rec.display_subtitle}
                </p>
            </div>

            <span className="hidden shrink-0 text-sm font-semibold tabular-nums text-muted-foreground sm:block">
                {rec.primary_metric}
            </span>

            <div
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                {rec.status === 'pending' && (
                    <>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={acting}
                            onClick={() => onDismiss(rec.id)}
                            className="h-8 px-2 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Dismiss
                        </Button>
                        <Button
                            size="sm"
                            disabled={acting || !engineEnabled}
                            onClick={() => onApply(rec.id)}
                            className="h-8 bg-news px-2.5 text-news-foreground hover:bg-news/90 active:scale-[0.98]"
                        >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Apply
                        </Button>
                    </>
                )}
                {isRevertible(rec) && (
                    <Button size="sm" variant="outline" disabled={acting} onClick={() => onRevert(rec.id)} className="h-8 px-2.5">
                        <Undo2 className="mr-1 h-3.5 w-3.5" />
                        Revert
                    </Button>
                )}
            </div>
        </li>
    );
}

function QueueEmpty({
    title,
    detail,
    actionLabel,
    onAction,
}: {
    title: string;
    detail: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                {actionLabel ? <Filter className="h-5 w-5 text-muted-foreground" /> : <Inbox className="h-5 w-5 text-muted-foreground" />}
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{detail}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} className="mt-5 bg-news text-news-foreground hover:bg-news/90">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
