import { cmsClient } from '@/lib/api/client';
import type {
    RankingConfig,
    UpdateRankingConfigRequest,
    ModeDefinition,
    ContentFlagListResponse,
    ContentFlag,
    UpsertFlagRequest,
    BulkFlagRequest,
    ContentCluster,
    SimilarContentItem,
    EmbeddingStats,
    ScoreDistribution,
    VelocityItem,
    TrendingItem,
    SourcePerformance,
    SignalHealth,
    PreviewFeedResponse,
    MediaValueConfigResponse,
    UpdateMediaValueConfigRequest,
    MediaValueRefreshResult,
    ObservatorySnapshot,
} from '@/types/platform/intelligence';

// ---- Modes ----
export const getModes = () =>
    cmsClient.get<ModeDefinition[]>('/admin/intelligence/modes');

export const setMode = (mode: string) =>
    cmsClient.put<RankingConfig>('/admin/intelligence/mode', { mode });

// ---- Ranking Config ----
export const getRankingConfig = () =>
    cmsClient.get<RankingConfig>('/admin/intelligence/ranking');

export const updateRankingConfig = (data: UpdateRankingConfigRequest) =>
    cmsClient.put<RankingConfig>('/admin/intelligence/ranking', data);

// Rebuild the precomputed News-feed story-slide snapshot (precompute mode).
export const refreshNewsSnapshot = () =>
    cmsClient.post<{ slide_count: number; built_at: string }>(
        '/admin/intelligence/news-snapshot/refresh',
        {},
    );

// ---- Content Flags ----
export const listContentFlags = (params?: { page?: number; limit?: number }) =>
    cmsClient.get<ContentFlagListResponse>('/admin/intelligence/flags', params);

export const getContentFlag = (contentId: string) =>
    cmsClient.get<ContentFlag>(`/admin/intelligence/flags/${contentId}`);

export const upsertContentFlag = (contentId: string, data: UpsertFlagRequest) =>
    cmsClient.put<ContentFlag>(`/admin/intelligence/flags/${contentId}`, data);

export const deleteContentFlag = (contentId: string) =>
    cmsClient.delete<{ message: string }>(`/admin/intelligence/flags/${contentId}`);

export const bulkSetFlags = (data: BulkFlagRequest) =>
    cmsClient.post<{ updated: number }>('/admin/intelligence/flags/bulk', data);

// ---- Embeddings Explorer ----
export const getEmbeddingClusters = () =>
    cmsClient.get<ContentCluster[]>('/admin/intelligence/embeddings/clusters');

export const getSimilarContent = (contentId: string, limit = 10) =>
    cmsClient.get<SimilarContentItem[]>(`/admin/intelligence/embeddings/similar/${contentId}`, { limit });

export const getEmbeddingStats = () =>
    cmsClient.get<EmbeddingStats>('/admin/intelligence/embeddings/stats');

// ---- Analytics ----
export const getScoreDistribution = () =>
    cmsClient.get<ScoreDistribution[]>('/admin/intelligence/analytics/score-distribution');

export const getVelocityLeaderboard = (hours = 24) =>
    cmsClient.get<VelocityItem[]>('/admin/intelligence/analytics/velocity', { hours });

export const getTrendingItems = () =>
    cmsClient.get<TrendingItem[]>('/admin/intelligence/analytics/trending');

export const getSourcePerformance = () =>
    cmsClient.get<SourcePerformance[]>('/admin/intelligence/analytics/source-performance');

export const getSignalHealth = () =>
    cmsClient.get<SignalHealth[]>('/admin/intelligence/analytics/signal-health');

// ---- Feed Preview ----
export const previewPodsFeed = (overrides?: Record<string, number>) =>
    cmsClient.get<PreviewFeedResponse>('/admin/intelligence/preview/pods', overrides);

export const previewNewsFeed = (overrides?: Record<string, number>) =>
    cmsClient.get<PreviewFeedResponse>('/admin/intelligence/preview/news', overrides);

// ---- Media Value engine (stage-4) control room ----
export const getMediaValueConfig = () =>
    cmsClient.get<MediaValueConfigResponse>('/admin/media/intelligence/config');

export const updateMediaValueConfig = (data: UpdateMediaValueConfigRequest) =>
    cmsClient.put<MediaValueConfigResponse>('/admin/media/intelligence/config', data);

export const triggerMediaValueRefresh = () =>
    cmsClient.post<MediaValueRefreshResult>('/admin/media/intelligence/refresh');

export const getMediaIntelligenceObservatory = () =>
    cmsClient.get<ObservatorySnapshot>('/admin/media/intelligence/observatory');
