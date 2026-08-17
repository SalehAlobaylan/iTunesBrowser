import { render, screen } from '@testing-library/react';

import {
  OperatorCapabilityNotices,
  OperatorStatusBand,
} from '@/components/platform/operator/operator-workspace-components';
import {
  actionLabel,
  lifecycleLabel,
} from '@/components/platform/operator/operator-copy';

test('Arabic status and independent governance notices preserve dashboard parity', () => {
  render(
    <div dir="rtl">
      <OperatorStatusBand
        locale="ar"
        active={2}
        approvals={1}
        failures={3}
        enabledControls={2}
      />
      <OperatorCapabilityNotices
        locale="ar"
        controls={{
          read_enabled: true,
          llm_enabled: false,
          execution_enabled: true,
          schedules_enabled: false,
        }}
      />
    </div>
  );
  expect(screen.getByText('المهام النشطة')).toBeInTheDocument();
  expect(screen.getByText('تحتاج موافقة')).toBeInTheDocument();
  expect(
    screen.getByText('تم تعطيل تفسير النموذج. تظل الأدلة الحتمية متاحة.')
  ).toBeInTheDocument();
  expect(screen.getByText('تم تعطيل الجداول.')).toBeInTheDocument();
});

test('registered action and lifecycle labels never expose raw keys', () => {
  expect(actionLabel('operator.action.run_media_source', 'en')).toBe(
    'Run media source once'
  );
  for (const key of [
    'operator.action.media_circulation_supply_source_run_retry',
    'operator.action.embeddings_pause_campaigns_24h',
    'operator.action.operator_schedule_create_hourly',
    'operator.action.media_sources_resume',
  ]) {
    expect(actionLabel(key, 'en')).toBeTruthy();
    expect(actionLabel(key, 'ar')).toBeTruthy();
    expect(actionLabel(key, 'en')).not.toContain('operator.action');
  }
  expect(actionLabel('unregistered.tool', 'en')).toBeUndefined();
  expect(lifecycleLabel('awaiting_approval', 'ar')).toBe('يحتاج موافقة');
  expect(lifecycleLabel('future_state', 'en')).toBe('Unknown state');
});
