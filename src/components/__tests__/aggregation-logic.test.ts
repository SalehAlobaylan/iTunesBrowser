import {
    classifyQueue,
    healthTone,
    queueLabel,
    queueLoad,
    queueRollup,
    queueTone,
    relativeSince,
    WAITING_WARN,
} from '@/components/platform/aggregation/aggregation-logic';
import type { AggregationSummary, QueueStats } from '@/types/platform/aggregation';

const q = (overrides: Partial<QueueStats>): QueueStats => ({
    queue: 'fetch-queue',
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    ...overrides,
});

describe('queueLabel', () => {
    it('maps known queues to friendly names', () => {
        expect(queueLabel('fetch-queue')).toBe('Fetch');
        expect(queueLabel('ai-queue')).toBe('AI');
        expect(queueLabel('dlq')).toBe('Dead letter');
    });

    it('title-cases unknown queues and strips the -queue suffix', () => {
        expect(queueLabel('thumbnail-queue')).toBe('Thumbnail');
        expect(queueLabel('some_custom_queue')).toBe('Some Custom');
    });
});

describe('classifyQueue', () => {
    it('failing when any job failed, regardless of other counts', () => {
        expect(classifyQueue(q({ failed: 1, active: 5 }))).toBe('failing');
    });

    it('backlogged when waiting crosses the threshold', () => {
        expect(classifyQueue(q({ waiting: WAITING_WARN }))).toBe('backlogged');
        expect(classifyQueue(q({ waiting: WAITING_WARN - 1 }))).not.toBe('backlogged');
    });

    it('processing when active with a small backlog', () => {
        expect(classifyQueue(q({ active: 3, waiting: 2 }))).toBe('processing');
    });

    it('idle when nothing is moving', () => {
        expect(classifyQueue(q({ completed: 100 }))).toBe('idle');
    });
});

describe('queueTone', () => {
    it('maps states to badge tones', () => {
        expect(queueTone('failing')).toBe('destructive');
        expect(queueTone('backlogged')).toBe('warning');
        expect(queueTone('processing')).toBe('info');
        expect(queueTone('idle')).toBe('secondary');
    });
});

describe('queueLoad', () => {
    it('sums in-flight segments and excludes completed', () => {
        const { segments, total } = queueLoad(q({ active: 2, waiting: 3, delayed: 1, failed: 4, completed: 999 }));
        expect(total).toBe(10);
        expect(segments.find((s) => s.key === 'failed')?.value).toBe(4);
        expect(segments.map((s) => s.key)).toEqual(['active', 'waiting', 'delayed', 'failed']);
    });

    it('total is zero for an idle queue', () => {
        expect(queueLoad(q({ completed: 50 })).total).toBe(0);
    });
});

describe('queueRollup', () => {
    it('counts states and flags attention (failing + backlogged)', () => {
        const summary = {
            queues: [q({ failed: 1 }), q({ waiting: WAITING_WARN }), q({ active: 1 }), q({})],
        } as unknown as AggregationSummary;
        const rollup = queueRollup(summary);
        expect(rollup).toMatchObject({ total: 4, failing: 1, backlogged: 1, processing: 1, idle: 1, attention: 2 });
    });

    it('handles undefined summary', () => {
        expect(queueRollup(undefined).total).toBe(0);
    });
});

describe('healthTone', () => {
    it('maps health statuses', () => {
        expect(healthTone('healthy')).toBe('success');
        expect(healthTone('degraded')).toBe('warning');
        expect(healthTone('unhealthy')).toBe('destructive');
        expect(healthTone(undefined)).toBe('secondary');
    });
});

describe('relativeSince', () => {
    const now = new Date('2026-07-13T12:00:00Z').getTime();
    it('formats recent intervals', () => {
        expect(relativeSince('2026-07-13T12:00:00Z', now)).toBe('just now');
        expect(relativeSince('2026-07-13T11:59:30Z', now)).toBe('30s ago');
        expect(relativeSince('2026-07-13T11:45:00Z', now)).toBe('15m ago');
        expect(relativeSince('2026-07-13T09:00:00Z', now)).toBe('3h ago');
    });
    it('handles missing input', () => {
        expect(relativeSince(undefined, now)).toBe('unknown');
    });
});
