'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { SourceType } from '@/types/platform/source';
import {
    HEALTH_LABELS,
    HEALTH_ORDER,
} from '@/components/platform/sources/shared/health-meta';
import type {
    ListQueryState,
    SortDir,
    SortField,
} from '@/components/platform/sources/list/use-list-query-state';

// Types that feed the Pods pipeline (Telegram is dual; shown when set to media).
const MEDIA_TYPES: SourceType[] = ['YOUTUBE', 'PODCAST', 'TELEGRAM', 'RSS', 'MANUAL'];

const SORTS: { value: string; label: string; field: SortField; dir: SortDir }[] = [
    { value: 'last_fetched_at:desc', label: 'Recently fetched', field: 'last_fetched_at', dir: 'desc' },
    { value: 'last_fetched_at:asc', label: 'Least recent', field: 'last_fetched_at', dir: 'asc' },
    { value: 'name:asc', label: 'Name A–Z', field: 'name', dir: 'asc' },
    { value: 'fetch_interval_minutes:asc', label: 'Fastest cadence', field: 'fetch_interval_minutes', dir: 'asc' },
];

interface MediaSourcesToolbarProps {
    state: ListQueryState;
    setState: (patch: Partial<ListQueryState>) => void;
    count: number;
    total: number;
}

export function MediaSourcesToolbar({ state, setState, count, total }: MediaSourcesToolbarProps) {
    const sortValue = `${state.sortField}:${state.sortDir}`;

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search channels..."
                    value={state.search}
                    onChange={(e) => setState({ search: e.target.value })}
                    className="pl-9"
                />
            </div>

            <Select value={state.type} onValueChange={(v) => setState({ type: v as ListQueryState['type'] })}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {MEDIA_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{SOURCE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={state.health} onValueChange={(v) => setState({ health: v as ListQueryState['health'] })}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Health" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All health</SelectItem>
                    {HEALTH_ORDER.map((h) => (
                        <SelectItem key={h} value={h}>{HEALTH_LABELS[h]}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={state.status} onValueChange={(v) => setState({ status: v as ListQueryState['status'] })}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={sortValue}
                onValueChange={(v) => {
                    const opt = SORTS.find((s) => s.value === v);
                    if (opt) setState({ sortField: opt.field, sortDir: opt.dir });
                }}
            >
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                    {SORTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="ml-auto text-xs text-muted-foreground">
                {count} of {total} sources
            </div>
        </div>
    );
}
