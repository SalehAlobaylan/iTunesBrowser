import { createClient } from '@/lib/api/client';
import type {
    AggregationHealth,
    AggregationSummary,
    QueueStats,
    TriggerAggregationJobRequest,
    TriggerAggregationJobResponse,
} from '@/types/platform/aggregation';

// Aggregation Service base URL must be provided via NEXT_PUBLIC_AGGREGATION_BASE_URL.
// In development only, fall back to the conventional local port so developers can
// run the stack with ./start.sh without setting env vars. Production builds must
// set the env explicitly — assertAggregationConfigured() guards each call.
const AGGREGATION_BASE_URL = process.env.NEXT_PUBLIC_AGGREGATION_BASE_URL;
const DEV_FALLBACK_AGGREGATION_URL =
    process.env.NODE_ENV === 'development' ? 'http://localhost:5002' : '';
const RESOLVED_AGGREGATION_BASE_URL =
    AGGREGATION_BASE_URL || DEV_FALLBACK_AGGREGATION_URL;

const aggregationClient = createClient(RESOLVED_AGGREGATION_BASE_URL, 'iam');

export function isAggregationConfigured(): boolean {
    return Boolean(RESOLVED_AGGREGATION_BASE_URL);
}

function assertAggregationConfigured(): void {
    if (!RESOLVED_AGGREGATION_BASE_URL) {
        throw new Error('Aggregation service is not configured.');
    }
}

/**
 * Fetch aggregation service health status.
 */
export async function fetchAggregationHealth(): Promise<AggregationHealth> {
    assertAggregationConfigured();
    return aggregationClient.get<AggregationHealth>('/health');
}

/**
 * Fetch queue statistics from all queues.
 */
export async function fetchQueueStats(): Promise<QueueStats[]> {
    assertAggregationConfigured();
    return aggregationClient.get<QueueStats[]>('/admin/queues');
}

/**
 * Get a computed summary for dashboard display.
 */
export async function fetchAggregationSummary(): Promise<AggregationSummary> {
    const [health, queues] = await Promise.all([
        fetchAggregationHealth(),
        fetchQueueStats(),
    ]);

    const totalProcessed = queues.reduce((sum, queue) => sum + queue.completed, 0);
    const totalFailed = queues.reduce((sum, queue) => sum + queue.failed, 0);
    const activeWorkers = queues.reduce((sum, queue) => sum + queue.active, 0);
    const waitingJobs = queues.reduce((sum, queue) => sum + queue.waiting, 0);

    return {
        health,
        queues,
        totalProcessed,
        totalFailed,
        activeWorkers,
        waitingJobs,
    };
}

/**
 * Trigger a manual aggregation job (admin-only endpoint).
 */
export async function triggerAggregationJob(
    data: TriggerAggregationJobRequest
): Promise<TriggerAggregationJobResponse> {
    assertAggregationConfigured();
    return aggregationClient.post<TriggerAggregationJobResponse>('/admin/trigger', data);
}

export interface PurgeQueuesRequest {
    queue?: string;
    states?: string[];
    includeFailed?: boolean;
}

export interface PurgeQueuesResponse {
    success: boolean;
    message: string;
    purged: Record<string, number>;
}

/**
 * Purge jobs from aggregation queues.
 */
export async function purgeQueues(data?: PurgeQueuesRequest): Promise<PurgeQueuesResponse> {
    assertAggregationConfigured();
    return aggregationClient.post<PurgeQueuesResponse>('/admin/queues/purge', data || {});
}

/**
 * Enqueue media jobs for PENDING content items.
 * POST /admin/retry-pending
 */
export async function retryPending(data?: { source?: string; limit?: number }): Promise<RetryResponse> {
    assertAggregationConfigured();
    return aggregationClient.post<RetryResponse>('/admin/retry-pending', data || {});
}

/**
 * Re-queue FAILED content items back into the media pipeline.
 * POST /admin/retry-failed
 */
export async function retryFailed(data?: { source?: string; limit?: number }): Promise<RetryResponse> {
    assertAggregationConfigured();
    return aggregationClient.post<RetryResponse>('/admin/retry-failed', data || {});
}

export interface RetryResponse {
    success: boolean;
    message: string;
    requeued: number;
    total: number;
    errors: string[];
}
