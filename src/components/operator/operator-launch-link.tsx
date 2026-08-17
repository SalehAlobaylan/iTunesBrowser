'use client';

import { Bot } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { persistOperatorLaunchContext } from '@/lib/operator/launch-context';
import { useOperatorDock } from '@/lib/stores/operator-dock';
import type { OperatorIntent, OperatorVisibleContext } from '@/types/platform/operator';

interface OperatorLaunchLinkProps extends Omit<ButtonProps, 'asChild'> {
  context: OperatorVisibleContext;
  intent?: OperatorIntent;
  children?: React.ReactNode;
}

// Typed contextual entrypoint. It can navigate with a subject/selection hint,
// but no prose or cached data can create a tool or act as CMS evidence.
export function OperatorLaunchLink({ context, intent = 'explain', children = 'Ask Operator', ...buttonProps }: OperatorLaunchLinkProps) {
  const dock = useOperatorDock();
  return (
    <Button variant="outline" {...buttonProps} onClick={(event) => { buttonProps.onClick?.(event); if (event.defaultPrevented) return; persistOperatorLaunchContext(context); dock.openWithContext(context, intent); }}>
      <Bot className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
