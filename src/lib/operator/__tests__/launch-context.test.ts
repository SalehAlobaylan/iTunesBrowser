import { consumeOperatorLaunchContext, persistOperatorLaunchContext } from '@/lib/operator/launch-context';
import { OPERATOR_CONTRACT_VERSION, type OperatorVisibleContext } from '@/types/platform/operator';

const context: OperatorVisibleContext = {
  schema_version: OPERATOR_CONTRACT_VERSION,
  domain: 'sources', view: 'detail', filters: { status: 'pending' },
  subjects: [{ type: 'content_source', id: 'source-1' }],
  selection: { mode: 'explicit', ids: ['source-1'], count: 1 },
  available_intents: ['explain', 'investigate', 'recommend', 'compare', 'resolve'],
};

describe('Operator launch context handoff', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('persists only typed route hints and consumes them once', () => {
    persistOperatorLaunchContext(context);
    expect(consumeOperatorLaunchContext('sources', 'detail')).toEqual(context);
    expect(consumeOperatorLaunchContext('sources', 'detail')).toBeUndefined();
  });

  it('rejects a context for a different route instead of broadening scope', () => {
    persistOperatorLaunchContext(context);
    expect(consumeOperatorLaunchContext('media_sources', 'list')).toBeUndefined();
  });

  it('fails closed on malformed browser storage', () => {
    window.sessionStorage.setItem('wahb-operator-launch-context/v1', JSON.stringify({ domain: 'sources', selection: { mode: 'filtered', count: 1 } }));
    expect(consumeOperatorLaunchContext()).toBeUndefined();
  });
});
