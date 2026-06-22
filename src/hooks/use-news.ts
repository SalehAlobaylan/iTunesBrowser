import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    archiveNewsOlderThan,
    assignTopic,
    bulkDeleteNews,
    bulkSetStatus,
    getCirculationPolicy,
    updateCirculationPolicy,
    applyCirculationPreset,
    previewCirculation,
    getCirculationMetrics,
    listStoryOverrides,
    upsertStoryOverride,
    deleteStoryOverride,
    listSourceRecommendations,
    generateSourceRecommendations,
    applySourceRecommendation,
    runCirculationNow,
    listCirculationAudit,
    getCirculationAutopilotStatus,
    updateCirculationAutopilotSettings,
    runCirculationAutopilot,
    boostCirculationAutopilot,
    pauseCirculationAutopilot,
    listCirculationAutopilotRuns,
    createNewsArticle,
    deleteNewsByIds,
    deleteNewsOlderThan,
    deleteTopic,
    extractNewsUrl,
    importFeed,
    listNewsLineup,
    listPendingArticles,
    listTopicContent,
    listTopics,
    mergeTopics,
    reclassifyTopics,
    renameTopic,
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
import type {
    BulkStatusBody,
    BulkTopicBody,
    CreateNewsRequest,
    ListTopicsParams,
    MergeTopicsBody,
    NewsLineupParams,
    NewsCirculationPolicy,
    NewsWindow,
    BoostAutopilotRequest,
    TopicContentParams,
    UpdateAutopilotSettingsRequest,
    UpdateCirculationPolicyRequest,
    UpsertStoryOverrideRequest,
} from '@/types/platform/news';
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
    topics: () => [...newsKeys.all, 'topics'] as const,
    topicList: (params: ListTopicsParams) =>
        [...newsKeys.topics(), params] as const,
    topicContents: () => [...newsKeys.all, 'topic-content'] as const,
    topicContent: (params: TopicContentParams) =>
        [...newsKeys.topicContents(), params] as const,
    circulation: () => [...newsKeys.all, 'circulation'] as const,
    circulationPolicy: () => [...newsKeys.circulation(), 'policy'] as const,
    circulationPreview: (window: NewsWindow) => [...newsKeys.circulation(), 'preview', window] as const,
    circulationMetrics: () => [...newsKeys.circulation(), 'metrics'] as const,
    circulationOverrides: () => [...newsKeys.circulation(), 'overrides'] as const,
    sourceRecommendations: () => [...newsKeys.circulation(), 'source-recommendations'] as const,
    circulationAudit: () => [...newsKeys.circulation(), 'audit'] as const,
    circulationAutopilot: () => [...newsKeys.circulation(), 'autopilot'] as const,
    circulationAutopilotRuns: () => [...newsKeys.circulationAutopilot(), 'runs'] as const,
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

/** Import every item from an RSS/Atom feed in one shot. */
export function useImportFeed() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (url: string) => importFeed(url),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: res.is_feed ? 'Feed imported' : 'Article imported',
                description: `${res.imported} added${res.skipped ? `, ${res.skipped} skipped (duplicates)` : ''}.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Import failed',
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
        mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
            if (on) await upsertContentFlag(id, { pin_to_top: true });
            else await deleteContentFlag(id);
        },
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

// ─── Topic-centric management ───────────────────────────────

/** Aggregated topics with per-status counts (topics overview). */
export function useTopics(params: ListTopicsParams = {}) {
    return useQuery({
        queryKey: newsKeys.topicList(params),
        queryFn: () => listTopics(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

/** A single topic's content, filtered + paginated (topic detail). */
export function useTopicContent(
    params: TopicContentParams,
    options: { paused?: boolean } = {}
) {
    const { paused = false } = options;
    return useQuery({
        queryKey: newsKeys.topicContent(params),
        queryFn: () => listTopicContent(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: paused ? false : 30_000,
        refetchIntervalInBackground: false,
    });
}

/** Bulk status change (publish/archive/restore) by ids or filter. */
export function useBulkStatus() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (body: BulkStatusBody) => bulkSetStatus(body),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: 'Updated',
                description: res.message || `${res.updated_count} item(s) updated.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Bulk update failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/** Bulk delete by ids or filter. */
export function useBulkDeleteNews() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (body: Parameters<typeof bulkDeleteNews>[0]) =>
            bulkDeleteNews(body),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: 'Deleted',
                description: res.message || `Deleted ${res.deleted_count} item(s).`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Bulk delete failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/** Move a selection (ids or filter) to a target topic, or uncategorize. */
