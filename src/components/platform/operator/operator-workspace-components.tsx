'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowUp,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  FileSearch,
  Inbox,
  Languages,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Pin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  OperatorIntent,
  OperatorVisibleContext,
} from '@/types/platform/operator';
import type {
  OperatorAction,
  OperatorPlan,
  OperatorTask,
  OperatorTaskGroup,
  OperatorTaskKind,
  OperatorThread,
} from '@/hooks/use-operator';
import {
  actionLabel,
  lifecycleLabel,
  operatorCopy,
  type OperatorLocale,
} from './operator-copy';

export type OperatorMessage = {
  id: string;
  kind: string;
  actor_type: 'admin' | 'operator' | 'system';
  created_at: string;
  content: unknown;
  investigation_id?: string;
  plan_id?: string;
};
export type OperatorEvidence = {
  id: string;
  evidence_id: string;
  authority: string;
  domain: string;
  adapter_key: string;
  adapter_version: string;
  required_permission: string;
  record_refs?: unknown;
  deep_link: string;
  observed_at: string;
  fetched_at: string;
  expires_at: string;
  availability: string;
  source_version: string;
};
export type OperatorBriefing = {
  generated_at: string;
  headline: string;
  items: Array<{
    id: string;
    domain: string;
    kind: string;
    severity: string;
    title: string;
    summary: string;
    deep_link?: string;
  }>;
  suggested_questions: Array<{ intent: OperatorIntent; text: string }>;
};
export type OperatorControls = {
  controls?: {
    read_enabled: boolean;
    llm_enabled: boolean;
    execution_enabled: boolean;
    schedules_enabled: boolean;
  };
  spend?: { interactive: boolean; scheduled_hard_stop: boolean };
};
export type InspectorTab = 'evidence' | 'tasks' | 'plan' | 'governance';

const intentLabels: Record<
  OperatorIntent,
  keyof ReturnType<typeof operatorCopy>
> = {
  explain: 'ask',
  investigate: 'investigate',
  compare: 'compare',
  recommend: 'recommend',
  resolve: 'resolve',
};

export function formatOperatorTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
}

function stateVariant(state: string): BadgeProps['variant'] {
  if (['succeeded', 'completed', 'done'].includes(state)) return 'success';
  if (['failed', 'blocked'].includes(state)) return 'destructive';
  if (['awaiting_approval', 'paused', 'stale', 'conflicting'].includes(state))
    return 'warning';
  if (
    [
      'running',
      'queued',
      'claimed',
      'accepted',
      'backgrounded',
      'verifying',
      'active',
    ].includes(state)
  )
    return 'info';
  return 'secondary';
}

