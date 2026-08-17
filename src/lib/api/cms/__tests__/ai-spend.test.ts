import {
    normalizeAISpendRollup,
    normalizeAISpendRun,
    normalizeAISpendStatus,
} from '@/lib/api/cms/ai-spend';

describe('AI spend API normalization', () => {
    it('reads legacy Go field names while the CMS rolls forward', () => {
        expect(normalizeAISpendRollup({
            ID: 7,
            Day: '2026-08-13T00:00:00Z',
            SpendClass: 'llm',
            Operation: 'classify_source',
            Provider: 'deepseek',
            Model: 'deepseek-chat',
            TriggerSource: 'unknown',
            Events: 42,
            CostUSD: 0.12,
            AvoidedCostUSD: 0.03,
            CacheHits: 4,
        })).toMatchObject({
            id: 7,
            spend_class: 'llm',
            operation: 'classify_source',
            events: 42,
            cost_usd: 0.12,
            avoided_cost_usd: 0.03,
            cache_hits: 4,
        });
    });

    it('normalizes status and run envelopes from legacy responses', () => {
        const status = normalizeAISpendStatus({
            policy: { Enabled: false, AggregationIntervalMinutes: 5 },
            Budgets: [{ ID: 2, Scope: 'platform', SpendUSD: 1.25 }],
            Episodes: [],
        });
        expect(status.policy.enabled).toBe(false);
        expect(status.policy.aggregation_interval_minutes).toBe(5);
        expect(status.budgets[0]).toMatchObject({ id: 2, scope: 'platform', spend_usd: 1.25 });

        expect(normalizeAISpendRun({
            ID: 3,
            Trigger: 'manual',
            Status: 'completed',
            Headline: 'ledger_updated',
            EventsFolded: 42,
            StartedAt: '2026-08-13T18:00:00Z',
        })).toMatchObject({ id: 3, trigger: 'manual', status: 'completed', events_folded: 42 });
    });
});
