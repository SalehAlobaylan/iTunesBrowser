'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { createOperatorLaunchHref } from '@/lib/operator/route-manifest';
import { persistOperatorLaunchContext } from '@/lib/operator/launch-context';
import type { OperatorIntent, OperatorVisibleContext } from '@/types/platform/operator';

interface OperatorLaunchLinkProps extends Omit<ButtonProps, 'asChild'> {
  context: OperatorVisibleContext;
  intent?: OperatorIntent;
  children?: React.ReactNode;
}

// Typed contextual entrypoint. It can navigate with a subject/selection hint,
// but no prose or cached data can create a tool or act as CMS evidence.
export function OperatorLaunchLink({ context, intent = 'explain', children = 'Ask Operator', ...buttonProps }: OperatorLaunchLinkProps) {
  return (
    <Button asChild variant="outline" {...buttonProps}>
      <Link href={createOperatorLaunchHref(context, intent)} onClick={() => persistOperatorLaunchContext(context)}>
        <Bot className="mr-2 h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}
