import { cmsClient } from '@/lib/api/client';
import {
    bulkDeleteContent,
    type BulkDeleteResponse,
} from '@/lib/api/cms/content';
import type {
    ContentItem,
    ContentStatus,
    ListContentResponse,
} from '@/types/platform/content';
import type {
    BulkStatusBody,
    BulkStatusResult,
    AuditLogListResponse,
    BulkTopicBody,
    CreateNewsRequest,
    ExtractUrlResult,
    ImportFeedResult,
    LabelBatchResult,
    ListTopicsParams,
    MergeTopicsBody,
    NewsLineupParams,
    NewsCirculationPolicy,
    NewsStoryOverride,
    NewsWindow,
    ReclassifyResult,
    ReclusterResult,
    CirculationMetricsResponse,
    CirculationPreviewResponse,
    SourceCirculationRecommendation,
    SourceRecommendationsResponse,
    StoryOverridesResponse,
    TopicContentParams,
    TopicsListResponse,
    UpdateCirculationPolicyRequest,
    UpsertStoryOverrideRequest,
} from '@/types/platform/news';

/** RFC3339 timestamp for `days` ago — used by age-based rotation. */
export function daysAgoISO(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * The current News lineup — ARTICLE content scoped to a status (defaults to the
 * live READY feed). GET /admin/content?type=ARTICLE
 */
export async function listNewsLineup(
    params: NewsLineupParams = {}
): Promise<ListContentResponse> {
    return cmsClient.get<ListContentResponse>('/admin/content', {
        ...params,
        type: 'NEWS',
        status: params.status ?? 'READY',
    });
}

/**
 * The promote queue — ingested-but-unpublished articles awaiting curation.
 * GET /admin/content?type=ARTICLE&status=PENDING
 */
export async function listPendingArticles(
    params: { page?: number; limit?: number; search?: string } = {}
): Promise<ListContentResponse> {
    return cmsClient.get<ListContentResponse>('/admin/content', {
        ...params,
        type: 'NEWS',
        status: 'PENDING',
    });
}

/** Manually create / publish a news article. POST /admin/content */
export async function createNewsArticle(
    data: CreateNewsRequest
): Promise<ContentItem> {
    return cmsClient.post<ContentItem>('/admin/content', data);
}

/** Extract a single URL to prefill the compose form. POST /admin/content/extract-url */
export async function extractNewsUrl(url: string): Promise<ExtractUrlResult> {
    return cmsClient.post<ExtractUrlResult>('/admin/content/extract-url', { url });
}

/** Import EVERY item from an RSS/Atom feed in one call. POST /admin/content/import-feed */
export async function importFeed(url: string): Promise<ImportFeedResult> {
    return cmsClient.post<ImportFeedResult>('/admin/content/import-feed', { url });
}

/**
 * Move explicitly-selected articles to a status — powers archive (→ARCHIVED),
 * restore (→READY) and promote (→READY). POST /admin/content/bulk-status
 */
export async function setNewsStatusByIds(
    ids: string[],
    toStatus: ContentStatus
): Promise<BulkStatusResult> {
    return cmsClient.post<BulkStatusResult>('/admin/content/bulk-status', {
        ids,
        to_status: toStatus,
    });
}

/**
 * Archive READY articles older than `days` (recoverable rotation).
 * Pass `dryRun` to preview the affected count.
 */
export async function archiveNewsOlderThan(
    days: number,
    dryRun = false
): Promise<BulkStatusResult> {
    return cmsClient.post<BulkStatusResult>('/admin/content/bulk-status', {
        from_status: 'READY',
        to_status: 'ARCHIVED',
        type: 'NEWS',
        created_before: daysAgoISO(days),
        limit: 500,
        dry_run: dryRun,
    });
}

/** Permanently delete the selected articles. */
export async function deleteNewsByIds(ids: string[]): Promise<BulkDeleteResponse> {
    return bulkDeleteContent({ ids, dry_run: false });
}

/**
 * Permanently delete ARTICLE content older than `days` (type-scoped).
 * Pass `dryRun` to preview the affected count.
 */
export async function deleteNewsOlderThan(
    days: number,
    dryRun = false
): Promise<BulkDeleteResponse> {
    return bulkDeleteContent({
        type: 'NEWS',
        created_before: daysAgoISO(days),
        dry_run: dryRun,
    });
}

// ─── Topic-centric management ───────────────────────────────

/** Aggregated topic rows with per-status counts. GET /admin/content/topics */
export async function listTopics(
    params: ListTopicsParams = {}
): Promise<TopicsListResponse> {
    return cmsClient.get<TopicsListResponse>('/admin/content/topics', {
        type: 'NEWS',
        ...params,
    });
}

/** A topic's content (by topic_id / "none" / all), filtered + paginated. */
export async function listTopicContent(
    params: TopicContentParams
): Promise<ListContentResponse> {
    return cmsClient.get<ListContentResponse>('/admin/content', {
        type: 'NEWS',
        ...params,
    });
}

/**
 * Bulk status change (publish / archive / restore). Pass `ids` for explicit
 * rows, or a filter (topic_id/status/…) to act on the whole matching set in one
 * uncapped call. `dry_run` returns the affected count.
 * POST /admin/content/bulk-status
 */
export async function bulkSetStatus(
    body: BulkStatusBody
): Promise<BulkStatusResult> {
    return cmsClient.post<BulkStatusResult>('/admin/content/bulk-status', body);
}

/**
 * Bulk delete by explicit ids or filter (topic_id-scoped, uncapped).
 * POST /admin/content/bulk-delete
 */
export async function bulkDeleteNews(body: {
    ids?: string[];
    status?: string;
    type?: string;
    topic?: string;
    topic_id?: string;
    source_name?: string;
    created_before?: string;
    dry_run?: boolean;
}): Promise<BulkDeleteResponse> {
    return bulkDeleteContent({ type: 'ARTICLE', ...body });
}

// ─── First-class topic management ───────────────────────────

/** Rename a topic. PATCH /admin/topics/:id */
export async function renameTopic(id: string, label: string): Promise<unknown> {
    return cmsClient.patch('/admin/topics/' + id, { label });
}

/** Merge source topics into a target. POST /admin/topics/merge */
export async function mergeTopics(body: MergeTopicsBody): Promise<unknown> {
    return cmsClient.post('/admin/topics/merge', body);
}

/** Delete a topic (its content becomes uncategorized). DELETE /admin/topics/:id */
export async function deleteTopic(id: string): Promise<unknown> {
    return cmsClient.delete('/admin/topics/' + id);
}

/**
 * Move a selection (ids or filter) to a target topic, or uncategorize
 * (target_topic_id empty). POST /admin/content/bulk-topic
 */
export async function assignTopic(body: BulkTopicBody): Promise<BulkStatusResult> {
    return cmsClient.post<BulkStatusResult>('/admin/content/bulk-topic', body);
}

/** Backfill classification for a batch of unclassified articles. */
export async function reclassifyTopics(limit = 25): Promise<ReclassifyResult> {
    return cmsClient.post<ReclassifyResult>('/admin/topics/reclassify', { limit });
}

/**
 * Full re-cluster pass — rebuilds the whole taxonomy by k-means over all
 * article embeddings. Fast (no LLM); naming follows via labelTopicsBatch.
 * POST /admin/topics/recluster
 */
export async function reclusterTopics(k?: number): Promise<ReclusterResult> {
    return cmsClient.post<ReclusterResult>(
        '/admin/topics/recluster',
        k && k > 0 ? { k } : {}
    );
}

// ─── News Circulation ──────────────────────────────────────

export const getCirculationPolicy = () =>
    cmsClient.get<NewsCirculationPolicy>('/admin/news/circulation/policy');

export const updateCirculationPolicy = (data: UpdateCirculationPolicyRequest) =>
    cmsClient.put<NewsCirculationPolicy>('/admin/news/circulation/policy', data);

export const applyCirculationPreset = (preset = 'latest_plus') =>
    cmsClient.post<NewsCirculationPolicy>(`/admin/news/circulation/presets/${preset}`, {});

export const previewCirculation = (
    window: NewsWindow,
    limit = 12,
    policy?: NewsCirculationPolicy
) => {
    if (policy) {
        return cmsClient.post<CirculationPreviewResponse>('/admin/news/circulation/preview', {
            window,
            limit,
            policy,
        });
    }
    return cmsClient.get<CirculationPreviewResponse>('/admin/news/circulation/preview', { window, limit });
};

export const getCirculationMetrics = () =>
    cmsClient.get<CirculationMetricsResponse>('/admin/news/circulation/metrics');

export const listStoryOverrides = () =>
    cmsClient.get<StoryOverridesResponse>('/admin/news/circulation/overrides');

export const upsertStoryOverride = (storyId: string, data: UpsertStoryOverrideRequest) =>
    cmsClient.put<NewsStoryOverride>(`/admin/news/circulation/overrides/${storyId}`, data);

export const deleteStoryOverride = (storyId: string) =>
    cmsClient.delete<{ message: string }>(`/admin/news/circulation/overrides/${storyId}`);

export const listSourceRecommendations = () =>
    cmsClient.get<SourceRecommendationsResponse>('/admin/news/circulation/source-recommendations');

export const generateSourceRecommendations = () =>
    cmsClient.post<SourceRecommendationsResponse>('/admin/news/circulation/source-recommendations/generate', {});

export const applySourceRecommendation = (id: string) =>
    cmsClient.post<SourceCirculationRecommendation>(`/admin/news/circulation/source-recommendations/${id}/apply`, {});

export const runCirculationNow = () =>
    cmsClient.post<{ success?: boolean; message?: string; jobId?: string }>('/admin/news/circulation/sweep-now', {});

export const listCirculationAudit = () =>
    cmsClient.get<AuditLogListResponse>('/admin/audit', { service: 'news_circulation', limit: 10 });

/** Name one batch of freshly-clustered topics via the LLM. */
export async function labelTopicsBatch(limit = 8): Promise<LabelBatchResult> {
    return cmsClient.post<LabelBatchResult>('/admin/topics/label-batch', { limit });
}
