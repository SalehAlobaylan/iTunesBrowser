import { mediaSupplySchemas } from '@/lib/api/cms/media-circulation';
import type { MediaSupplyStatusResponse } from '@/types/platform/media-circulation';

const at = '2026-08-09T12:00:00Z';
const sourceID = '11111111-1111-4111-8111-111111111111';
const requestID = '22222222-2222-4222-8222-222222222222';

function statusFixture() {
  return {
    exposure: { schema_version: 'pods-exposure/v2', generated_at: at, verdict: 'return_path_observed', evidence_completeness: 'complete', base_eligible_count: 8, reachable_count: 8, returned_count: 8, distinct_returned_count: 8, eligible_returned_gap: 0, repeat_pressure: 0, probe_id: '00000000-0000-4000-8000-000000000001', returned_ids: [], rendered_ids: [], viewed_ids: [], unknowns: [] },
    supply_evaluation: {
      schema_version: 'media-supply/v1',
      evaluated_at: at,
      verdict: 'source_due_not_admitted',
      headline_boundary: 'cms_admission',
      owner: 'CMS source-run scheduler',
      evidence_completeness: 'complete',
      read_only: true,
      summary: 'The source is due without an active CMS source run.',
      counts: {
        due_unadmitted: 1,
        in_flight: 0,
        scheduled: 0,
        paused: 0,
        schedule_unknown: 0,
        delivery_verified: 0,
        delivery_pending: 0,
        delivery_degraded: 0,
        delivery_unknown: 0,
		no_upstream_change: 0,
		upstream_deferred: 0,
		intake_blocked: 0,
      },
      affected_source_ids: [sourceID],
      affected_request_ids: [requestID],
      unknowns: [],
    },
    schedules: {
      generated_at: at,
      available: true,
      due_unadmitted: 1,
      in_flight: 0,
      scheduled: 0,
      paused: 0,
      unknown: 0,
      items: [],
    },
    delivery: {
      generated_at: at,
      verified: 0,
      pending: 0,
      degraded: 0,
      not_observed: 0,
      items: [],
    },
    evaluator: {
      recording_enabled: true,
      worker_state: 'ready',
      worker_last_heartbeat_at: at,
      worker_stale_after_at: '2026-08-09T12:15:00Z',
      last_outcome: 'evaluated',
      last_trigger: 'scheduled',
      last_observed_at: at,
      last_evaluated_at: at,
      evaluation_digest: 'c'.repeat(64),
      unknowns: [],
    },
    operational: {
      state: 'ready',
      workers: { source_run_scheduler: 'ready', receipt_projection: 'ready' },
	  owners: {
		aggregation: { state: 'ready', observed_at: at, stale_after_at: '2026-08-09T12:15:00Z' },
		media: { state: 'ready', observed_at: at, stale_after_at: '2026-08-09T12:15:00Z' },
		enrichment: { state: 'ready', observed_at: at, stale_after_at: '2026-08-09T12:15:00Z' },
	  },
      backlogs: { projection_pending: 0, retained_receipts: 0, episodes_open: 0 },
	  metrics: { schema_version: 'media-supply-operational-metrics/v1', generated_at: at, samples: [], truncated: false, unknowns: [] },
      unknowns: [],
      generated_at: at,
    },
  };
}

describe('Media Supply CMS payload schemas', () => {
  it('accepts the bounded CMS status contract', () => {
    expect(mediaSupplySchemas.status.safeParse(statusFixture()).success).toBe(
      true
    );
  });

  it('accepts the complete bounded operational metric vocabulary emitted by CMS', () => {
    const payload = statusFixture() as unknown as MediaSupplyStatusResponse;
    payload.operational.metrics.samples = [
      { name: 'pipeline_repairs_open', owner: 'aggregation', action: 'pipeline_repair', stage: 'pipeline', verdict: 'open', value: 2, unit: 'count' },
      { name: 'feed_return_freshness', owner: 'cms', action: 'consumer_boundary', stage: 'return', verdict: 'present', value: 4, unit: 'seconds' },
      { name: 'action_controls_disabled', owner: 'cms', action: 'supply_action', stage: 'control', verdict: 'blocked', value: 1, unit: 'count' },
      { name: 'source_provider_failures', owner: 'aggregation', action: 'source_run', stage: 'provider', verdict: 'failed', value: 1, unit: 'count' },
    ];
    expect(mediaSupplySchemas.status.safeParse(payload).success).toBe(true);
  });

  it('rejects a browser-shaped affected target before it can render', () => {
    const payload = statusFixture();
    payload.supply_evaluation.affected_source_ids = ['not-a-cms-uuid'];
    expect(mediaSupplySchemas.status.safeParse(payload).success).toBe(false);
  });

  it('rejects an unregistered evaluator outcome before it can render', () => {
    const payload = statusFixture();
    payload.evaluator.last_outcome = 'retry_provider';
    expect(mediaSupplySchemas.status.safeParse(payload).success).toBe(false);
  });

  it('rejects an unregistered evaluator worker state before it can render', () => {
    const payload = statusFixture();
    payload.evaluator.worker_state = 'running_forever';
    expect(mediaSupplySchemas.status.safeParse(payload).success).toBe(false);
  });

	 it('rejects an untrusted owner-readiness state before it can render', () => {
		 const payload = statusFixture();
		 payload.operational.owners.media.state = 'unknown_owner_state';
		 expect(mediaSupplySchemas.status.safeParse(payload).success).toBe(false);
	 });

  it('rejects unbounded episode subjects and malformed evidence digests', () => {
    const episode = {
      id: '33333333-3333-4333-8333-333333333333',
      tenant_id: 'tenant-a',
      fingerprint: 'a'.repeat(64),
      first_failed_boundary: 'cms_admission',
      verdict: 'source_due_not_admitted',
      severity: 'major',
      owner: 'CMS source-run scheduler',
      state: 'open',
      summary: 'Due source.',
      affected_subjects: [{ type: 'content_source', id: sourceID }],
      evidence_digest: 'b'.repeat(64),
      evidence_completeness: 'complete',
      evidence: {},
      first_seen_at: at,
      last_seen_at: at,
      created_at: at,
      updated_at: at,
    };
    expect(
      mediaSupplySchemas.episodeList.safeParse({
        schema_version: 'media-supply/v1',
        items: [episode],
        next_cursor: '',
      }).success
    ).toBe(true);
    episode.evidence_digest = 'unsafe';
    expect(
      mediaSupplySchemas.episodeList.safeParse({
        schema_version: 'media-supply/v1',
        items: [episode],
        next_cursor: '',
      }).success
    ).toBe(false);
  });

  it('rejects non-canonical action proof links before the cockpit can render them', () => {
    const preview = {
      id: '33333333-3333-4333-8333-333333333333',
      action_key: 'source_run.cancel_unstarted',
      target_type: 'source_run_execution_unit',
      target_id: sourceID,
      evidence_digest: 'a'.repeat(64),
      policy_digest: 'b'.repeat(64),
      state: 'active',
      expires_at: at,
      planned_effects: {},
      affected_subjects: [],
      deep_links: ['/platform/media/circulation'],
    };
    expect(mediaSupplySchemas.actionPreview.safeParse(preview).success).toBe(true);
    preview.deep_links = ['//outside.example'];
    expect(mediaSupplySchemas.actionPreview.safeParse(preview).success).toBe(false);
  });
});
