'use client';

import { useQuery } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cmsClient } from '@/lib/api/client';
import { operatorInboxSchema } from '@/lib/operator/schemas';
import { useOperatorDock } from '@/lib/stores/operator-dock';
import { useOperatorStatus } from '@/hooks/use-operator';
import { useOperatorPageContext } from './operator-context-provider';

export function OperatorStatusControl() {
  const { context } = useOperatorPageContext();
  const pathname = usePathname();
  const dock = useOperatorDock();
  const status = useOperatorStatus();
  const inbox = useQuery({
    queryKey: ['operator', 'inbox-summary'],
    queryFn: async () =>
      operatorInboxSchema.parse(
        await cmsClient.get<unknown>('/admin/operator/inbox', { limit: 1 })
      ),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const unread = inbox.data?.unread_count ?? 0;
  const available = status.data?.controls.read_enabled === true;
  const activate = () => {
    if (pathname === '/platform/operator') {
      document.getElementById('operator-composer-input')?.focus();
    } else if (context) {
      dock.openWithContext(context);
    } else {
      dock.toggle();
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="relative h-8 gap-1.5 px-2.5"
      onClick={activate}
      aria-label={
        unread
          ? `Open Wahb Operator, ${unread} unread investigations`
          : 'Open Wahb Operator'
      }
    >
      <span className="relative">
        <Bot className="size-3.5 text-primary" />
        <span
          className={`absolute -end-1 -top-1 size-1.5 rounded-full ring-2 ring-background ${available ? 'bg-success' : 'bg-warning'}`}
        />
      </span>
      <span className="hidden sm:inline">Operator</span>
      {unread ? (
        <span className="rounded-full bg-info px-1.5 py-0.5 text-[10px] font-semibold leading-none text-info-foreground">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Button>
  );
}
