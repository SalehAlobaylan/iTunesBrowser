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
    NewsWindow,
    NewsCirculationPolicy,
    UpdateCirculationPolicyRequest,
    CirculationPreviewResponse,
    CirculationMetricsResponse,
    StoryOverridesResponse,
    UpsertStoryOverrideRequest,
    NewsStoryOverride,
    SourceRecommendationsResponse,
    SourceCirculationRecommendation,
    AuditLogListResponse,
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
export const previewForYouFeed = (overrides?: Record<string, number>) =>
    cmsClient.get<PreviewFeedResponse>('/admin/intelligence/preview/foryou', overrides);

export const previewNewsFeed = (overrides?: Record<string, number>) =>
    cmsClient.get<PreviewFeedResponse>('/admin/intelligence/preview/news', overrides);

// ---- News Circulation ----
export const getCirculationPolicy = () =>
    cmsClient.get<NewsCirculationPolicy>('/admin/intelligence/circulation/policy');

export const updateCirculationPolicy = (data: UpdateCirculationPolicyRequest) =>
    cmsClient.put<NewsCirculationPolicy>('/admin/intelligence/circulation/policy', data);

export const applyCirculationPreset = (preset = 'latest_plus') =>
    cmsClient.post<NewsCirculationPolicy>(`/admin/intelligence/circulation/presets/${preset}`, {});

export const previewCirculation = (window: NewsWindow, limit = 12) =>
    cmsClient.get<CirculationPreviewResponse>('/admin/intelligence/circulation/preview', { window, limit });

export const getCirculationMetrics = () =>
    cmsClient.get<CirculationMetricsResponse>('/admin/intelligence/circulation/metrics');

export const listStoryOverrides = () =>
    cmsClient.get<StoryOverridesResponse>('/admin/intelligence/circulation/overrides');

export const upsertStoryOverride = (storyId: string, data: UpsertStoryOverrideRequest) =>
    cmsClient.put<NewsStoryOverride>(`/admin/intelligence/circulation/overrides/${storyId}`, data);

export const deleteStoryOverride = (storyId: string) =>
    cmsClient.delete<{ message: string }>(`/admin/intelligence/circulation/overrides/${storyId}`);

export const listSourceRecommendations = () =>
    cmsClient.get<SourceRecommendationsResponse>('/admin/intelligence/circulation/source-recommendations');

export const generateSourceRecommendations = () =>
    cmsClient.post<SourceRecommendationsResponse>('/admin/intelligence/circulation/source-recommendations/generate', {});

export const applySourceRecommendation = (id: string) =>
    cmsClient.post<SourceCirculationRecommendation>(`/admin/intelligence/circulation/source-recommendations/${id}/apply`, {});

export const listCirculationAudit = () =>
    cmsClient.get<AuditLogListResponse>('/admin/audit', { service: 'news_circulation', limit: 10 });
