import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getModes, setMode,
    getRankingConfig, updateRankingConfig, refreshNewsSnapshot,
    listContentFlags, upsertContentFlag, deleteContentFlag, bulkSetFlags,
    getEmbeddingClusters, getSimilarContent, getEmbeddingStats,
    getScoreDistribution, getVelocityLeaderboard, getTrendingItems,
    getSourcePerformance, getSignalHealth,
    previewPodsFeed, previewNewsFeed,
    getMediaValueConfig, updateMediaValueConfig, triggerMediaValueRefresh,
    getMediaIntelligenceObservatory,
} from '@/lib/api/cms/intelligence';
import type {
    UpdateRankingConfigRequest,
    UpsertFlagRequest,
    BulkFlagRequest,
    UpdateMediaValueConfigRequest,
} from '@/types/platform/intelligence';
import { mediaCirculationKeys } from '@/hooks/use-media-circulation';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

// ---- Query Keys ----
export const intelligenceKeys = {
    all: ['intelligence'] as const,
    modes: () => [...intelligenceKeys.all, 'modes'] as const,
    config: () => [...intelligenceKeys.all, 'config'] as const,
    flags: () => [...intelligenceKeys.all, 'flags'] as const,
    flagList: (params: object) => [...intelligenceKeys.flags(), params] as const,
    clusters: () => [...intelligenceKeys.all, 'clusters'] as const,
    similar: (id: string) => [...intelligenceKeys.all, 'similar', id] as const,
    embedStats: () => [...intelligenceKeys.all, 'embed-stats'] as const,
    scoreDist: () => [...intelligenceKeys.all, 'score-dist'] as const,
    velocity: (hours: number) => [...intelligenceKeys.all, 'velocity', hours] as const,
    trending: () => [...intelligenceKeys.all, 'trending'] as const,
    sourcePerf: () => [...intelligenceKeys.all, 'source-perf'] as const,
    signalHealth: () => [...intelligenceKeys.all, 'signal-health'] as const,
    previewPods: (overrides?: object) => [...intelligenceKeys.all, 'preview-pods', overrides] as const,
    previewNews: (overrides?: object) => [...intelligenceKeys.all, 'preview-news', overrides] as const,
    mediaValueConfig: () => [...intelligenceKeys.all, 'media-value-config'] as const,
    observatory: () => [...intelligenceKeys.all, 'observatory'] as const,
};

// ---- Modes ----
export function useModes() {
    return useQuery({
        queryKey: intelligenceKeys.modes(),
        queryFn: getModes,
        staleTime: CACHE_CONFIG.reference.staleTime,
        gcTime: CACHE_CONFIG.reference.gcTime,
    });
}

export function useSetMode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mode: string) => setMode(mode),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.config() });
            qc.invalidateQueries({ queryKey: intelligenceKeys.scoreDist() });
            toast({ title: 'Mode activated', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to set mode', description: e.message, variant: 'destructive' }),
    });
}

// ---- Ranking Config ----
export function useRankingConfig() {
    return useQuery({
        queryKey: intelligenceKeys.config(),
        queryFn: getRankingConfig,
        staleTime: CACHE_CONFIG.details.staleTime,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

export function useUpdateRankingConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateRankingConfigRequest) => updateRankingConfig(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.config() });
            qc.invalidateQueries({ queryKey: intelligenceKeys.scoreDist() });
            toast({ title: 'Algorithm updated', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to update', description: e.message, variant: 'destructive' }),
    });
}

export function useRefreshNewsSnapshot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: refreshNewsSnapshot,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.config() });
            toast({ title: `News snapshot rebuilt (${res.slide_count} slides)`, variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to rebuild snapshot', description: e.message, variant: 'destructive' }),
    });
}

// ---- Content Flags ----
export function useContentFlags(params: { page?: number; limit?: number } = {}) {
    return useQuery({
        queryKey: intelligenceKeys.flagList(params),
        queryFn: () => listContentFlags(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useUpsertFlag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ contentId, data }: { contentId: string; data: UpsertFlagRequest }) =>
            upsertContentFlag(contentId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.flags() });
            toast({ title: 'Flag updated', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
    });
}

