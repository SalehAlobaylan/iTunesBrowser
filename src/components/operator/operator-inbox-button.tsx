'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cmsClient } from '@/lib/api/client';

type InboxSummary = { unread_count?: number };

// The inbox is a discoverable workspace entrypoint. A missing or disabled CMS
// capability must not remove it; the workspace explains the current state.
export function OperatorInboxButton() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
		if (document.visibilityState === 'hidden') return;
		try {
			// Use the shared client so an expired access cookie receives the same
			// single-flight refresh-and-retry behavior as the workspace itself.
			const payload = await cmsClient.get<InboxSummary>('/admin/operator/inbox', { limit: 1 });
        if (active) setUnread(typeof payload.unread_count === 'number' ? payload.unread_count : 0);
      } catch {
        if (active) setUnread(0);
      }
    };
    void load();
    // This is only a discoverability badge, not a task monitor. Keep it
    // bounded so every dashboard tab does not create a frequent CMS query;
    // the Operator workspace owns the durable event/poll lifecycle.
    const interval = window.setInterval(() => { void load(); }, 60_000);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisibilityChange); };
  }, []);

  return (
    <Button asChild variant="outline" size="sm" className="relative hidden h-8 gap-1.5 rounded-lg px-2.5 sm:inline-flex">
      <Link href="/platform/operator?inbox=1" aria-label={unread ? `Open Wahb Operator, ${unread} unread investigations` : 'Open Wahb Operator'}>
        <Bot className="h-3.5 w-3.5 text-sky-700" />
        <span>Operator</span>
        {unread > 0 ? <span className="ml-0.5 rounded-full bg-sky-700 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{unread > 99 ? '99+' : unread}</span> : null}
      </Link>
    </Button>
  );
}
