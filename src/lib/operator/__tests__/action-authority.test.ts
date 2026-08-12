import { eligibleActionTargetIDs } from '@/lib/operator/action-authority';

describe('Operator action target authority', () => {
  it('uses only the exact target returned by CMS', () => {
    expect(eligibleActionTargetIDs({ target_ids: ['11111111-1111-4111-8111-111111111111'], manual_only: false })).toEqual(['11111111-1111-4111-8111-111111111111']);
  });

  it('does not admit ambiguous or manual-only descriptors', () => {
    const base = { manual_only: false };
    expect(eligibleActionTargetIDs({ ...base, target_ids: [] })).toEqual([]);
    expect(eligibleActionTargetIDs({ ...base, target_ids: ['a', 'b'] })).toEqual([]);
    expect(eligibleActionTargetIDs({ ...base, target_ids: ['a'], manual_only: true })).toEqual([]);
  });
});
