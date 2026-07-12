import { cmsClient } from '@/lib/api/client';

type Envelope<T> = { data: T };
const unwrap = async <T>(request: Promise<Envelope<T>>) => (await request).data;
const BASE = '/admin/ops';

export type OpsState = 'running' | 'idle' | 'paused' | 'disabled' | 'unconfigured' | 'stalled' | 'errored' | 'unknown';

export interface OpsFleetStatus {
    member_key: string; member_label: string; family: string; kind: string;
    lane_key: string; lane_label: string; tenant_id?: string; state: OpsState;
    enabled: boolean; pausable: boolean; mode?: string; paused_until?: string | null; last_run_at?: string | null;
    next_due_at?: string | null; liveness: string; cockpit_path: string; error?: string;
}

export interface OpsAttentionItem {
    key: string; fingerprint: string; system: string; tenant_id?: string; kind: string;
    severity: 'critical' | 'major' | 'minor' | 'info' | string; title: string;
    detail: string; count: number; first_seen: string; href: string; state?: string;
    snoozed: boolean;
}

export interface OpsStatus {
    as_of: string; headline: 'all_clear' | 'watching' | 'attention' | 'incident' | string;
    summary: string; fleet: OpsFleetStatus[]; attention_counts: Record<string, number>;
    adapter_errors: string[];
}

export interface OpsCommand {
    id: string; command: string; scope: string; reason: string; ttl_minutes?: number | null;
    source_command_id?: string | null; status: string; counts: Record<string, number>; created_at: string;
}

export const getOpsStatus = () => unwrap(cmsClient.get<Envelope<OpsStatus>>(`${BASE}/status`));
export const getOpsAttention = () => unwrap(cmsClient.get<Envelope<{ as_of: string; items: OpsAttentionItem[]; adapter_errors: string[] }>>(`${BASE}/attention`));
export const getOpsBriefing = () => unwrap(cmsClient.get<Envelope<{ since: string; through: string; commands: OpsCommand[] }>>(`${BASE}/briefing`));
export const listOpsCommands = () => unwrap(cmsClient.get<Envelope<{ items: OpsCommand[] }>>(`${BASE}/commands`));
export const ackOpsAttention = (key: string) => unwrap(cmsClient.post<Envelope<unknown>>(`${BASE}/attention/ack`, { key }));
export const snoozeOpsAttention = (key: string, ttl_minutes: number) => unwrap(cmsClient.post<Envelope<unknown>>(`${BASE}/attention/snooze`, { key, ttl_minutes }));
export const clearOpsAttention = (key: string) => unwrap(cmsClient.post<Envelope<unknown>>(`${BASE}/attention/clear`, { key }));
export const markOpsBriefingSeen = (through: string) => unwrap(cmsClient.post<Envelope<unknown>>(`${BASE}/briefing/seen`, { through }));
export const pauseOpsFleet = (reason: string, ttl_minutes: number, idempotency_key: string) => unwrap(cmsClient.post<Envelope<OpsCommand>>(`${BASE}/commands/pause-all`, { reason, ttl_minutes, idempotency_key }));
export const pauseOpsMember = (member_key: string, lane_key: string, reason: string, ttl_minutes: number, idempotency_key: string) => unwrap(cmsClient.post<Envelope<OpsCommand>>(`${BASE}/commands/pause-member`, { member_key, lane_key, reason, ttl_minutes, idempotency_key }));
export const resumeOpsCommand = (source_command_id: string, idempotency_key: string) => unwrap(cmsClient.post<Envelope<OpsCommand>>(`${BASE}/commands/resume`, { source_command_id, idempotency_key }));
