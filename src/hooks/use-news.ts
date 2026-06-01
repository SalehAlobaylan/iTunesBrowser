import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    archiveNewsOlderThan,
    createNewsArticle,
    deleteNewsByIds,
    deleteNewsOlderThan,
    extractNewsUrl,
    listNewsLineup,
    listPendingArticles,
    setNewsStatusByIds,
} from '@/lib/api/cms/news';
import { contentKeys } from '@/hooks/use-content';
import { intelligenceKeys } from '@/hooks/use-intelligence';
import {
    listContentFlags,
    upsertContentFlag,
    deleteContentFlag,
} from '@/lib/api/cms/intelligence';
import type { ContentStatus } from '@/types/platform/content';
import type { CreateNewsRequest, NewsLineupParams } from '@/types/platform/news';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

// Query keys
export const newsKeys = {
    all: ['news'] as const,
    lineups: () => [...newsKeys.all, 'lineup'] as const,
    lineup: (params: NewsLineupParams) => [...newsKeys.lineups(), params] as const,
    queues: () => [...newsKeys.all, 'queue'] as const,
    queue: (params: { page?: number; limit?: number; search?: string }) =>
        [...newsKeys.queues(), params] as const,
};

/** Anything that mutates content invalidates both the News views and the
 * shared Content lists/status-counts so every surface stays consistent. */
function useInvalidateNews() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: newsKeys.all });
        queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: contentKeys.statusCounts() });
    };
}

/** The current News lineup for a given status view. */
export function useNewsLineup(
    params: NewsLineupParams = {},
    options: { paused?: boolean } = {}
) {
    const { paused = false } = options;
    return useQuery({
        queryKey: newsKeys.lineup(params),
        queryFn: () => listNewsLineup(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: paused ? false : 30_000,
        refetchIntervalInBackground: false,
    });
}

/** Ingested-but-unpublished articles for the promote queue. */
export function usePendingArticles(
    params: { page?: number; limit?: number; search?: string } = {},
    options: { enabled?: boolean } = {}
) {
    const { enabled = true } = options;
    return useQuery({
        queryKey: newsKeys.queue(params),
        queryFn: () => listPendingArticles(params),
        enabled,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

/** Manual compose / publish-from-URL. */
export function useCreateNews() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (data: CreateNewsRequest) => createNewsArticle(data),
        onSuccess: (item) => {
            invalidate();
            toast({
                title: 'News published',
                description: item.title
                    ? `"${item.title}" is now live.`
                    : 'The article is now live.',
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to publish',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/** Extract a URL into draft fields (no write — just prefill). */
export function useExtractNewsUrl() {
    return useMutation({
        mutationFn: (url: string) => extractNewsUrl(url),
        onError: (error: Error) => {
            toast({
                title: 'Could not read that URL',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Move selected articles to a status. Covers archive (→ARCHIVED),
 * restore (→READY) and promote-from-queue (→READY).
 */
export function useSetNewsStatus() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: ({ ids, toStatus }: { ids: string[]; toStatus: ContentStatus }) =>
            setNewsStatusByIds(ids, toStatus),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: 'Lineup updated',
                description: res.message || `${res.updated_count} item(s) updated.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/** Permanently delete the selected articles. */
export function useDeleteNewsByIds() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (ids: string[]) => deleteNewsByIds(ids),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: 'News deleted',
                description: res.message || `Deleted ${res.deleted_count} item(s).`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Rotate out everything older than `days` — archive (recoverable) or delete
 * (permanent). The dry-run preview is done directly via the api functions in
 * the toolbar; this hook performs the committed action.
 */
export function useRotateOlderThan() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: async ({
            days,
            mode,
        }: {
            days: number;
            mode: 'archive' | 'delete';
        }): Promise<{ count: number; message: string }> => {
            if (mode === 'archive') {
                const res = await archiveNewsOlderThan(days, false);
                return { count: res.updated_count, message: res.message };
            }
            const res = await deleteNewsOlderThan(days, false);
            return { count: res.deleted_count, message: res.message };
        },
        onSuccess: (res, { mode }) => {
            invalidate();
            toast({
                title: mode === 'archive' ? 'Old news archived' : 'Old news deleted',
                description: res.message || `${res.count} item(s) rotated out.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Rotation failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Set of content ids currently pinned to the top of the news feed
 * (featured). Derived from the shared content-flags query so it stays in
 * sync with the Intelligence flag views.
 */
export function useFeaturedIds() {
    const params = { limit: 200 };
    return useQuery({
        queryKey: intelligenceKeys.flagList(params),
        queryFn: () => listContentFlags(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        select: (res) =>
            new Set(
                res.data
                    .filter((f) => f.pin_to_top)
                    .map((f) => f.content_item_id)
            ),
    });
}

/**
 * Feature / unfeature a story. Featuring pins it to the top of the news feed
 * (via the content-flag system); unfeaturing clears the flag.
 */
export function useSetFeatured() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, on }: { id: string; on: boolean }) =>
            on
                ? upsertContentFlag(id, { pin_to_top: true })
                : deleteContentFlag(id),
        onSuccess: (_res, { on }) => {
            queryClient.invalidateQueries({ queryKey: intelligenceKeys.flags() });
            queryClient.invalidateQueries({ queryKey: newsKeys.all });
            toast({
                title: on ? 'Featured' : 'Unfeatured',
                description: on
                    ? 'Pinned to the top of the news feed.'
                    : 'Removed from featured.',
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Featuring failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
