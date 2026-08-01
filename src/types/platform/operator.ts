export const OPERATOR_CONTRACT_VERSION = 'wahb-operator/v1' as const;

export type OperatorIntent =
  | 'explain'
  | 'investigate'
  | 'recommend'
  | 'resolve'
  | 'compare';

export interface OperatorSubjectRef {
  type: string;
  id: string;
  label?: string;
}

export interface OperatorSelection {
  mode: 'explicit' | 'filtered';
  ids?: string[];
  count: number;
  truncated?: boolean;
}

export interface OperatorVisibleContext {
  schema_version: typeof OPERATOR_CONTRACT_VERSION;
  domain: string;
  view: string;
  filters: Record<string, string | number | boolean | string[]>;
  subjects: OperatorSubjectRef[];
  selection?: OperatorSelection;
  draft?: { kind: string; safe_normalized_fields: Record<string, unknown> };
  available_intents: OperatorIntent[];
}

export type OperatorEvidenceAvailability =
  | 'available'
  | 'partial'
  | 'stale'
  | 'unavailable'
  | 'conflicting';

export interface OperatorEvidenceRef {
  evidence_id: string;
  authority: 'live' | 'derived' | 'temporal' | 'retrieved' | 'memory';
  domain: string;
  adapter_key: string;
  adapter_version: string;
  tenant_id: string;
  required_permission: string;
  record_refs: OperatorSubjectRef[];
  deep_link: string;
  observed_at: string;
  fetched_at: string;
  max_age_seconds: number;
  expires_at: string;
  content_hash: string;
  source_version: string;
  availability: OperatorEvidenceAvailability;
}

export interface OperatorFact {
  key: string;
  value: unknown;
  evidence_ids: string[];
}

export interface OperatorDecisionPacket {
  schema_version: typeof OPERATOR_CONTRACT_VERSION;
  packet_id: string;
  fingerprint: string;
  tenant_id: string;
  actor_id: string;
  visible_context: OperatorVisibleContext;
  collection_started_at: string;
  collection_ended_at: string;
  completeness: 'complete' | 'partial';
  facts: OperatorFact[];
  evidence: OperatorEvidenceRef[];
  warnings?: string[];
  unknowns?: string[];
  conflicts?: string[];
}

export type OperatorRiskTier = 'read' | 'routine' | 'high_impact';

export interface OperatorToolDescriptor {
  key: string;
  version: string;
  owner_domain: string;
  target_type: string;
  argument_schema: string;
  required_permission: string;
  risk_tier: OperatorRiskTier;
  batchable: boolean;
  target_cap: number;
  executor: string;
  monitor: string;
  verifier: string;
  idempotency: string;
  cancellation: string;
  rollback: string;
  affected_domains: string[];
  localized_action_key: string;
}
