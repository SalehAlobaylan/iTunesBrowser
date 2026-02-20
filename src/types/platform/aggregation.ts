export type AggregationHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface AggregationHealth {
    status: AggregationHealthStatus;
    timestamp: string;
    uptime?: number;
}

export interface QueueStats {
    queue: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

export interface AggregationSummary {
    health: AggregationHealth;
    queues: QueueStats[];
    totalProcessed: number;
    totalFailed: number;
    activeWorkers: number;
    waitingJobs: number;
}

export type AggregationTriggerSourceType =
    | 'RSS'
    | 'YOUTUBE'
    | 'PODCAST'
    | 'PODCAST_DISCOVERY'
    | 'TWITTER'
    | 'REDDIT'
    | 'UPLOAD'
    | 'MANUAL';

export interface TriggerAggregationJobRequest {
    sourceType: AggregationTriggerSourceType;
    url: string;
    name?: string;
    settings?: Record<string, unknown>;
}

export interface TriggerAggregationJobResponse {
    success: boolean;
    jobId?: string;
    message: string;
}
