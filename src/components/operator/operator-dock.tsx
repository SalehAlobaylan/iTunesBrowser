'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowUp,
  Bot,
  ChevronRight,
  FileSearch,
  Loader2,
  PanelRightClose,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  useOperatorBriefing,
  useOperatorInvestigationEvents,
  useOperatorMutations,
} from '@/hooks/use-operator';
import { persistOperatorLaunchContext } from '@/lib/operator/launch-context';
import { createOperatorLaunchHref } from '@/lib/operator/route-manifest';
import { useOperatorDock } from '@/lib/stores/operator-dock';
import type { OperatorIntent } from '@/types/platform/operator';
import { useOperatorPageContext } from './operator-context-provider';
import {
  lifecycleLabel,
  operatorCopy,
  type OperatorLocale,
} from '@/components/platform/operator/operator-copy';

function inferLocale(value: string): OperatorLocale {
  return /[\u0600-\u06ff]/.test(value) ? 'ar' : 'en';
}

export function OperatorDock() {
  const pathname = usePathname();
  const page = useOperatorPageContext();
  const dock = useOperatorDock();
  const { context: dockContext, intent: dockIntent, open, setOpen, toggle } = dock;
  const context = dockContext ?? page.context;
  const queryContext = context ?? {
    schema_version: 'wahb-operator/v1' as const,
    domain: 'global_ops',
    view: 'operations',
    filters: {},
    subjects: [],
    available_intents: ['explain', 'investigate'] as OperatorIntent[],
  };
  const [isDesktop, setDesktop] = useState(false);
  const [locale, setLocale] = useState<OperatorLocale>('en');
  const [prompt, setPrompt] = useState('');
  const [intent, setIntent] = useState<OperatorIntent>(dockIntent);
  const [threadID, setThreadID] = useState<string>();
  const [investigationID, setInvestigationID] = useState<string>();
  const [error, setError] = useState('');
  const mutations = useOperatorMutations();
  const briefing = useOperatorBriefing(
    queryContext,
    locale,
    Boolean(open && context && pathname !== '/platform/operator')
  );
  const events = useOperatorInvestigationEvents(investigationID);
  const t = operatorCopy(locale);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    setIntent(dockIntent);
  }, [dockIntent]);
  useEffect(() => {
    if (pathname === '/platform/operator') return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pathname, toggle]);

  const fullHref = useMemo(() => {
    if (!context) return '/platform/operator';
    const base = createOperatorLaunchHref(context, intent);
    const params = new URLSearchParams(base.split('?')[1] ?? '');
    if (threadID) params.set('thread', threadID);
    if (investigationID) params.set('investigation', investigationID);
    return `/platform/operator?${params.toString()}`;
  }, [context, intent, investigationID, threadID]);

  if (!context || pathname === '/platform/operator') return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question) return;
    setError('');
    try {
      const nextLocale = inferLocale(question);
      setLocale(nextLocale);
      const thread = await mutations.createThread.mutateAsync({
        title: question.replace(/\s+/g, ' ').slice(0, 74),
        locale: nextLocale,
      });
      const started = await mutations.startInvestigation.mutateAsync({
        visible_context: context,
        intent,
        locale: nextLocale,
        message: question,
        tier: 'fast',
        thread_id: thread.id,
      });
      setThreadID(thread.id);
      setInvestigationID(started.investigation_id);
      setPrompt('');
    } catch (cause) {
      setError((cause as { message?: string })?.message ?? t.unavailable);
    }
  };

  const body = (
    <div
      className="flex h-full min-h-0 flex-col bg-card"
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="size-4 text-primary" />
            {t.title}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {context.domain.replaceAll('_', ' ')} ·{' '}
            {context.view.replaceAll('_', ' ')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setOpen(false)}
          aria-label={t.closeOperator}
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!investigationID ? (
          <>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" />
                {t.shiftBriefing}
              </div>
              <h2 className="mt-1 text-base font-semibold">
                {briefing.data?.headline ?? t.loading}
              </h2>
            </div>
            <div className="divide-y rounded-lg border">
              {briefing.data?.items.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">
                      {item.title.replaceAll('_', ' ')}
                    </p>
                    <Badge variant="outline">{item.severity}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.summary.replaceAll('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {briefing.data?.suggested_questions
                .slice(0, 3)
                .map((question) => (
                  <button
                    key={question.text}
                    className="rounded-lg border p-3 text-start text-xs hover:bg-muted"
                    onClick={() => {
                      setPrompt(question.text);
                      setIntent(question.intent);
                    }}
                    dir="auto"
                  >
                    {question.text}
                  </button>
                ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-info" />
                <div>
                  <p className="text-sm font-medium">
                    {lifecycleLabel(
                      events.data?.state ?? 'backgrounded',
                      locale
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {events.data?.events.length ?? 0} {t.eventsRecorded}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {events.data?.events.slice(-4).map((item) => (
                  <Badge key={item.sequence} variant="outline">
                    {lifecycleLabel(item.event_type, locale)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>
      <div className="border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {investigationID ? (
          <Button
            asChild
            className="w-full"
            onClick={() => persistOperatorLaunchContext(context)}
          >
            <Link href={fullHref}>
              {t.openFullCase}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-2 flex gap-1">
              {(['explain', 'investigate'] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={intent === mode ? 'secondary' : 'ghost'}
                  onClick={() => setIntent(mode)}
                >
                  {mode === 'explain' ? t.ask : t.investigate}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                className="min-h-12 resize-none border-0 p-1 shadow-none focus-visible:ring-0"
                placeholder={t.placeholder}
                dir="auto"
              />
              <Button
                type="submit"
                size="icon"
                disabled={
                  !prompt.trim() || mutations.startInvestigation.isPending
                }
              >
                {mutations.startInvestigation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        open ? (
          <aside className="hidden w-[380px] shrink-0 border-s xl:block">
            {body}
          </aside>
        ) : null
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-[min(94vw,380px)] p-0 sm:max-w-[380px]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Wahb Operator</SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