export function useAssignTopic() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (body: BulkTopicBody) => assignTopic(body),
        onSuccess: (res) => {
            invalidate();
            toast({
                title: 'Moved',
                description: res.message || `${res.updated_count} item(s) moved.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Move failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/** Rename a first-class topic. */
export function useRenameTopic() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: ({ id, label }: { id: string; label: string }) =>
            renameTopic(id, label),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Topic renamed', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Rename failed', description: error.message, variant: 'destructive' }),
    });
}

/** Merge source topics into a target. */
export function useMergeTopics() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (body: MergeTopicsBody) => mergeTopics(body),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Topics merged', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Merge failed', description: error.message, variant: 'destructive' }),
    });
}

/** Delete a topic (its content becomes uncategorized). */
export function useDeleteTopic() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (id: string) => deleteTopic(id),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Topic deleted', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }),
    });
}

/** Backfill classification for unclassified articles (one batch). */
export function useReclassify() {
    const invalidate = useInvalidateNews();
    return useMutation({
        mutationFn: (limit?: number) => reclassifyTopics(limit),
        onSuccess: () => invalidate(),
        onError: (error: Error) =>
            toast({ title: 'Reclassify failed', description: error.message, variant: 'destructive' }),
    });
}

// ─── Circulation ───────────────────────────────────────────

export function useCirculationPolicy() {
    return useQuery({
        queryKey: newsKeys.circulationPolicy(),
        queryFn: getCirculationPolicy,
        staleTime: CACHE_CONFIG.details.staleTime,
    });
}

export function useUpdateCirculationPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateCirculationPolicyRequest) => updateCirculationPolicy(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Circulation policy saved', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to save circulation policy', description: e.message, variant: 'destructive' }),
    });
}

export function useApplyCirculationPreset() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (preset: string) => applyCirculationPreset(preset),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Circulation preset applied', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to apply preset', description: e.message, variant: 'destructive' }),
    });
}

export function useCirculationPreview(window: NewsWindow, policy?: NewsCirculationPolicy) {
    return useQuery({
        queryKey: [...newsKeys.circulationPreview(window), policy] as const,
        queryFn: () => previewCirculation(window, 12, policy),
        staleTime: 0,
    });
}

export function useCirculationMetrics() {
    return useQuery({
        queryKey: newsKeys.circulationMetrics(),
        queryFn: getCirculationMetrics,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useStoryOverrides() {
    return useQuery({
        queryKey: newsKeys.circulationOverrides(),
        queryFn: listStoryOverrides,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useUpsertStoryOverride() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ storyId, data }: { storyId: string; data: UpsertStoryOverrideRequest }) =>
            upsertStoryOverride(storyId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Story override saved', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to save override', description: e.message, variant: 'destructive' }),
    });
}

export function useDeleteStoryOverride() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (storyId: string) => deleteStoryOverride(storyId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Story override removed', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to remove override', description: e.message, variant: 'destructive' }),
    });
}

export function useSourceRecommendations() {
    return useQuery({
        queryKey: newsKeys.sourceRecommendations(),
        queryFn: listSourceRecommendations,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useGenerateSourceRecommendations() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: generateSourceRecommendations,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({
                title: `${res.data.length} source recommendations refreshed`,
                description: res.auto_applied ? 'Auto-apply guardrails changed source cadence.' : undefined,
                variant: 'success',
            });
        },
        onError: (e: Error) => toast({ title: 'Failed to refresh source recommendations', description: e.message, variant: 'destructive' }),
    });
}

export function useApplySourceRecommendation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => applySourceRecommendation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Source cadence updated', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to apply recommendation', description: e.message, variant: 'destructive' }),
    });
}

export function useRunCirculationNow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: runCirculationNow,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            qc.invalidateQueries({ queryKey: newsKeys.lineups() });
            toast({
                title: 'Circulation run queued',
                description: res.message,
                variant: 'success',
            });
        },
        onError: (e: Error) => toast({ title: 'Failed to run circulation', description: e.message, variant: 'destructive' }),
    });
}

export function useCirculationAudit() {
    return useQuery({
        queryKey: newsKeys.circulationAudit(),
        queryFn: listCirculationAudit,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useCirculationAutopilotStatus() {
    return useQuery({
        queryKey: newsKeys.circulationAutopilot(),
        queryFn: getCirculationAutopilotStatus,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });
}

export function useUpdateCirculationAutopilotSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateAutopilotSettingsRequest) => updateCirculationAutopilotSettings(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Autopilot settings saved', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to save Autopilot settings', description: e.message, variant: 'destructive' }),
    });
}

export function useRunCirculationAutopilot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: runCirculationAutopilot,
        onSuccess: (run) => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Autopilot run completed', description: run.summary, variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Autopilot run failed', description: e.message, variant: 'destructive' }),
    });
}

export function useBoostCirculationAutopilot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data?: BoostAutopilotRequest) => boostCirculationAutopilot(data),
        onSuccess: (run) => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Freshness boost started', description: run.summary, variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to boost freshness', description: e.message, variant: 'destructive' }),
    });
}

export function usePauseCirculationAutopilot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: pauseCirculationAutopilot,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: newsKeys.circulation() });
            toast({ title: 'Autopilot paused', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to pause Autopilot', description: e.message, variant: 'destructive' }),
    });
}

export function useCirculationAutopilotRuns() {
    return useQuery({
        queryKey: newsKeys.circulationAutopilotRuns(),
        queryFn: () => listCirculationAutopilotRuns(10),
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}
