import { cmsClient } from '@/lib/api/client';
import type {
    ContentItem,
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
    created_before?: string;
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
