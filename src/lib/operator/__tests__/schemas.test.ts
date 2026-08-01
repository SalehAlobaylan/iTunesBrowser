import { operatorDecisionPacketSchema, operatorEligibleActionsSchema, operatorEventResponseSchema, operatorPlanEventResponseSchema, operatorPlanSchema, operatorThreadListSchema, operatorToolDescriptorSchema, operatorVisibleContextSchema } from '@/lib/operator/schemas';
import { OPERATOR_CONTRACT_VERSION } from '@/types/platform/operator';

const visibleContext = {
  schema_version: OPERATOR_CONTRACT_VERSION,
  domain: 'media_sources',
  view: 'list',
  filters: { status: 'pending' },
  subjects: [{ type: 'content_source', id: 'source-1' }],
  available_intents: ['explain', 'investigate'],
};

describe('Wahb Operator schemas', () => {
  it('rejects incomplete explicit mutation selections and unknown fields', () => {
    expect(() => operatorVisibleContextSchema.parse({ ...visibleContext, selection: { mode: 'explicit', ids: ['one'], count: 2 } })).toThrow();
    expect(() => operatorVisibleContextSchema.parse({ ...visibleContext, untrusted: 'field' })).toThrow();
  });

  it('rejects cross-tenant and uncited decision packet facts', () => {
    const now = '2026-07-30T12:00:00.000Z';
    const packet = {
      schema_version: OPERATOR_CONTRACT_VERSION,
      packet_id: 'packet-1', fingerprint: 'hash', tenant_id: 'tenant-a', actor_id: 'actor-a', visible_context: visibleContext,
      collection_started_at: now, collection_ended_at: now, completeness: 'complete',
      evidence: [{ evidence_id: 'evidence-1', authority: 'live', domain: 'media_sources', adapter_key: 'media_sources', adapter_version: 'v1', tenant_id: 'tenant-b', required_permission: 'source:read', record_refs: [], deep_link: '/platform/media/sources', observed_at: now, fetched_at: now, max_age_seconds: 60, expires_at: '2026-07-30T12:01:00.000Z', content_hash: 'hash', source_version: '1', availability: 'available' }],
      facts: [{ key: 'pending_count', value: 1, evidence_ids: ['missing'] }],
    };
    expect(() => operatorDecisionPacketSchema.parse(packet)).toThrow();
  });

  it('rejects deletion and queue capability descriptors', () => {
    expect(() => operatorToolDescriptorSchema.parse({ key: 'storage.purge', version: 'v1', owner_domain: 'storage', target_type: 'artifact', argument_schema: 'v1', required_permission: 'aggregation:manage', risk_tier: 'high_impact', batchable: false, target_cap: 1, executor: 'purge_queue', monitor: 'monitor', verifier: 'verify', idempotency: 'idempotency', cancellation: 'none', rollback: 'none', affected_domains: ['storage'], localized_action_key: 'purge' })).toThrow();
  });

  it('rejects external links and malformed lifecycle payloads from the BFF', () => {
    const canonicalPlan = {
      schema_version: OPERATOR_CONTRACT_VERSION,
      plan_id: 'plan-1', tenant_id: 'tenant-a', actor_id: 'actor-a',
      tool_key: 'sources.run_once', tool_version: 'v1', target_ids: ['source'],
      normalized_arguments: {}, evidence_ids: ['evidence-1'], evidence_fingerprint: 'packet',
      access_version: 'access-v1', risk_tier: 'routine', cancellation: 'before_start_only',
      rollback: 'not_required_idempotent_refresh', contingencies: ['failed:record'],
    };
    const basePlan = { id: 'b572281f-601a-4a79-9ed4-e2d1bc8fd68d', state: 'succeeded', tool_key: 'sources.run_once', risk_tier: 'routine', expires_at: '2026-07-30T12:01:00.000Z', digest: 'a'.repeat(64), canonical_plan: canonicalPlan };
    expect(() => operatorPlanSchema.parse({ ...basePlan, verified_effects: { deep_links: ['https://unsafe.example'] } })).toThrow();
    expect(() => operatorPlanSchema.parse({ ...basePlan, verified_effects: { deep_links: ['//unsafe.example'] } })).toThrow();
    expect(operatorPlanSchema.parse({ ...basePlan, affected_domains: ['sources'] }).canonical_plan.tool_key).toBe('sources.run_once');
  });

  it('accepts only CMS-owned eligible action descriptors', () => {
    const action = {
      packet_fingerprint: 'packet', execution_enabled: true,
      items: [{ key: 'sources.run_once', localized_action_key: 'operator.action.sources.run_once', risk_tier: 'routine', target_type: 'source', argument_schema: 'sources.run_once/v1', target_ids: ['source-1'], affected_domains: ['sources', 'pipeline'], manual_only: false }],
    };
    expect(operatorEligibleActionsSchema.parse(action).items).toHaveLength(1);
    expect(() => operatorEligibleActionsSchema.parse({ ...action, items: [{ ...action.items[0], manual_only: true }] })).toThrow();
  });

  it('accepts the CMS-owned durable event envelope', () => {
    expect(operatorEventResponseSchema.parse({
      investigation_id: '17a03ef7-a95c-416e-832a-80e598edfbf6', state: 'backgrounded', events: [{ sequence: 1, event_type: 'accepted', tenant_id: 'default', created_at: '2026-08-01T11:42:18.189998Z' }], next_sequence: 1,
    }).investigation_id).toBe('17a03ef7-a95c-416e-832a-80e598edfbf6');
    expect(operatorPlanEventResponseSchema.parse({
      id: '17a03ef7-a95c-416e-832a-80e598edfbf6', state: 'queued', events: [], next_sequence: 0,
    }).id).toBe('17a03ef7-a95c-416e-832a-80e598edfbf6');
  });

  it('accepts only a CMS-owned English or Arabic thread locale', () => {
    const timestamp = '2026-07-30T12:00:00.000Z';
    expect(operatorThreadListSchema.parse({ items: [{ id: 'b572281f-601a-4a79-9ed4-e2d1bc8fd68d', title: 'Media review', locale: 'ar', created_at: timestamp, last_activity_at: timestamp, expires_at: timestamp }] }).items[0].locale).toBe('ar');
    expect(operatorThreadListSchema.parse({ items: [{ id: '701152a5-1659-4c16-ab77-712485ea4e09', title: 'Media circulation', locale: 'en', created_at: '2026-08-01T14:08:56.459225+03:00', last_activity_at: '2026-08-01T11:08:56.294596Z', expires_at: '2026-08-31T11:08:56.294596Z' }] }).items).toHaveLength(1);
    expect(() => operatorThreadListSchema.parse({ items: [{ id: 'b572281f-601a-4a79-9ed4-e2d1bc8fd68d', title: 'Media review', locale: 'fr', created_at: timestamp, last_activity_at: timestamp, expires_at: timestamp }] })).toThrow();
  });
});