export function OperatorStatusBand({
  locale,
  active,
  approvals,
  failures,
  enabledControls,
  loading,
}: {
  locale: OperatorLocale;
  active: number;
  approvals: number;
  failures: number;
  enabledControls: number;
  loading?: boolean;
}) {
  const t = operatorCopy(locale);
  const items = [
    { label: t.active, value: active, icon: Clock3, tone: 'text-info' },
    {
      label: t.approvals,
      value: approvals,
      icon: ShieldCheck,
      tone: 'text-warning',
    },
    {
      label: t.failures,
      value: failures,
      icon: AlertCircle,
      tone: 'text-destructive',
    },
    {
      label: t.controls,
      value: `${enabledControls}/4`,
      icon: CheckCircle2,
      tone: enabledControls === 4 ? 'text-success' : 'text-warning',
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '—' : value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <Icon className={cn('size-4', tone)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OperatorCaseRail({
  locale,
  threads,
  activeID,
  mode,
  query,
  loading,
  onMode,
  onQuery,
  onCreate,
  onSelect,
  onPatch,
  onDelete,
}: {
  locale: OperatorLocale;
  threads: OperatorThread[];
  activeID?: string;
  mode: 'recent' | 'pinned' | 'archived';
  query: string;
  loading: boolean;
  onMode: (mode: 'recent' | 'pinned' | 'archived') => void;
  onQuery: (query: string) => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onPatch: (
    thread: OperatorThread,
    patch: { pinned?: boolean; archived?: boolean }
  ) => void;
  onDelete: (id: string) => void;
}) {
  const t = operatorCopy(locale);
  const [deleteThread, setDeleteThread] = useState<OperatorThread>();
  return (
    <>
      <Card className="flex min-h-0 flex-col overflow-hidden xl:h-[680px]">
        <CardHeader className="space-y-3 p-4 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t.cases}</CardTitle>
            <Button size="sm" onClick={onCreate}>
              <Plus className="size-3.5" />
              {t.newCase}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              className="ps-9"
              placeholder={t.searchCases}
            />
          </div>
        </CardHeader>
        <div className="flex overflow-x-auto border-y px-2" role="tablist">
          {(['recent', 'pinned', 'archived'] as const).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={mode === item}
              onClick={() => onMode(item)}
              className={cn(
                'shrink-0 border-b-2 border-transparent px-3 py-2 text-xs font-medium text-muted-foreground',
                mode === item && 'border-primary text-foreground'
              )}
            >
              {t[item]}
            </button>
          ))}
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 divide-y overflow-y-auto">
          {loading ? (
            <div className="p-4 text-xs text-muted-foreground">{t.loading}</div>
          ) : threads.length ? (
            threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  'relative flex items-start gap-2 p-3 transition-colors hover:bg-muted/50',
                  activeID === thread.id &&
                    'bg-primary/5 before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-primary'
                )}
              >
                <button
                  className="min-w-0 flex-1 text-start"
                  onClick={() => onSelect(thread.id)}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {thread.title}
                    </span>
                    {(thread.unread_count ?? 0) > 0 ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-info" />
                    ) : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    {thread.last_domain ? (
                      <span>{thread.last_domain.replaceAll('_', ' ')}</span>
                    ) : null}
                    {thread.last_state ? (
                      <Badge
                        variant={stateVariant(thread.last_state)}
                        className="px-1.5 py-0 text-[9px]"
                      >
                        {lifecycleLabel(thread.last_state, locale)}
                      </Badge>
                    ) : null}
                    <span>{formatOperatorTime(thread.last_activity_at)}</span>
                    <span>{thread.locale === 'ar' ? 'AR' : 'EN'}</span>
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={t.details}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        onPatch(thread, { pinned: !thread.pinned_at })
                      }
                    >
                      <Pin className="me-2 size-4" />
                      {thread.pinned_at ? t.unpin : t.pin}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onPatch(thread, { archived: !thread.archived_at })
                      }
                    >
                      <Archive className="me-2 size-4" />
                      {thread.archived_at ? t.restore : t.archive}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteThread(thread)}
                    >
                      <Trash2 className="me-2 size-4" />
                      {t.deleteCase}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 p-5 text-center">
              <Inbox className="size-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t.noCases}</p>
            </div>
          )}
        </div>
      </Card>
      <Dialog
        open={Boolean(deleteThread)}
        onOpenChange={(open) => {
          if (!open) setDeleteThread(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>{t.deleteDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteThread(undefined)}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteThread) onDelete(deleteThread.id);
                setDeleteThread(undefined);
              }}
            >
              {t.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OperatorBriefingPanel({
  locale,
  briefing,
  loading,
  activeTasks,
  onQuestion,
}: {
  locale: OperatorLocale;
  briefing?: OperatorBriefing;
  loading: boolean;
  activeTasks: number;
  onQuestion: (text: string, intent: OperatorIntent) => void;
}) {
  const t = operatorCopy(locale);
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="size-4" />
            {t.shiftBriefing}
          </div>
          <h2 className="mt-1 text-lg font-semibold">
            {briefing?.headline ?? (loading ? t.loading : t.noBriefing)}
          </h2>
        </div>
        <Badge variant={activeTasks ? 'info' : 'secondary'}>
          {activeTasks} {t.active.toLocaleLowerCase()}
        </Badge>
      </div>
      <div className="divide-y rounded-lg border">
        {briefing?.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3">
            <span
              className={cn(
                'mt-1 size-2 shrink-0 rounded-full',
                item.severity === 'available'
                  ? 'bg-success'
                  : item.severity === 'stale' || item.severity === 'conflicting'
                    ? 'bg-warning'
                    : 'bg-info'
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {item.title.replaceAll('_', ' ')}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {item.domain.replaceAll('_', ' ')}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                {item.summary.replaceAll('_', ' ')}
              </p>
            </div>
            {item.deep_link ? (
              <Button asChild variant="ghost" size="icon" className="size-8">
                <Link href={item.deep_link} aria-label={t.openRecord}>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {briefing?.suggested_questions.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {briefing.suggested_questions.map((question) => (
            <button
              key={question.text}
              onClick={() => onQuestion(question.text, question.intent)}
              className="rounded-lg border p-3 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              dir="auto"
            >
              {question.text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function responseBlocks(content: unknown) {
  if (
    !content ||
    typeof content !== 'object' ||
    !('blocks' in content) ||
    !Array.isArray((content as { blocks?: unknown }).blocks)
  )
    return [];
  return (content as { blocks: unknown[] }).blocks.filter(
    (block): block is { kind: string; text: string; evidence_ids?: string[] } =>
      Boolean(block) &&
      typeof block === 'object' &&
      typeof (block as { kind?: unknown }).kind === 'string' &&
      typeof (block as { text?: unknown }).text === 'string'
  );
}

function messageText(content: unknown) {
  return content &&
    typeof content === 'object' &&
    'text' in content &&
    typeof (content as { text?: unknown }).text === 'string'
    ? (content as { text: string }).text
    : '';
}

export function OperatorTranscript({
  locale,
  messages,
  activeInvestigationID,
  investigationState,
  investigationEvents,
  evidenceCount,
  actions,
  recommendations,
  onEvidence,
  onPrepare,
  onCancelInvestigation,
}: {
  locale: OperatorLocale;
  messages: OperatorMessage[];
  activeInvestigationID?: string;
  investigationState?: string;
  investigationEvents: Array<{ sequence: number; event_type: string }>;
  evidenceCount: number;
  actions: OperatorAction[];
  recommendations: Array<{
    id: string;
    rank: number;
    title: string;
    summary: string;
    deep_link: string;
    manual_only: boolean;
  }>;
  onEvidence: () => void;
  onPrepare: (action: Extract<OperatorAction, { kind: 'plan' }>) => void;
  onCancelInvestigation: () => void;
}) {
  const t = operatorCopy(locale);
  const responseMessages = messages.filter(
    (message) => message.actor_type !== 'system' || message.kind !== 'plan'
  );
  return (
    <div className="divide-y">
      {responseMessages.map((message) => {
        const blocks = responseBlocks(message.content);
        const text = messageText(message.content);
        const isAdmin = message.actor_type === 'admin';
        const cited = new Set(
          blocks.flatMap((block) => block.evidence_ids ?? [])
        ).size;
        return (
          <section
            key={message.id}
            className={cn('p-4 sm:p-5', isAdmin && 'bg-muted/30')}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md border',
                    isAdmin ? 'bg-background' : 'bg-primary/5 text-primary'
                  )}
                >
                  {isAdmin ? (
                    <span className="text-xs font-semibold">
                      {locale === 'ar' ? 'أ' : 'Y'}
                    </span>
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium">
                    {isAdmin ? (locale === 'ar' ? 'أنت' : 'You') : t.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatOperatorTime(message.created_at)}
                  </p>
                </div>
              </div>
              {!isAdmin && cited ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={onEvidence}
                >
                  <FileSearch className="size-3.5" />
                  {cited} {t.evidence}
                </Button>
              ) : null}
            </div>
            {text ? (
              <p className="text-sm leading-6" dir="auto">
                {text}
              </p>
            ) : null}
            {blocks.length ? (
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div
                    key={`${block.kind}-${index}`}
                    className={cn(index > 0 && 'border-t pt-4')}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge
                        variant={
                          block.kind === 'fact'
                            ? 'success'
                            : block.kind === 'unknown' ||
                                block.kind === 'degraded'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {block.kind === 'fact'
                          ? t.confirmedFacts
                          : block.kind === 'interpretation'
                            ? t.interpretation
                            : block.kind === 'unknown'
                              ? t.unknowns
                              : block.kind === 'recommendation'
                                ? t.recommendations
                                : t.degraded}
                      </Badge>
                      {block.evidence_ids?.length ? (
                        <button
                          className="text-[11px] text-primary hover:underline"
                          onClick={onEvidence}
                        >
                          {block.evidence_ids.length}{' '}
                          {t.evidence.toLocaleLowerCase()}
                        </button>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6" dir="auto">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
      {activeInvestigationID &&
      investigationState &&
      !['completed', 'failed', 'cancelled'].includes(investigationState) ? (
        <section className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-info" />
              <div>
                <p className="text-sm font-medium">
                  {lifecycleLabel(investigationState, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.questionSaved}
                </p>
              </div>
            </div>
            {['accepted', 'backgrounded'].includes(investigationState) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelInvestigation}
              >
                {t.cancelTask}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {investigationEvents.slice(-5).map((event) => (
              <Badge variant="outline" key={event.sequence}>
                <CircleDot className="me-1 size-3" />
                {lifecycleLabel(event.event_type, locale)}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
      {recommendations.length ? (
        <section className="space-y-3 p-4 sm:p-5">
          <h3 className="text-sm font-semibold">{t.recommendations}</h3>
          <div className="grid gap-2">
            {recommendations.map((item) => (
              <article key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={item.rank === 1 ? 'default' : 'secondary'}>
                    {item.rank === 1
                      ? locale === 'ar'
                        ? 'أساسية'
                        : 'Primary'
                      : `${locale === 'ar' ? 'ثانوية' : 'Secondary'} ${item.rank - 1}`}
                  </Badge>
                  {item.manual_only ? (
                    <Badge variant="warning">
                      {locale === 'ar' ? 'يدوي' : 'Manual'}
                    </Badge>
                  ) : null}
                </div>
                <h4 className="mt-2 text-sm font-medium" dir="auto">
                  {item.title}
                </h4>
                <p
                  className="mt-1 text-xs leading-5 text-muted-foreground"
                  dir="auto"
                >
                  {item.summary}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={item.deep_link}>
                    {t.openRecord}
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {actions.length ? (
        <section className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t.safeActions}</h3>
            <Badge variant="secondary">{actions.length}</Badge>
          </div>
          <div className="divide-y rounded-lg border">
            {actions.map((action, index) => {
              const label = actionLabel(action.localized_action_key, locale);
              return (
                <div
                  key={
                    action.kind === 'plan'
                      ? action.key
                      : `${action.localized_action_key}-${index}`
                  }
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {label ?? t.unavailable}
                      </p>
                      {action.kind === 'plan' ? (
                        <Badge
                          variant={
                            action.risk_tier === 'high_impact'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {action.risk_tier === 'high_impact'
                            ? t.highImpact
                            : t.routine}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {locale === 'ar' ? 'يدوي فقط' : 'Manual only'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.kind === 'plan'
                        ? `${action.target_ids.length} ${action.target_type.replaceAll('_', ' ')} · ${action.affected_domains.join(', ')}`
                        : action.affected_domain.replaceAll('_', ' ')}
                    </p>
                  </div>
                  {action.kind === 'plan' ? (
                    <Button
                      size="sm"
                      disabled={!label}
                      onClick={() => onPrepare(action)}
                    >
                      {t.reviewPlan}
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={action.deep_link}>
                        {t.manualAction}
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : investigationState === 'completed' ? (
        <section className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">{t.noActions}</p>
        </section>
      ) : null}
    </div>
  );
}

export function OperatorComposer({
  locale,
  prompt,
  intent,
  allowed,
  disabled,
  busy,
  onPrompt,
  onIntent,
  onSubmit,
}: {
  locale: OperatorLocale;
  prompt: string;
  intent: OperatorIntent;
  allowed: OperatorIntent[];
  disabled: boolean;
  busy: boolean;
  onPrompt: (value: string) => void;
  onIntent: (intent: OperatorIntent) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const t = operatorCopy(locale);
  return (
    <form
      onSubmit={onSubmit}
      className="border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {allowed.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={intent === mode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 shrink-0"
            onClick={() => onIntent(mode)}
          >
            {String(t[intentLabels[mode]])}
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
        <Textarea
          id="operator-composer-input"
          value={prompt}
          onChange={(event) => onPrompt(event.target.value)}
          disabled={disabled || busy}
          maxLength={8000}
          rows={2}
          className="min-h-[48px] resize-none border-0 p-1 shadow-none focus-visible:ring-0"
          placeholder={t.placeholder}
          dir="auto"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || busy || !prompt.trim()}
          aria-label={t.send}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}

export function OperatorPlanPanel({
  locale,
  plan,
  events,
  stale,
  approving,
  onApprove,
  onCancel,
  onRefresh,
}: {
  locale: OperatorLocale;
  plan?: OperatorPlan;
  events: Array<{ sequence: number; event_type: string; created_at: string }>;
  stale: boolean;
  approving: boolean;
  onApprove: (phrase: string) => void;
  onCancel: () => void;
  onRefresh: () => void;
}) {
  const t = operatorCopy(locale);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  if (!plan) return <EmptyPanel icon={ShieldCheck} text={t.emptyPlan} />;
  const label = plan.localized_action_key
    ? actionLabel(plan.localized_action_key, locale)
    : undefined;
  const high = plan.risk_tier === 'high_impact';
  const expected =
    plan.confirmation_phrases?.[locale === 'ar' ? 1 : 0] ??
    (locale === 'ar' ? 'أوافق' : 'APPROVE');
  const cancellable = ['awaiting_approval', 'queued'].includes(plan.state);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label ?? t.unavailable}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {plan.target_type?.replaceAll('_', ' ') ?? t.target}
          </p>
        </div>
        <Badge variant={stateVariant(plan.state)}>
          {lifecycleLabel(plan.state, locale)}
        </Badge>
      </div>
      {stale ? (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-xs">
          <p>{t.stalePlan}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onRefresh}
          >
            <RefreshCw className="size-3.5" />
            {t.freshPlan}
          </Button>
        </div>
      ) : null}
      <dl className="grid gap-3 text-xs">
        <Detail label={t.target}>
          <bdi className="break-all font-mono">
            {plan.canonical_plan.target_ids.join(', ')}
          </bdi>
        </Detail>
        <Detail label={t.affected}>{plan.affected_domains?.join(', ')}</Detail>
        <Detail label={t.cancellation}>
          {plan.canonical_plan.cancellation}
        </Detail>
        <Detail label={t.rollback}>{plan.canonical_plan.rollback}</Detail>
        <Detail label={t.contingencies}>
          <ul className="list-inside list-disc">
            {plan.canonical_plan.contingencies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Detail>
        <Detail label="Digest">
          <bdi className="font-mono">{plan.digest.slice(0, 16)}…</bdi>
        </Detail>
      </dl>
      {events.length ? (
        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-medium">
            {locale === 'ar' ? 'مسار التنفيذ' : 'Execution trail'}
          </p>
          <div className="space-y-2">
            {events.slice(-8).map((event) => (
              <div
                key={event.sequence}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex items-center gap-2">
                  <CircleDot className="size-3 text-muted-foreground" />
                  {lifecycleLabel(event.event_type, locale)}
                </span>
                <span className="text-muted-foreground">
                  {formatOperatorTime(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {plan.verified_effects ? (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-success">
            <CheckCircle2 className="size-4" />
            {t.proof}
          </div>
          {(['before', 'after', 'verified'] as const).map((key) =>
            plan.verified_effects?.[key] !== undefined ? (
              <Detail
                key={key}
                label={
                  key === 'before'
                    ? t.before
                    : key === 'after'
                      ? t.after
                      : t.proof
                }
              >
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[10px]">
                  {JSON.stringify(plan.verified_effects[key], null, 2)}
                </pre>
              </Detail>
            ) : null
          )}
          {plan.verified_effects.deep_links?.map((href) => (
            <Button asChild key={href} variant="outline" size="sm">
              <Link href={href}>
                {t.openRecord}
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {plan.state === 'awaiting_approval' && !stale && label ? (
          <Button
            size="sm"
            onClick={() => {
              setPhrase(high ? '' : expected);
              setConfirmOpen(true);
            }}
          >
            {high ? t.approveHigh : t.approve}
          </Button>
        ) : null}
        {cancellable ? (
          <Button size="sm" variant="outline" onClick={onCancel}>
            {t.cancelPlan}
          </Button>
        ) : null}
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{high ? t.approveHigh : t.approve}</DialogTitle>
            <DialogDescription>
              {label}.{' '}
              {high
                ? t.typePhrase
                : `${t.target}: ${plan.canonical_plan.target_ids.join(', ')}`}
            </DialogDescription>
          </DialogHeader>
          {high ? (
            <div>
              <label className="text-xs font-medium">{t.typePhrase}</label>
              <Input
                className="mt-2"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                placeholder={expected}
                dir="ltr"
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={approving || phrase !== expected}
              onClick={() => {
                onApprove(phrase);
                setConfirmOpen(false);
              }}
            >
              {approving ? <Loader2 className="size-4 animate-spin" /> : null}
              {high ? t.approveHigh : t.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-xs">{children}</dd>
    </div>
  );
}
function EmptyPanel({
  icon: Icon,
  text,
}: {
  icon: typeof FileSearch;
  text: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-5 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <p className="max-w-56 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

export function OperatorInspector({
  locale,
  tab,
  context,
  evidence,
  tasks,
  taskGroup,
  taskKind,
  controls,
  plan,
  planEvents,
  planStale,
  approving,
  onTab,
  onTaskGroup,
  onTaskKind,
  onCancelTask,
  onApprove,
  onCancelPlan,
  onRefreshPlan,
}: {
  locale: OperatorLocale;
  tab: InspectorTab;
  context: OperatorVisibleContext;
  evidence: OperatorEvidence[];
  tasks: OperatorTask[];
  taskGroup: OperatorTaskGroup;
  taskKind: OperatorTaskKind;
  controls?: OperatorControls;
  plan?: OperatorPlan;
  planEvents: Array<{
    sequence: number;
    event_type: string;
    created_at: string;
  }>;
  planStale: boolean;
  approving: boolean;
  onTab: (tab: InspectorTab) => void;
  onTaskGroup: (group: OperatorTaskGroup) => void;
  onTaskKind: (kind: OperatorTaskKind) => void;
  onCancelTask: (task: OperatorTask) => void;
  onApprove: (phrase: string) => void;
  onCancelPlan: () => void;
  onRefreshPlan: () => void;
}) {
  const t = operatorCopy(locale);
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden xl:h-[680px]">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t.inspector}
            </p>
            <CardTitle className="text-base">
              {tab === 'evidence'
                ? t.evidence
                : tab === 'tasks'
                  ? t.tasks
                  : tab === 'plan'
                    ? t.plan
                    : t.governance}
            </CardTitle>
          </div>
          <PanelRight className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => onTab(value as InspectorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 grid h-auto grid-cols-4">
          <TabsTrigger className="px-1 text-[11px]" value="evidence">
            {t.evidence}
          </TabsTrigger>
          <TabsTrigger className="px-1 text-[11px]" value="tasks">
            {t.tasks}
          </TabsTrigger>
          <TabsTrigger className="px-1 text-[11px]" value="plan">
            {t.plan}
          </TabsTrigger>
          <TabsTrigger className="px-1 text-[11px]" value="governance">
            {t.governance}
          </TabsTrigger>
        </TabsList>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="evidence" className="m-0 p-4">
            {evidence.length ? (
              <div className="divide-y rounded-lg border">
                {evidence.map((item) => (
                  <article key={item.id} className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px]">
                          {item.evidence_id}
                        </p>
                        <p className="text-xs font-medium">
                          {item.domain.replaceAll('_', ' ')}
                        </p>
                      </div>
                      <Badge variant={stateVariant(item.availability)}>
                        {item.availability}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-2">
                      <Detail label={t.authority}>{item.authority}</Detail>
                      <Detail label={t.observed}>
                        {formatOperatorTime(item.observed_at)}
                      </Detail>
                      <Detail label="Adapter">{item.adapter_key}</Detail>
                      <Detail label={t.expires}>
                        {formatOperatorTime(item.expires_at)}
                      </Detail>
                    </dl>
                    <Button asChild variant="outline" size="sm">
                      <Link href={item.deep_link}>
                        {t.openRecord}
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={FileSearch} text={t.emptyEvidence} />
            )}
          </TabsContent>
          <TabsContent value="tasks" className="m-0 space-y-3 p-4">
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={taskGroup}
                onValueChange={(value) =>
                  onTaskGroup(value as OperatorTaskGroup)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.groups).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={taskKind}
                onValueChange={(value) => onTaskKind(value as OperatorTaskKind)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.kinds).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tasks.length ? (
              <div className="divide-y rounded-lg border">
                {tasks.map((task) => (
                  <div key={task.id} className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {task.title.replaceAll('_', ' ')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {task.kind.replaceAll('_', ' ')} ·{' '}
                          {formatOperatorTime(task.updated_at)}
                        </p>
                      </div>
                      <Badge variant={stateVariant(task.state)}>
                        {lifecycleLabel(task.state, locale)}
                      </Badge>
                    </div>
                    {task.can_cancel ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => onCancelTask(task)}
                      >
                        {t.cancelTask}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={Inbox} text={t.emptyTasks} />
            )}
          </TabsContent>
          <TabsContent value="plan" className="m-0 p-4">
            <OperatorPlanPanel
              locale={locale}
              plan={plan}
              events={planEvents}
              stale={planStale}
              approving={approving}
              onApprove={onApprove}
              onCancel={onCancelPlan}
              onRefresh={onRefreshPlan}
            />
          </TabsContent>
          <TabsContent value="governance" className="m-0 space-y-4 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              {locale === 'ar'
                ? 'مفاتيح إيقاف CMS مستقلة. تعطيل قدرة لا يخفي السجل أو يمنع التحقق والإلغاء.'
                : 'CMS controls are independent stops. Disabling one capability never hides history or blocks verification and cancellation.'}
            </p>
            <div className="divide-y rounded-lg border">
              {Object.entries(controls?.controls ?? {}).map(
                ([key, enabled]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 p-3 text-xs"
                  >
                    <span>
                      {key.replace('_enabled', '').replaceAll('_', ' ')}
                    </span>
                    <Badge variant={enabled ? 'success' : 'warning'}>
                      {enabled
                        ? locale === 'ar'
                          ? 'مفعّل'
                          : 'Enabled'
                        : locale === 'ar'
                          ? 'معطّل'
                          : 'Disabled'}
                    </Badge>
                  </div>
                )
              )}
            </div>
            <div className="rounded-lg border p-3 text-xs">
              <p className="font-medium">
                {locale === 'ar' ? 'السياق الحالي' : 'Current context'}
              </p>
              <dl className="mt-3 grid gap-2">
                <Detail label="Domain">{context.domain}</Detail>
                <Detail label="View">{context.view}</Detail>
                <Detail label={locale === 'ar' ? 'السجلات' : 'Records'}>
                  {context.subjects.length
                    ? context.subjects.map((subject) => (
                        <bdi
                          className="block font-mono"
                          key={`${subject.type}:${subject.id}`}
                        >
                          {subject.type}:{subject.id}
                        </bdi>
                      ))
                    : '—'}
                </Detail>
              </dl>
            </div>
            {controls?.spend?.interactive ? (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-xs">
                {locale === 'ar'
                  ? 'تحذير الإنفاق التفاعلي نشط.'
                  : 'Interactive spend acknowledgement is active.'}
              </div>
            ) : null}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

export function OperatorWorkspaceHeader({
  locale,
  context,
  refreshing,
  onLocale,
  onRefresh,
  onNew,
  onOpenCases,
  onOpenInspector,
}: {
  locale: OperatorLocale;
  context: OperatorVisibleContext;
  refreshing: boolean;
  onLocale: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onOpenCases: () => void;
  onOpenInspector: () => void;
}) {
  const t = operatorCopy(locale);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 xl:hidden"
          onClick={onOpenCases}
          aria-label={t.openCases}
        >
          <PanelLeft className="size-4" />
        </Button>
        <div>
          <span className="brand-overline text-primary">
            {context.domain.replaceAll('_', ' ')}
          </span>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {t.context}: {context.view.replaceAll('_', ' ')}
            </Badge>
            {context.subjects.length ? (
              <Badge variant="secondary">
                {context.subjects.length}{' '}
                {locale === 'ar' ? 'سجل' : 'record(s)'}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onLocale}>
          <Languages className="size-4" />
          {locale === 'en' ? 'العربية' : 'EN'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={t.refreshed}
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
        </Button>
        <Button size="sm" onClick={onNew}>
          <Plus className="size-4" />
          {t.newCase}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="xl:hidden"
          onClick={onOpenInspector}
          aria-label={t.openInspector}
        >
          <PanelRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function OperatorCapabilityNotices({
  locale,
  controls,
}: {
  locale: OperatorLocale;
  controls?: OperatorControls['controls'];
}) {
  const t = operatorCopy(locale);
  const notices = controls
    ? ([
        [!controls.read_enabled, t.readDisabled],
        [!controls.llm_enabled, t.llmDisabled],
        [!controls.execution_enabled, t.executionDisabled],
        [!controls.schedules_enabled, t.schedulesDisabled],
      ] as const)
    : [];
  return (
    <>
      {notices
        .filter(([show]) => show)
        .map(([, text]) => (
          <div
            key={text}
            className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>{text}</span>
          </div>
        ))}
    </>
  );
}
