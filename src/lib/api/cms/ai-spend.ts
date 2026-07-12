import { cmsClient } from '@/lib/api/client';

const BASE = '/admin/ai-spend';

export interface AISpendPolicy { enabled: boolean; aggregationintervalminutes?: number; aggregation_interval_minutes: number; forecast_horizon_days: number; spike_multiplier: number; retention_days: number; last_run_at?: string | null; }
export interface AISpendBudget { id: number; scope: string; cap_usd?: number | null; warn_pct: number; hard_pct: number; spend_usd: number; reserved_usd: number; paused_until?: string | null; }
export interface AISpendRollup { id: number; day: string; spendclass?: string; spend_class: string; operation: string; provider: string; model: string; trigger_source: string; system_run_id?: string; events: number; cost_usd: number; avoided_cost_usd: number; cache_hits: number; }
export interface AISpendRun { id: number; trigger: string; status: string; headline: string; events_folded: number; started_at: string; completed_at?: string; error?: string; }
export interface AISpendEpisode { id: number; kind: string; scope?: string; status: string; first_seen_at: string; last_seen_at: string; }
export interface AISpendStatus { policy: AISpendPolicy; budgets: AISpendBudget[]; episodes: AISpendEpisode[]; }

export const getAISpendStatus = () => cmsClient.get<AISpendStatus>(`${BASE}/status`);
export const getAISpendRollups = () => cmsClient.get<{ rollups: AISpendRollup[] }>(`${BASE}/rollups`);
export const getAISpendRuns = () => cmsClient.get<{ runs: AISpendRun[] }>(`${BASE}/runs`);
export const updateAISpendPolicy = (policy: Partial<AISpendPolicy>) => cmsClient.put<AISpendPolicy>(`${BASE}/policy`, policy);
export const runAISpendGovernor = () => cmsClient.post<AISpendRun>(`${BASE}/run`, {});
