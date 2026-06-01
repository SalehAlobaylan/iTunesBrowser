import { cmsClient } from '@/lib/api/client';
import type {
    ContentItem,
    ContentStatus,
    ListContentParams,
    ListContentResponse,
    UpdateContentStatusRequest,
} from '@/types/platform/content';

/**
 * List all content items with optional filters
 * GET /admin/content
 */
export async function listContent(params?: ListContentParams): Promise<ListContentResponse> {
    return cmsClient.get<ListContentResponse>('/admin/content', params);
}

/**
 * Get a single content item by ID
 * GET /admin/content/:id
 */
export async function getContent(id: string): Promise<ContentItem> {
    return cmsClient.get<ContentItem>(`/admin/content/${id}`);
}

/**
 * Update content item status (e.g., archive)
 * PATCH /admin/content/:id/status
 */
export async function updateContentStatus(
    id: string,
    data: UpdateContentStatusRequest
): Promise<ContentItem> {
    return cmsClient.patch<ContentItem>(`/admin/content/${id}/status`, data);
}

export interface BulkDeleteRequest {
    status?: string;
    source_name?: string;
    /** Content type filter (e.g. ARTICLE) — keeps age-based deletes type-scoped. */
    type?: string;
    /** Topic-tag membership filter (text[] ANY match). */
    topic?: string;
    created_before?: string;
    /** Optional list of public_ids. When present, the other filters are ignored. */
    ids?: string[];
    dry_run?: boolean;
}

export interface BulkDeleteResponse {
    deleted_count: number;
    message: string;
}

/**
 * Bulk delete content items based on filters
 * POST /admin/content/bulk-delete
 */
export async function bulkDeleteContent(data: BulkDeleteRequest): Promise<BulkDeleteResponse> {
    return cmsClient.post<BulkDeleteResponse>('/admin/content/bulk-delete', data);
}

/**
 * Get all distinct source names
 * GET /admin/content/source-names
 */
export async function listSourceNames(): Promise<string[]> {
    const res = await cmsClient.get<{ source_names: string[] }>('/admin/content/source-names');
    return res.source_names ?? [];
}

/**
 * Per-status totals across the full tenant (not page-scoped).
 * GET /admin/content/status-counts
 */
export type StatusCounts = Record<ContentStatus, number>;

export async function getStatusCounts(): Promise<StatusCounts> {
    return cmsClient.get<StatusCounts>('/admin/content/status-counts');
}

/**
 * Delete content items by an explicit list of UUIDs.
 * Convenience wrapper around the extended bulk-delete endpoint.
 */
export async function deleteContentByIds(ids: string[]): Promise<BulkDeleteResponse> {
    return bulkDeleteContent({ ids, dry_run: false });
}

export interface BulkSetStatusRequest {
    from_status: ContentStatus;
    to_status: ContentStatus;
    source_name?: string;
    /** Server caps at 500. */
    limit?: number;
}

export interface BulkSetStatusResponse {
    updated_count: number;
    message: string;
}

/**
 * Move all items matching `from_status` (and optional source) to `to_status`.
 * Used by the Tools menu — distinct from per-id PATCH used by row selection.
 * POST /admin/content/bulk-status
 */
export async function bulkSetContentStatus(
    data: BulkSetStatusRequest
): Promise<BulkSetStatusResponse> {
    return cmsClient.post<BulkSetStatusResponse>('/admin/content/bulk-status', data);
}
