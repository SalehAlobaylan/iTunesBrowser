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
    BulkStatusResult,
    CreateNewsRequest,
    ExtractUrlResult,
    NewsLineupParams,
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
        type: 'ARTICLE',
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
        type: 'ARTICLE',
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
        type: 'ARTICLE',
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
        type: 'ARTICLE',
        created_before: daysAgoISO(days),
        dry_run: dryRun,
    });
}
