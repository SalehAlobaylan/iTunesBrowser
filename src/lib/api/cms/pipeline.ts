import { cmsClient } from '@/lib/api/client';
import type {
    StatusCounts,
    BulkStatusRequest,
    BulkStatusResponse,
} from '@/types/platform/pipeline';

/**
 * Get content item counts grouped by status.
 * GET /admin/content/status-counts
 */
export async function fetchStatusCounts(): Promise<StatusCounts> {
    return cmsClient.get<StatusCounts>('/admin/content/status-counts');
}

/**
 * Bulk change content item status with filters.
 * POST /admin/content/bulk-status
 */
export async function bulkStatusChange(data: BulkStatusRequest): Promise<BulkStatusResponse> {
    return cmsClient.post<BulkStatusResponse>('/admin/content/bulk-status', data);
}
