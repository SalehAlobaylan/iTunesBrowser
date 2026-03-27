/** Status counts returned by GET /admin/content/status-counts */
export interface StatusCounts {
    PENDING: number;
    PROCESSING: number;
    READY: number;
    FAILED: number;
    ARCHIVED: number;
}

/** Request body for POST /admin/content/bulk-status */
export interface BulkStatusRequest {
    from_status: string;
    to_status: string;
    source_name?: string;
    type?: string;
    limit?: number;
    dry_run?: boolean;
}

/** Response from POST /admin/content/bulk-status */
export interface BulkStatusResponse {
    updated_count: number;
    message: string;
}

/** Request body for POST /admin/retry-pending and POST /admin/retry-failed */
export interface RetryRequest {
    source?: string;
    limit?: number;
}

/** Response from retry-pending / retry-failed endpoints */
export interface RetryResponse {
    success: boolean;
    message: string;
    requeued: number;
    total: number;
    errors: string[];
}
