'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ContentStatus, ContentType } from '@/types/platform/content';

export type StatusFilter = 'all' | ContentStatus;
export type TypeFilter = 'all' | ContentType;
export type SortField = 'created_at' | 'published_at' | 'title' | 'type' | 'status';
export type SortDir = 'asc' | 'desc';

export interface ContentListQueryState {
    page: number;
    search: string;
    status: StatusFilter;
    type: TypeFilter;
    sourceName: string;
    sortField: SortField;
    sortDir: SortDir;
}

const DEFAULTS: ContentListQueryState = {
    page: 1,
    search: '',
    status: 'all',
    type: 'all',
    sourceName: '',
    sortField: 'created_at',
    sortDir: 'desc',
};

const VALID_STATUSES: ReadonlyArray<StatusFilter> = [
    'all',
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED',
    'ARCHIVED',
];

const VALID_TYPES: ReadonlyArray<TypeFilter> = [
    'all',
    'NEWS',
    'ARTICLE',
    'VIDEO',
    'TWEET',
    'COMMENT',
    'PODCAST',
];

const VALID_SORT_FIELDS: ReadonlyArray<SortField> = [
    'created_at',
    'published_at',
    'title',
    'type',
    'status',
];

function readFromParams(params: URLSearchParams): ContentListQueryState {
    const page = Number(params.get('page')) || DEFAULTS.page;
    const search = params.get('q') ?? DEFAULTS.search;
    const statusRaw = (params.get('status') ?? DEFAULTS.status) as StatusFilter;
    const status: StatusFilter = VALID_STATUSES.includes(statusRaw) ? statusRaw : 'all';
    const typeRaw = (params.get('type') ?? DEFAULTS.type) as TypeFilter;
    const type: TypeFilter = VALID_TYPES.includes(typeRaw) ? typeRaw : 'all';
    const sourceName = params.get('source') ?? DEFAULTS.sourceName;
    const sortFieldRaw = (params.get('sort') ?? DEFAULTS.sortField) as SortField;
    const sortField: SortField = VALID_SORT_FIELDS.includes(sortFieldRaw)
        ? sortFieldRaw
        : DEFAULTS.sortField;
    const sortDirRaw = params.get('dir') ?? DEFAULTS.sortDir;
    const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';

    return {
        page: Math.max(1, page),
        search,
        status,
        type,
        sourceName,
        sortField,
        sortDir,
    };
}

function toQueryString(state: ContentListQueryState): string {
    const params = new URLSearchParams();
    if (state.page !== DEFAULTS.page) params.set('page', String(state.page));
    if (state.search) params.set('q', state.search);
    if (state.status !== DEFAULTS.status) params.set('status', state.status);
    if (state.type !== DEFAULTS.type) params.set('type', state.type);
    if (state.sourceName) params.set('source', state.sourceName);
    if (state.sortField !== DEFAULTS.sortField) params.set('sort', state.sortField);
    if (state.sortDir !== DEFAULTS.sortDir) params.set('dir', state.sortDir);
    const s = params.toString();
    return s ? `?${s}` : '';
}

export function useContentListQueryState() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [state, setStateInternal] = useState<ContentListQueryState>(() =>
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const setState = useCallback((patch: Partial<ContentListQueryState>) => {
        setStateInternal((prev) => {
            const filterChanged =
                patch.search !== undefined ||
                patch.status !== undefined ||
                patch.type !== undefined ||
                patch.sourceName !== undefined;
            const resetPage = patch.page === undefined && filterChanged;
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
