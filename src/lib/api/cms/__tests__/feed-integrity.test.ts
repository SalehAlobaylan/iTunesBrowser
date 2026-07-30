import {
    normalizeFeedIntegrityResults,
    normalizeFeedIntegrityRun,
} from '@/lib/api/cms/feed-integrity';
import type { FeedIntegrityRun } from '@/types/platform/feed-integrity';

describe('Feed Integrity API normalization', () => {
    it('converts historical Go field names to the snake_case console contract', () => {
        const results = normalizeFeedIntegrityResults({
            pods: {
                Feed: 'pods',
                Variant: 'all',
                ConsumerVerdict: 'broken',
                ReadinessVerdict: 'degraded_major',
                ConsumerScore: 0,
                ReadinessScore: 55,
                Violations: 10,
                Checked: 10,
            },
        });

        expect(results?.pods).toEqual({
            feed: 'pods',
            variant: 'all',
            consumer_verdict: 'broken',
            readiness_verdict: 'degraded_major',
            consumer_score: 0,
            readiness_score: 55,
            violations: 10,
            checked: 10,
        });
    });

    it('preserves canonical results and derives missing names from map keys', () => {
        const results = normalizeFeedIntegrityResults({
            'news:month': {
                variant: 'month',
                consumer_verdict: 'healthy',
                readiness_verdict: 'healthy',
                consumer_score: 99,
                readiness_score: 98,
                violations: 0,
                checked: 20,
            },
        });

        expect(results?.['news:month'].feed).toBe('news');
        expect(results?.['news:month'].consumer_score).toBe(99);
    });

    it('drops malformed result entries instead of exposing them to dashboard rendering', () => {
        expect(normalizeFeedIntegrityResults({ pods: null, news: [] })).toBeUndefined();
    });

    it('normalizes historical results inside a run', () => {
        const run = {
            id: 'run-1',
            trigger: 'manual',
            tier: 'deep',
            status: 'completed',
            headline: 'watching',
            started_at: '2026-07-30T18:46:00Z',
            feed_results: { pods: { Feed: 'pods', ConsumerScore: 42 } },
        } as unknown as FeedIntegrityRun;

        expect(normalizeFeedIntegrityRun(run).feed_results?.pods).toMatchObject({
            feed: 'pods',
            consumer_score: 42,
        });
    });
});
