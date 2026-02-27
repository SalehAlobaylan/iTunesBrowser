import { createClient } from '@/lib/api/client';
import type {
    AggregationHealth,
    AggregationSummary,
    QueueStats,
    TriggerAggregationJobRequest,
    TriggerAggregationJobResponse,
} from '@/types/platform/aggregation';

const AGGREGATION_BASE_URL = process.env.NEXT_PUBLIC_AGGREGATION_BASE_URL;
const DEV_FALLBACK_AGGREGATION_URL = 'http://localhost:5002';
const RESOLVED_AGGREGATION_BASE_URL =
    AGGREGATION_BASE_URL || (process.env.NODE_ENV === 'development' ? DEV_FALLBACK_AGGREGATION_URL : '');
const aggregationClient = RESOLVED_AGGREGATION_BASE_URL
    ? createClient(RESOLVED_AGGREGATION_BASE_URL, 'cms')
    : null;

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
    return aggregationClient!.get<AggregationHealth>('/health');
}

/**
 * Fetch queue statistics from all queues.
 */
export async function fetchQueueStats(): Promise<QueueStats[]> {
    assertAggregationConfigured();
    return aggregationClient!.get<QueueStats[]>('/admin/queues');
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
    return aggregationClient!.post<TriggerAggregationJobResponse>('/admin/trigger', data);
}
