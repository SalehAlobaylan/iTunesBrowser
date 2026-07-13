import type { AggregationSummary, QueueStats } from '@/types/platform/aggregation';

export type QueueState = 'failing' | 'backlogged' | 'processing' | 'idle';
export type QueueTone = 'destructive' | 'warning' | 'info' | 'secondary';

// UI thresholds — code defaults (Config Discipline: presentation knobs, not env).
export const WAITING_WARN = 50;

interface QueueMeta {
    label: string;
    description: string;
}

/** Friendly names for the known BullMQ queues; unknown queues fall back to a title-cased key. */
const QUEUE_META: Record<string, QueueMeta> = {
    'fetch-queue': { label: 'Fetch', description: 'Source polling & downloads' },
    'normalize-queue': { label: 'Normalize', description: 'Dedup & normalization' },
    'media-queue': { label: 'Media', description: 'FFmpeg renditions & cuts' },
    'ai-queue': { label: 'AI', description: 'Embeddings & enrichment' },
    'dlq': { label: 'Dead letter', description: 'Exhausted jobs' },
};

export function queueLabel(queue: string): string {
    const meta = QUEUE_META[queue.toLowerCase()];
    if (meta) return meta.label;
    return queue
        .replace(/[-_]?queue$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || queue;
}

export function queueDescription(queue: string): string {
    return QUEUE_META[queue.toLowerCase()]?.description ?? '';
}

/** Health state of a single queue, worst-first: failing → backlogged → processing → idle. */
export function classifyQueue(queue: QueueStats): QueueState {
    if (queue.failed > 0) return 'failing';
    if (queue.waiting >= WAITING_WARN) return 'backlogged';
    if (queue.active > 0) return 'processing';
    return 'idle';
}

export function queueTone(state: QueueState): QueueTone {
    switch (state) {
        case 'failing':
            return 'destructive';
        case 'backlogged':
            return 'warning';
        case 'processing':
            return 'info';
        default:
            return 'secondary';
    }
}

export const QUEUE_STATE_LABEL: Record<QueueState, string> = {
    failing: 'Failing',
    backlogged: 'Backlogged',
    processing: 'Processing',
    idle: 'Idle',
};

export interface LoadSegment {
    key: 'active' | 'waiting' | 'delayed' | 'failed';
    label: string;
    value: number;
    /** Tailwind bg class for the bar segment. */
    className: string;
}

/** In-flight load composition for a queue's bar (completed is cumulative throughput, excluded). */
export function queueLoad(queue: QueueStats): { segments: LoadSegment[]; total: number } {
    const segments: LoadSegment[] = [
        { key: 'active', label: 'Active', value: queue.active, className: 'bg-info' },
        { key: 'waiting', label: 'Waiting', value: queue.waiting, className: 'bg-warning' },
        { key: 'delayed', label: 'Delayed', value: queue.delayed, className: 'bg-violet-500' },
        { key: 'failed', label: 'Failed', value: queue.failed, className: 'bg-destructive' },
    ];
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return { segments, total };
}

export interface QueueRollup {
    total: number;
    failing: number;
    backlogged: number;
    processing: number;
    idle: number;
    /** Queues needing eyes (failing or backlogged), worst-first. */
    attention: number;
}

/** Fleet-level rollup of queue states for the header summary line. */
export function queueRollup(summary: AggregationSummary | undefined): QueueRollup {
    const queues = summary?.queues ?? [];
    const rollup: QueueRollup = { total: queues.length, failing: 0, backlogged: 0, processing: 0, idle: 0, attention: 0 };
    for (const queue of queues) {
        rollup[classifyQueue(queue)] += 1;
    }
    rollup.attention = rollup.failing + rollup.backlogged;
    return rollup;
}

export type HealthTone = 'success' | 'warning' | 'destructive' | 'secondary';

export function healthTone(status: string | undefined): HealthTone {
    if (status === 'healthy') return 'success';
    if (status === 'degraded') return 'warning';
    if (status === 'unhealthy') return 'destructive';
    return 'secondary';
}

/** Compact relative time for the "last update" line. Future/near-now clamps to "just now". */
export function relativeSince(iso: string | undefined, now = Date.now()): string {
    if (!iso) return 'unknown';
    const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}
