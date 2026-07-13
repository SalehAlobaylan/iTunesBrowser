import type { ServiceName } from '@/types/platform/system-health';

export type SystemAutopilotMode = 'observe' | 'safe_auto';
export type SystemAutopilotState = 'off' | 'observe' | 'safe_auto' | 'paused';
export type SystemAutopilotRunStatus =
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed';

export interface SystemAutopilotPolicy {
  scope: 'platform';
  enabled: boolean;
  mode: SystemAutopilotMode;
  interval_minutes: number;
  confirm_probes: number;
  resolve_probes: number;
  flap_cycles_24h: number;
  containment_ttl_minutes: number;
  containment_disabled_for?: string[];
  containment_paused_until?: string | null;
  last_run_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SystemIncidentEpisode {
  id: string;
  root_service: ServiceName | 'platform';
  verdict: string;
  status: 'open' | 'recovering' | 'resolved' | 'closed_by_human';
  severity: 'critical' | 'warning' | string;
  shadow?: boolean;
  summary: string;
  root_cause_hint?: string;
  evidence?: unknown;
  timeline?: SystemIncidentTimelineEntry[];
  containment?: SystemContainmentLedger | Record<string, string>;
  first_detected_at: string;
  last_seen_at: string;
  recovering_since?: string | null;
  resolved_at?: string | null;
  closed_by?: string;
  close_reason?: string;
}

export interface SystemContainmentLedgerEntry {
  written_until?: string;
  outcome: 'paused' | 'resumed' | 'skipped' | string;
  reason?: string;
}

export interface SystemContainmentLedger {
  version: 2;
  siblings: Record<string, Record<string, SystemContainmentLedgerEntry>>;
}

export interface SystemIncidentTimelineEntry {
  transition: string;
  at: string;
  service: string;
  verdict: string;
  severity?: string;
  summary?: string;
  overall?: string;
  issues?: Array<{ severity: string; service?: string; message: string }>;
}

export interface SystemAutopilotRun {
  id: string;
  trigger: string;
  mode: SystemAutopilotMode;
  status: SystemAutopilotRunStatus;
  headline:
    | 'all_clear'
    | 'watching'
    | 'incident_open'
    | 'contained'
    | 'recovering'
    | string;
  started_at: string;
  finished_at?: string | null;
  summary?: string;
  probe_results?: unknown;
  created_by?: string;
  error?: string;
  error_class?: string;
}

export interface SystemAutopilotAction {
  id: string;
  target: string;
  action: string;
  verdict?: string;
  status: string;
  guardrail?: string;
  reason?: string;
  output?: unknown;
  started_at: string;
  finished_at?: string | null;
}

export interface RegisteredSystemAutopilot {
  id: string;
  key: string;
  label: string;
  dependencies: string[];
  containment_enabled: boolean;
}

export interface SystemAutopilotStatus {
  policy: SystemAutopilotPolicy;
  state: SystemAutopilotState;
  latest_run?: SystemAutopilotRun | null;
  open_episodes: SystemIncidentEpisode[];
  recent_episodes?: SystemIncidentEpisode[];
  registered_autopilots: RegisteredSystemAutopilot[];
}

export interface SystemAutopilotRunDetail {
  run: SystemAutopilotRun;
  actions: SystemAutopilotAction[];
}

export interface SystemIncidentEpisodeDetail {
  episode: SystemIncidentEpisode;
  actions: SystemAutopilotAction[];
}
