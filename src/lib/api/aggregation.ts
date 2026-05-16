import { createClient } from '@/lib/api/client';
import type {
    AggregationHealth,
    AggregationSummary,
    QueueStats,
    TriggerAggregationJobRequest,
    TriggerAggregationJobResponse,
} from '@/types/platform/aggregation';

const aggregationClient = createClient('/api/aggregation');

// Kept for component compatibility. The proxy returns 500 with a clear message
// if AGGREGATION_BASE_URL is unset on the server, so this is informational only.
export function isAggregationConfigured(): boolean {
    return true;
}

export async function fetchAggregationHealth(): Promise<AggregationHealth> {
    return aggregationClient.get<AggregationHealth>('/health');
}

export async function fetchQueueStats(): Promise<QueueStats[]> {
    return aggregationClient.get<QueueStats[]>('/admin/queues');
}

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

export async function triggerAggregationJob(
    data: TriggerAggregationJobRequest
): Promise<TriggerAggregationJobResponse> {
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

export async function purgeQueues(data?: PurgeQueuesRequest): Promise<PurgeQueuesResponse> {
    return aggregationClient.post<PurgeQueuesResponse>('/admin/queues/purge', data || {});
}

export async function retryPending(data?: { source?: string; limit?: number }): Promise<RetryResponse> {
    return aggregationClient.post<RetryResponse>('/admin/retry-pending', data || {});
}

export async function retryFailed(data?: { source?: string; limit?: number }): Promise<RetryResponse> {
    return aggregationClient.post<RetryResponse>('/admin/retry-failed', data || {});
}

export interface RetryResponse {
    success: boolean;
    message: string;
    requeued: number;
    total: number;
    errors: string[];
}