export function useDeleteFlag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (contentId: string) => deleteContentFlag(contentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.flags() });
            toast({ title: 'Flag removed', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
    });
}

export function useBulkSetFlags() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: BulkFlagRequest) => bulkSetFlags(data),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.flags() });
            toast({ title: `Updated ${res.updated} flags`, variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Bulk flag failed', description: e.message, variant: 'destructive' }),
    });
}

// ---- Embeddings ----
export function useEmbeddingClusters() {
    return useQuery({ queryKey: intelligenceKeys.clusters(), queryFn: getEmbeddingClusters, staleTime: CACHE_CONFIG.reference.staleTime });
}

export function useSimilarContent(contentId: string) {
    return useQuery({
        queryKey: intelligenceKeys.similar(contentId),
        queryFn: () => getSimilarContent(contentId),
        enabled: !!contentId,
        staleTime: CACHE_CONFIG.details.staleTime,
    });
}

export function useEmbeddingStats() {
    return useQuery({ queryKey: intelligenceKeys.embedStats(), queryFn: getEmbeddingStats, staleTime: CACHE_CONFIG.reference.staleTime });
}

// ---- Analytics ----
export function useScoreDistribution() {
    return useQuery({ queryKey: intelligenceKeys.scoreDist(), queryFn: getScoreDistribution, staleTime: CACHE_CONFIG.lists.staleTime });
}

export function useVelocityLeaderboard(hours = 24) {
    return useQuery({ queryKey: intelligenceKeys.velocity(hours), queryFn: () => getVelocityLeaderboard(hours), staleTime: CACHE_CONFIG.lists.staleTime });
}

export function useTrendingItems() {
    return useQuery({ queryKey: intelligenceKeys.trending(), queryFn: getTrendingItems, staleTime: CACHE_CONFIG.lists.staleTime });
}

export function useSourcePerformance() {
    return useQuery({ queryKey: intelligenceKeys.sourcePerf(), queryFn: getSourcePerformance, staleTime: CACHE_CONFIG.reference.staleTime });
}

export function useSignalHealth() {
    return useQuery({ queryKey: intelligenceKeys.signalHealth(), queryFn: getSignalHealth, staleTime: CACHE_CONFIG.reference.staleTime });
}

// ---- Feed Preview ----
export function usePreviewPods(overrides?: Record<string, number>) {
    return useQuery({
        queryKey: intelligenceKeys.previewPods(overrides),
        queryFn: () => previewPodsFeed(overrides),
        staleTime: 0, // always re-fetch previews
    });
}

export function usePreviewNews(overrides?: Record<string, number>) {
    return useQuery({
        queryKey: intelligenceKeys.previewNews(overrides),
        queryFn: () => previewNewsFeed(overrides),
        staleTime: 0,
    });
}

// ---- Media Value engine (stage-4) control room ----
export function useMediaValueConfig() {
    return useQuery({
        queryKey: intelligenceKeys.mediaValueConfig(),
        queryFn: getMediaValueConfig,
        staleTime: CACHE_CONFIG.details.staleTime,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

export function useUpdateMediaValueConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateMediaValueConfigRequest) => updateMediaValueConfig(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.mediaValueConfig() });
            qc.invalidateQueries({ queryKey: intelligenceKeys.observatory() });
            qc.invalidateQueries({ queryKey: mediaCirculationKeys.intelligence() });
            toast({ title: 'Value engine updated', variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to update value engine', description: e.message, variant: 'destructive' }),
    });
}

export function useRefreshMediaValueScores() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: triggerMediaValueRefresh,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: intelligenceKeys.observatory() });
            qc.invalidateQueries({ queryKey: mediaCirculationKeys.intelligence() });
            toast({ title: `Refreshed ${res.refreshed} score${res.refreshed === 1 ? '' : 's'}`, variant: 'success' });
        },
        onError: (e: Error) => toast({ title: 'Failed to refresh scores', description: e.message, variant: 'destructive' }),
    });
}

export function useMediaIntelligenceObservatory() {
    return useQuery({
        queryKey: intelligenceKeys.observatory(),
        queryFn: getMediaIntelligenceObservatory,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}
