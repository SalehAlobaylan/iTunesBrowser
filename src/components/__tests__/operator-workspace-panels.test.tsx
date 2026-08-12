import { render, screen } from '@testing-library/react';
import { OperatorGovernancePanel, OperatorInboxPanel, OperatorThreadsPanel } from '@/components/platform/operator/workspace-panels';

test('Arabic governance remains independently visible beside thread and inbox panels', () => {
  render(<aside dir="rtl">
    <OperatorThreadsPanel locale="ar" threads={[]} onSelect={() => undefined} onToggleLocale={() => undefined} onDelete={() => undefined} onCreate={() => undefined} />
    <OperatorInboxPanel locale="ar" inbox={{ unread_count: 0, items: [] }} lifecycleLabel={(state) => state} onOpen={() => undefined} onRefresh={() => undefined} />
    <OperatorGovernancePanel locale="ar" controls={{ controls: { read_enabled: true, llm_enabled: false, execution_enabled: true, schedules_enabled: false }, spend: { interactive: true } }} loading={false} controlLabel={(key) => key} onRefresh={() => undefined} />
  </aside>);
  expect(screen.getByText('المحادثات')).toBeInTheDocument();
  expect(screen.getByText('صندوق المهام')).toBeInTheDocument();
  expect(screen.getByText('الحوكمة')).toBeInTheDocument();
  expect(screen.getAllByText('معطّل')).toHaveLength(2);
});
