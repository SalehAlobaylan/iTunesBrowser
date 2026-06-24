'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/format';
import { useNewsSources, useProfiles } from '@/hooks/use-discovery';
import { useSourceManagement } from '@/components/platform/sources/shared/use-source-management';
import { SelectionToolbar } from '@/components/platform/sources/shared/selection-toolbar';
import { SourceManagementDialogs } from '@/components/platform/sources/shared/source-management-dialogs';
import { SourceActionMenu } from '@/components/platform/sources/shared/source-action-menu';
import {
    NEWS_HEALTH_LABELS,
    NEWS_HEALTH_ORDER,
    domainOf,
    newsSourceHealth,
    type NewsHealthStatus,
} from '@/lib/sources/news-health';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { ContentSource, SourceType } from '@/types/platform/source';
import type { NewsSource } from '@/types/platform/discovery';

// News-relevant source types for the filter.
const NEWS_TYPES: SourceType[] = ['RSS', 'TELEGRAM', 'TWITTER', 'REDDIT', 'MANUAL'];

type NewsSortField = 'name' | 'items' | 'failed' | 'last_item';
type SortDir = 'asc' | 'desc';

interface NewsSourcesManagerProps {
    onBusyChange: (busy: boolean) => void;
    returnTo: string;
}

function sortNews(arr: NewsSource[], field: NewsSortField, dir: SortDir) {
    const cmp = (a: NewsSource, b: NewsSource): number => {
        switch (field) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'items':
                return a.items_count - b.items_count;
            case 'failed':
                return a.failed - b.failed;
            case 'last_item': {
                const aT = a.last_item_at ? new Date(a.last_item_at).getTime() : null;
                const bT = b.last_item_at ? new Date(b.last_item_at).getTime() : null;
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
 * News source management — an ingestion-flow table tuned to news: items produced,
 * failures, last-item freshness, engagement, and live/stale health (based on
 * item flow, not fetch cadence). Uses the enriched `useNewsSources` data.
 */
export function NewsSourcesManager({ onBusyChange, returnTo }: NewsSourcesManagerProps) {
    const news = useNewsSources();
    const profiles = useProfiles();
    const allSources = useMemo(() => news.data?.data ?? [], [news.data]);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | SourceType>('all');
    const [healthFilter, setHealthFilter] = useState<'all' | NewsHealthStatus>('all');
    const [profileFilter, setProfileFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<NewsSortField>('items');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const mgmt = useSourceManagement({
        sources: allSources as unknown as ContentSource[],
        refetch: news.refetch,
        onBusyChange,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const arr = allSources.filter((s) => {
            if (q && !s.name.toLowerCase().includes(q)) return false;
            if (typeFilter !== 'all' && s.type !== typeFilter) return false;
            if (healthFilter !== 'all' && newsSourceHealth(s).status !== healthFilter) return false;
            if (profileFilter !== 'all' && s.discovery_profile_id !== profileFilter) return false;
            return true;
        });
        return sortNews(arr, sortField, sortDir);
    }, [allSources, search, typeFilter, healthFilter, profileFilter, sortField, sortDir]);

    const staleSources = useMemo(
        () => filtered.filter((s) => newsSourceHealth(s).status === 'stale'),
        [filtered]
    );

    const filteredIds = filtered.map((s) => s.id);
    const selectedOnPage = filteredIds.filter((id) => mgmt.selected.has(id)).length;
    const headerState =
        selectedOnPage === 0 ? false : selectedOnPage === filteredIds.length ? true : 'indeterminate';

    useEffect(() => {
        mgmt.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, typeFilter, healthFilter, profileFilter]);

    const toggleSort = (field: NewsSortField) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const addHref = `/platform/sources/new?category=news&from=${encodeURIComponent(returnTo)}`;
    const profileList = profiles.data?.data ?? [];
    const loading = news.isLoading && allSources.length === 0;

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => mgmt.openRunStale(staleSources as unknown as ContentSource[])}
                    disabled={mgmt.bulkBusy || staleSources.length === 0}
                >
                    <Zap className="mr-2 h-4 w-4" />
                    Run all stale{staleSources.length > 0 ? ` (${staleSources.length})` : ''}
                </Button>
                <Button asChild>
                    <Link href={addHref}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add news source
                    </Link>
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {NEWS_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{SOURCE_TYPE_LABELS[t]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v as typeof healthFilter)}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Health" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All health</SelectItem>
                        {NEWS_HEALTH_ORDER.map((h) => (
                            <SelectItem key={h} value={h}>{NEWS_HEALTH_LABELS[h]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {profileList.length > 0 && (
                    <Select value={profileFilter} onValueChange={setProfileFilter}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Interest" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All interests</SelectItem>
                            {profileList.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                    {filtered.length} of {allSources.length} sources
                </div>
            </div>

            {/* Selection toolbar */}
            <SelectionToolbar
                count={mgmt.selected.size}
                busy={mgmt.bulkBusy}
                progress={mgmt.progress}
                onClear={mgmt.clear}
                onRun={mgmt.actions.runSelected}
                onEnable={mgmt.actions.enableSelected}
                onDisable={mgmt.actions.disableSelected}
                onChangeInterval={mgmt.actions.openChangeInterval}
                onMoveToMedia={mgmt.actions.moveSelectedToMedia}
                onDelete={mgmt.actions.openBulkDelete}
            />

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={headerState}
                                    onCheckedChange={(c) => mgmt.toggleMany(filteredIds, Boolean(c))}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <SortHead label="Source" field="name" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                            <TableHead>Type</TableHead>
                            <SortHead label="Items" field="items" sortField={sortField} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                            <SortHead label="Failed" field="failed" sortField={sortField} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                            <SortHead label="Last item" field="last_item" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
                            <TableHead className="text-right">Engagement</TableHead>
                            <TableHead>Health</TableHead>
                            <TableHead className="w-10 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 9 }).map((__, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[110px]" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : news.isError ? (
                            <TableRow>
                                <TableCell colSpan={9} className="py-10 text-center text-destructive">
                                    Failed to load news sources.
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                                    No news sources match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((source) => {
                                const health = newsSourceHealth(source);
                                const isSelected = mgmt.selected.has(source.id);
                                return (
                                    <TableRow key={source.id} data-state={isSelected ? 'selected' : undefined}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => mgmt.toggleOne(source.id)}
                                                aria-label={`Select ${source.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/platform/sources/${source.id}?from=${encodeURIComponent(returnTo)}`}
                                                className="block hover:underline"
                                                dir="auto"
                                            >
                                                <div className="font-medium">{source.name}</div>
                                                {domainOf(source.feed_url) && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {domainOf(source.feed_url)}
                                                    </div>
                                                )}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {SOURCE_TYPE_LABELS[source.type as SourceType] ?? source.type}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatNumber(source.items_count)}
                                        </TableCell>
                                        <TableCell className={cn('text-right tabular-nums', source.failed > 0 && 'text-destructive')}>
                                            {formatNumber(source.failed)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {source.last_item_at ? (
                                                formatDistanceToNow(new Date(source.last_item_at), { addSuffix: true })
                                            ) : (
                                                <span className="text-muted-foreground">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {formatNumber(source.engagement)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={health.variant}>{health.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <SourceActionMenu
                                                source={source as unknown as ContentSource}
                                                returnTo={returnTo}
                                                onRequestDelete={mgmt.requestDelete}
                                                onChanged={() => news.refetch()}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <SourceManagementDialogs dialogs={mgmt.dialogs} />
        </div>
    );
}

function SortHead({
    label,
    field,
    sortField,
    sortDir,
    onClick,
    className,
}: {
    label: string;
    field: NewsSortField;
    sortField: NewsSortField;
    sortDir: SortDir;
    onClick: (field: NewsSortField) => void;
    className?: string;
}) {
    const active = sortField === field;
    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={() => onClick(field)}
                className={cn(
                    'flex items-center gap-1 transition-colors hover:text-foreground',
                    className === 'text-right' && 'ml-auto',
                    active ? 'text-foreground' : 'text-muted-foreground'
                )}
            >
                {label}
                {active ? (
                    sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                )}
            </button>
        </TableHead>
    );
}
