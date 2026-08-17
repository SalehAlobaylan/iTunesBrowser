import { cmsClient } from '@/lib/api/client';

const BASE = '/admin/ai-spend';

export interface AISpendPolicy { enabled: boolean; aggregation_interval_minutes: number; forecast_horizon_days: number; spike_multiplier: number; retention_days: number; last_run_at?: string | null; }
export interface AISpendBudget { id: number; scope: string; cap_usd?: number | null; warn_pct: number; hard_pct: number; spend_usd: number; reserved_usd: number; paused_until?: string | null; }
export interface AISpendRollup { id: number; day: string; spend_class: string; operation: string; provider: string; model: string; trigger_source: string; system_run_id?: string; events: number; cost_usd: number; avoided_cost_usd: number; cache_hits: number; }
export interface AISpendRun { id: number; trigger: string; status: string; headline: string; events_folded: number; started_at: string; completed_at?: string; error?: string; }
export interface AISpendEpisode { id: number; kind: string; scope?: string; status: string; first_seen_at: string; last_seen_at: string; }
export interface AISpendEvidence { event_count: number; rollup_count: number; run_count: number; last_event_at?: string | null; last_rollup_at?: string | null; }
export interface AISpendStatus { policy: AISpendPolicy; budgets: AISpendBudget[]; episodes: AISpendEpisode[]; evidence: AISpendEvidence; }

type LegacyRecord = Record<string, unknown>;

const pick = (row: LegacyRecord, canonical: string, legacy: string) => row[canonical] ?? row[legacy];
const asNumber = (value: unknown) => typeof value === 'number' ? value : Number(value ?? 0);
const asString = (value: unknown) => typeof value === 'string' ? value : '';

export function normalizeAISpendPolicy(row: LegacyRecord | undefined): AISpendPolicy {
    return {
        enabled: Boolean(pick(row ?? {}, 'enabled', 'Enabled')),
        aggregation_interval_minutes: asNumber(pick(row ?? {}, 'aggregation_interval_minutes', 'AggregationIntervalMinutes')),
        forecast_horizon_days: asNumber(pick(row ?? {}, 'forecast_horizon_days', 'ForecastHorizonDays')),
        spike_multiplier: asNumber(pick(row ?? {}, 'spike_multiplier', 'SpikeMultiplier')),
        retention_days: asNumber(pick(row ?? {}, 'retention_days', 'RetentionDays')),
        last_run_at: (pick(row ?? {}, 'last_run_at', 'LastRunAt') as string | null | undefined) ?? null,
    };
}

export function normalizeAISpendBudget(row: LegacyRecord): AISpendBudget {
    return {
        id: asNumber(pick(row, 'id', 'ID')),
        scope: asString(pick(row, 'scope', 'Scope')),
        cap_usd: (pick(row, 'cap_usd', 'CapUSD') as number | null | undefined) ?? null,
        warn_pct: asNumber(pick(row, 'warn_pct', 'WarnPct')),
        hard_pct: asNumber(pick(row, 'hard_pct', 'HardPct')),
        spend_usd: asNumber(pick(row, 'spend_usd', 'SpendUSD')),
        reserved_usd: asNumber(pick(row, 'reserved_usd', 'ReservedUSD')),
        paused_until: (pick(row, 'paused_until', 'PausedUntil') as string | null | undefined) ?? null,
    };
}

export function normalizeAISpendRollup(row: LegacyRecord): AISpendRollup {
    return {
        id: asNumber(pick(row, 'id', 'ID')),
        day: asString(pick(row, 'day', 'Day')),
        spend_class: asString(pick(row, 'spend_class', 'SpendClass')),
        operation: asString(pick(row, 'operation', 'Operation')),
        provider: asString(pick(row, 'provider', 'Provider')),
        model: asString(pick(row, 'model', 'Model')),
        trigger_source: asString(pick(row, 'trigger_source', 'TriggerSource')),
        system_run_id: asString(pick(row, 'system_run_id', 'SystemRunID')),
        events: asNumber(pick(row, 'events', 'Events')),
        cost_usd: asNumber(pick(row, 'cost_usd', 'CostUSD')),
        avoided_cost_usd: asNumber(pick(row, 'avoided_cost_usd', 'AvoidedCostUSD')),
        cache_hits: asNumber(pick(row, 'cache_hits', 'CacheHits')),
    };
}

export function normalizeAISpendRun(row: LegacyRecord): AISpendRun {
    return {
        id: asNumber(pick(row, 'id', 'ID')),
        trigger: asString(pick(row, 'trigger', 'Trigger')),
        status: asString(pick(row, 'status', 'Status')),
        headline: asString(pick(row, 'headline', 'Headline')),
        events_folded: asNumber(pick(row, 'events_folded', 'EventsFolded')),
        started_at: asString(pick(row, 'started_at', 'StartedAt')),
        completed_at: (pick(row, 'completed_at', 'CompletedAt') as string | null | undefined) ?? undefined,
        error: (pick(row, 'error', 'Error') as string | null | undefined) ?? undefined,
    };
}

export function normalizeAISpendStatus(row: LegacyRecord): AISpendStatus {
    const rawEvidence = (row.evidence ?? {}) as LegacyRecord;
    const rawBudgets = (row.budgets ?? row.Budgets) as unknown;
    const rawEpisodes = (row.episodes ?? row.Episodes) as unknown;
    return {
        policy: normalizeAISpendPolicy((row.policy ?? row.Policy) as LegacyRecord | undefined),
        budgets: Array.isArray(rawBudgets) ? rawBudgets.map((item) => normalizeAISpendBudget(item as LegacyRecord)) : [],
        episodes: Array.isArray(rawEpisodes) ? rawEpisodes.map((item) => item as AISpendEpisode) : [],
        evidence: {
            event_count: asNumber(pick(rawEvidence, 'event_count', 'EventCount')),
            rollup_count: asNumber(pick(rawEvidence, 'rollup_count', 'RollupCount')),
            run_count: asNumber(pick(rawEvidence, 'run_count', 'RunCount')),
            last_event_at: (pick(rawEvidence, 'last_event_at', 'LastEventAt') as string | null | undefined) ?? null,
            last_rollup_at: (pick(rawEvidence, 'last_rollup_at', 'LastRollupAt') as string | null | undefined) ?? null,
        },
    };
}

export const getAISpendStatus = () => cmsClient.get<LegacyRecord>(`${BASE}/status`).then(normalizeAISpendStatus);
export const getAISpendRollups = () => cmsClient.get<{ rollups?: LegacyRecord[] }>(`${BASE}/rollups`).then((response) => ({ rollups: (response.rollups ?? []).map(normalizeAISpendRollup) }));
export const getAISpendRuns = () => cmsClient.get<{ runs?: LegacyRecord[] }>(`${BASE}/runs`).then((response) => ({ runs: (response.runs ?? []).map(normalizeAISpendRun) }));
export const updateAISpendPolicy = (policy: Partial<AISpendPolicy>) => cmsClient.put<LegacyRecord>(`${BASE}/policy`, policy).then((response) => normalizeAISpendPolicy(response));
export const runAISpendGovernor = () => cmsClient.post<LegacyRecord>(`${BASE}/run`, {}).then(normalizeAISpendRun);
