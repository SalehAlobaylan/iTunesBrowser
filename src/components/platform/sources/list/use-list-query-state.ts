'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SourceType } from '@/types/platform/source';

export type StatusFilter = 'all' | 'active' | 'disabled';
export type TypeFilter = 'all' | SourceType;
export type SortField = 'name' | 'type' | 'last_fetched_at' | 'fetch_interval_minutes';
export type SortDir = 'asc' | 'desc';

export interface ListQueryState {
    page: number;
    search: string;
    status: StatusFilter;
    type: TypeFilter;
    sortField: SortField;
    sortDir: SortDir;
}

const DEFAULTS: ListQueryState = {
    page: 1,
    search: '',
    status: 'all',
    type: 'all',
    sortField: 'last_fetched_at',
    sortDir: 'desc',
};

const VALID_TYPES: ReadonlyArray<TypeFilter> = [
    'all',
    'RSS',
    'PODCAST',
    'YOUTUBE',
    'TWITTER',
    'REDDIT',
    'TELEGRAM',
    'MANUAL',
];

const VALID_SORT_FIELDS: ReadonlyArray<SortField> = [
    'name',
    'type',
    'last_fetched_at',
    'fetch_interval_minutes',
];

function readFromParams(params: URLSearchParams): ListQueryState {
    const page = Number(params.get('page')) || DEFAULTS.page;
    const search = params.get('q') ?? DEFAULTS.search;
    const statusRaw = params.get('status') ?? DEFAULTS.status;
    const status: StatusFilter =
        statusRaw === 'active' || statusRaw === 'disabled' ? statusRaw : 'all';
    const typeRaw = (params.get('type') ?? DEFAULTS.type) as TypeFilter;
    const type: TypeFilter = VALID_TYPES.includes(typeRaw) ? typeRaw : 'all';
    const sortFieldRaw = (params.get('sort') ?? DEFAULTS.sortField) as SortField;
    const sortField: SortField = VALID_SORT_FIELDS.includes(sortFieldRaw)
        ? sortFieldRaw
        : DEFAULTS.sortField;
    const sortDirRaw = params.get('dir') ?? DEFAULTS.sortDir;
    const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';

    return { page: Math.max(1, page), search, status, type, sortField, sortDir };
}

function toQueryString(state: ListQueryState): string {
    const params = new URLSearchParams();
    if (state.page !== DEFAULTS.page) params.set('page', String(state.page));
    if (state.search) params.set('q', state.search);
    if (state.status !== DEFAULTS.status) params.set('status', state.status);
    if (state.type !== DEFAULTS.type) params.set('type', state.type);
    if (state.sortField !== DEFAULTS.sortField) params.set('sort', state.sortField);
    if (state.sortDir !== DEFAULTS.sortDir) params.set('dir', state.sortDir);
    const s = params.toString();
    return s ? `?${s}` : '';
}

export function useListQueryState() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state is the source of truth so input typing stays snappy;
    // we push to the URL via a debounced effect.
    const [state, setStateInternal] = useState<ListQueryState>(() =>
        readFromParams(searchParams)
    );

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const target = `${pathname}${toQueryString(state)}`;
            router.replace(target, { scroll: false });
        }, 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // pathname is stable for this page; we deliberately don't react to it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const setState = useCallback((patch: Partial<ListQueryState>) => {
        setStateInternal((prev) => {
            // Any filter change resets the page to 1 unless the caller is changing the page itself.
            const resetPage =
                patch.page === undefined &&
                (patch.search !== undefined ||
                    patch.status !== undefined ||
                    patch.type !== undefined);
            return { ...prev, ...patch, page: resetPage ? 1 : patch.page ?? prev.page };
        });
    }, []);

    const toggleSort = useCallback((field: SortField) => {
        setStateInternal((prev) => {
            if (prev.sortField === field) {
                return { ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' };
            }
            return { ...prev, sortField: field, sortDir: 'desc' };
        });
    }, []);

    return { state, setState, toggleSort };
}
