'use client';

import Link from 'next/link';
import { Bot, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { persistOperatorLaunchContext } from '@/lib/operator/launch-context';
import { createOperatorLaunchHref } from '@/lib/operator/route-manifest';
import { operatorTranslations } from '@/lib/operator/i18n';
import { useOperatorPageContext } from './operator-context-provider';

export function OperatorLauncher({ compact = false }: { compact?: boolean }) {
  const { context } = useOperatorPageContext();
  const copy = operatorTranslations.en;
  if (!context) return null;
  const intents = [
    { value: 'explain' as const, label: copy.intentExplain },
    { value: 'investigate' as const, label: copy.intentInvestigate },
    { value: 'recommend' as const, label: copy.intentRecommend },
    { value: 'compare' as const, label: copy.intentCompare },
    ...(context.available_intents.includes('resolve') ? [{ value: 'resolve' as const, label: copy.intentResolve }] : []),
  ];
  const destination = (intent: typeof intents[number]['value']) => createOperatorLaunchHref(context, intent);
  if (compact) return <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 px-2.5"><Link href={destination('explain')} onClick={() => persistOperatorLaunchContext(context)}><Bot className="size-3.5 text-sky-700" />{copy.launcher}</Link></Button>;
  // The workspace already owns its right-side governance and task panels.
  // Rendering a fixed, high-z-index launcher there obscures those controls.
  if (context.domain === 'operator') return null;
  return <aside aria-label="Wahb Operator launcher" className="fixed bottom-5 right-5 z-40 hidden w-72 overflow-hidden rounded-2xl border bg-card shadow-xl lg:block">
    <div className="border-b bg-slate-950 px-4 py-3 text-slate-50"><div className="flex items-center gap-2 text-sm font-semibold"><Bot className="size-4 text-sky-300" />{copy.launcher}</div><p className="mt-1 text-xs text-slate-300">{context.domain.replaceAll('_', ' ')} · {context.view.replaceAll('_', ' ')}</p></div>
    <div className="space-y-1 p-2">{intents.map((item) => <Link key={item.value} href={destination(item.value)} onClick={() => persistOperatorLaunchContext(context)} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"><span>{item.label}</span><ChevronRight className="size-3.5 text-muted-foreground" /></Link>)}</div>
  </aside>;
}
