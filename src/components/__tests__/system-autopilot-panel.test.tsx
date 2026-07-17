import { fireEvent, render, screen } from '@testing-library/react';
import { SystemIncidentCloseDialog } from '../platform/system-health/system-incident-close-dialog';
import { SystemAutopilotPolicySheet } from '../platform/system-health/system-autopilot-policy-sheet';

const mockMutate = jest.fn();

jest.mock('@/hooks/use-system-autopilot', () => ({
  useUpdateSystemAutopilotPolicy: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('System Health incident close dialog', () => {
  const episode = {
    id: 'episode-1',
    root_service: 'aggregation' as const,
    verdict: 'service_down',
    status: 'open' as const,
    severity: 'critical',
    summary: 'Aggregation is unavailable',
    first_detected_at: '2026-07-13T18:00:00Z',
    last_seen_at: '2026-07-13T18:01:00Z',
  };

  it('requires an authored note and submits the trimmed note verbatim', () => {
    const onConfirm = jest.fn();
    render(
      <SystemIncidentCloseDialog
        episode={episode}
        open
        onOpenChange={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    const close = screen.getByRole('button', { name: 'Close incident' });
    expect(close).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Close reason'), {
      target: { value: '  operator verified recovery  ' },
    });
    expect(close).toBeEnabled();
    fireEvent.click(close);

    expect(onConfirm).toHaveBeenCalledWith(
      'episode-1',
      'operator verified recovery'
    );
  });
});

describe('System Health policy sheet', () => {
  const policy = {
    scope: 'platform' as const,
    enabled: true,
    mode: 'safe_auto' as const,
    interval_minutes: 10,
    confirm_probes: 2,
    resolve_probes: 3,
    flap_cycles_24h: 3,
    containment_ttl_minutes: 60,
    containment_disabled_for: ['media_studio'],
  };
  const registered = [
    {
      id: 'pipeline',
      key: 'pipeline',
      label: 'Pipeline Repair',
      dependencies: ['aggregation'],
      containment_enabled: true,
    },
    {
      id: 'studio',
      key: 'media_studio',
      label: 'Media Studio',
      dependencies: ['cms'],
      containment_enabled: false,
    },
  ];

  beforeEach(() => mockMutate.mockClear());

  it('rejects out-of-range input and sends an explicit opt-in list', () => {
    render(
      <SystemAutopilotPolicySheet
        policy={policy}
        registered={registered}
        open
        onOpenChange={jest.fn()}
      />
    );

    const save = screen.getByRole('button', { name: 'Save policy' });
    fireEvent.change(screen.getByLabelText('Cadence (minutes)'), {
      target: { value: '1' },
    });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Cadence (minutes)'), {
      target: { value: '15' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable Media Studio containment' })
    );
    fireEvent.click(save);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        interval_minutes: 15,
        containment_disabled_for: [],
      }),
      expect.any(Object)
    );
  });
});
