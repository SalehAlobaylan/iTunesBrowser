import {
  migrationProgramSchema,
  migrationStatusSchema,
} from '@/lib/api/database-migrations';

describe('database migration API schemas', () => {
  it('accepts typed physical units and rejects infrastructure fields', () => {
    const payload = {
      id: '11111111-1111-4111-8111-111111111111',
      environment: 'local',
      source_alias: 'neon-source',
      target_alias: 'supabase-target',
      control_alias: 'migration-control',
      state: 'analyzed',
      created_at: '2026-08-20T00:00:00Z',
      updated_at: '2026-08-20T00:00:00Z',
      policy_version: 'db-migration/v1',
      units: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          program_id: '11111111-1111-4111-8111-111111111111',
          unit_key: 'primary',
          source_database_id: '33333333-3333-4333-8333-333333333333',
          target_database_id: '44444444-4444-4444-8444-444444444444',
          source_epoch: 2,
          target_epoch: 3,
          state: 'analyzed',
          evidence_fingerprint: 'a'.repeat(64),
          created_at: '2026-08-20T00:00:00Z',
          updated_at: '2026-08-20T00:00:00Z',
        },
      ],
    };

    expect(migrationProgramSchema.parse(payload).units).toHaveLength(1);
    expect(() => migrationProgramSchema.parse({ ...payload, dsn: 'postgres://secret' })).toThrow();
  });

  it('rejects malformed status payloads', () => {
    expect(() => migrationStatusSchema.parse({ status: 'ready' })).toThrow();
  });
});
