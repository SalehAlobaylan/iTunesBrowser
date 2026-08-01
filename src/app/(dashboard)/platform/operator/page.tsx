'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Bot, CheckCircle2, Clock3, FileSearch, Languages, ShieldCheck, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cmsClient } from '@/lib/api/client';
import { consumeOperatorLaunchContext } from '@/lib/operator/launch-context';
import { operatorTranslations } from '@/lib/operator/i18n';
import { operatorRouteManifest, queryRootsForAffectedDomains, type OperatorRouteDescriptor } from '@/lib/operator/route-manifest';
import { operatorControlsSchema, operatorEligibleActionsSchema, operatorEventResponseSchema, operatorInboxSchema, operatorInvestigationStartSchema, operatorPlanEventResponseSchema, operatorPlanSchema, operatorRecommendationListSchema, operatorScheduleListSchema, operatorStatusSchema, operatorThreadListSchema, operatorThreadSchema, operatorVisibleContextSchema } from '@/lib/operator/schemas';
import type { OperatorIntent, OperatorVisibleContext } from '@/types/platform/operator';

type OperatorBlock = { kind: 'fact' | 'interpretation' | 'unknown' | 'recommendation' | 'degraded'; text: string; evidence_ids?: string[] };
type OperatorRecommendation = { id: string; title: string; summary: string; deep_link: string; manual_only: boolean };
type OperatorResult = { investigation_id: string; state: string; degraded: boolean; blocks: OperatorBlock[]; recommendations: OperatorRecommendation[]; packet_fingerprint: string };
type OperatorStart = { investigation_id: string; state: 'backgrounded' };
type OperatorEvent = { sequence: number; event_type: string; created_at: string; payload?: Record<string, unknown> };
type OperatorEventResponse = { state: string; events: OperatorEvent[]; next_sequence: number };
type OperatorInboxItem = { id: string; state: string; locale: 'en' | 'ar'; started_at: string; finished_at?: string; read_at?: string; error_class?: string };
type OperatorInbox = { items?: OperatorInboxItem[]; unread_count?: number };
type OperatorPlan = { id: string; state: 'awaiting_approval' | 'queued' | 'claimed' | 'running' | 'verifying' | 'succeeded' | 'failed' | 'blocked' | 'cancelled'; tool_key: string; risk_tier: string; expires_at: string; digest: string; confirmation_phrases?: string[]; canonical_plan: { target_ids: string[]; evidence_fingerprint: string } };
type OperatorPlanEffects = { affected_domains?: string[]; affected_subjects?: string[]; deep_links?: string[]; before?: unknown; after?: unknown; verified?: unknown };
type OperatorPlanEventResponse = { id: string; state: OperatorPlan['state']; events: OperatorEvent[]; next_sequence: number };

type OperatorEligibleAction = { key: string; localized_action_key: string; risk_tier: 'routine' | 'high_impact'; target_type: string; argument_schema: string; target_ids: string[]; affected_domains: string[]; manual_only: false };
type OperatorSchedule = { id: string; state: string; cadence: string; next_run_at?: string | null; paused_reason?: string; owner_id: string; read_only: true };
type OperatorControls = { controls?: { read_enabled: boolean; llm_enabled: boolean; execution_enabled: boolean; schedules_enabled: boolean }; spend?: { interactive: boolean; scheduled_hard_stop: boolean }; metrics?: Record<string, number> };
type OperatorThread = { id: string; title: string; locale: 'en' | 'ar'; last_activity_at: string; expires_at: string; created_at: string };

const workspaceScopes = [...new Map(operatorRouteManifest.map((route) => [route.domain, route])).values()];
const intents: OperatorIntent[] = ['explain', 'investigate', 'recommend', 'resolve', 'compare'];

function scopeLabel(scope: OperatorRouteDescriptor) {
  return scope.domain.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localizedLifecycle(value: string, locale: 'en' | 'ar') {
  if (locale === 'en') return value.replaceAll('_', ' ');
  return ({ awaiting_approval: 'بانتظار الموافقة', queued: 'في قائمة الانتظار', claimed: 'تم الاستلام', running: 'قيد التنفيذ', verifying: 'قيد التحقق', succeeded: 'نجح', failed: 'فشل', blocked: 'محظور', cancelled: 'أُلغي', completed: 'مكتمل', backgrounded: 'يعمل في الخلفية', paused: 'موقوف مؤقتاً', active: 'نشط', snoozed: 'مؤجل', dismissed: 'مرفوض', revoked: 'مُلغى', accepted: 'تم القبول', context_collecting: 'جارٍ جمع السياق', packet_ready: 'حزمة الأدلة جاهزة', response_block: 'كتلة استجابة', done: 'اكتملت المهمة' } as Record<string, string>)[value] ?? value.replaceAll('_', ' ');
}

function localizedBlockKind(value: OperatorBlock['kind'], locale: 'en' | 'ar') {
  if (locale === 'en') return value;
  return ({ fact: 'حقيقة', interpretation: 'تفسير', unknown: 'غير معروف', recommendation: 'توصية', degraded: 'استجابة محدودة' } as Record<OperatorBlock['kind'], string>)[value];
}

function localizedScopeLabel(scope: OperatorRouteDescriptor, locale: 'en' | 'ar') {
  if (locale === 'en') return scopeLabel(scope);
  return ({
    global_ops: 'العمليات العامة', system_health: 'صحة النظام', real_experience: 'التجربة الفعلية', ai_economics: 'اقتصاديات الذكاء الاصطناعي',
    sources: 'المصادر', content: 'المحتوى', news: 'الأخبار', news_finding: 'اكتشاف الأخبار', news_circulation: 'توزيع الأخبار',
    media_sources: 'مصادر الوسائط', atomization: 'تجزئة الوسائط', media_circulation: 'توزيع الوسائط', redundancy: 'التكرار',
    media_library: 'مكتبة الوسائط', storage_quality: 'التخزين والجودة', pipeline: 'خط المعالجة', enrichment: 'الإثراء',
    intelligence: 'الذكاء', embeddings: 'التضمينات', topics_preferences: 'الموضوعات والتفضيلات', moderation: 'الإشراف',
    retention: 'الاحتفاظ', feed_integrity: 'سلامة الخلاصة', feed_recovery: 'استعادة الخلاصة', auth_center: 'مركز الهوية', operator: 'المشغّل',
  } as Record<string, string>)[scope.domain] ?? scopeLabel(scope);
}

function localizedControlLabel(value: string, locale: 'en' | 'ar') {
  const normalized = value.replace('_enabled', '');
  if (locale === 'en') return normalized;
  return ({ read: 'القراءة', llm: 'الاستدلال الذكي', execution: 'التنفيذ', schedules: 'الجداول' } as Record<string, string>)[normalized] ?? normalized;
}

// Action availability and the stable localization key are CMS-owned. Until a
// translated catalog bundle is supplied, Arabic preserves that authority while
// making the action affordance readable instead of inventing an action name.
function localizedGovernanceAction(_toolKey: string, label: string, locale: 'en' | 'ar') {
  return locale === 'ar' ? `إجراء مسجّل: ${label}` : label;
}

function operatorErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message.trim()) return cause.message;
  if (typeof cause === 'object' && cause !== null && 'message' in cause) {
    const message = (cause as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function contextFor(scope: OperatorRouteDescriptor, subjectType: string, subjectID: string, explicitTarget: string): OperatorVisibleContext {
  const target = explicitTarget.trim();
  return {
    schema_version: 'wahb-operator/v1', domain: scope.domain, view: scope.view, filters: {},
    subjects: subjectID.trim() ? [{ type: subjectType.trim() || 'record', id: subjectID.trim() }] : [{ type: 'tenant', id: 'current' }],
    ...(target ? { selection: { mode: 'explicit' as const, ids: [target], count: 1 } } : {}),
    available_intents: scope.available_intents,
  };
}

function eventBlocks(events: OperatorEvent[]) {
  return events.flatMap((event): OperatorBlock[] => {
    const value = event.payload;
    if (event.event_type !== 'response_block' || !value || typeof value.kind !== 'string' || typeof value.text !== 'string') return [];
    const evidenceIDs = Array.isArray(value.evidence_ids) && value.evidence_ids.every((id) => typeof id === 'string') ? value.evidence_ids : undefined;
    return [{ kind: value.kind as OperatorBlock['kind'], text: value.text, evidence_ids: evidenceIDs }];
  });
}

export default function OperatorWorkspacePage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [scopeDomain, setScopeDomain] = useState('media_sources');
  const [subjectType, setSubjectType] = useState('record');
  const [subjectID, setSubjectID] = useState('');
  const [explicitTarget, setExplicitTarget] = useState('');
  const [storedContext, setStoredContext] = useState<OperatorVisibleContext>();
  const [intent, setIntent] = useState<OperatorIntent>('explain');
  const [message, setMessage] = useState('Why is this waiting, and what evidence supports that state?');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [result, setResult] = useState<OperatorResult>();
  const [events, setEvents] = useState<OperatorEvent[]>([]);
  const [inbox, setInbox] = useState<OperatorInbox>({});
  const [error, setError] = useState<string>();
  const [eventsError, setEventsError] = useState<string>();
  const [activeInvestigationID, setActiveInvestigationID] = useState<string>();
  const [plan, setPlan] = useState<OperatorPlan>();
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [schedules, setSchedules] = useState<OperatorSchedule[]>([]);
	const [controls, setControls] = useState<OperatorControls>();
	const [governanceLoading, setGovernanceLoading] = useState(true);
	const [threads, setThreads] = useState<OperatorThread[]>([]);
	const [activeThreadID, setActiveThreadID] = useState<string>();
	const [planEvents, setPlanEvents] = useState<OperatorEvent[]>([]);
  const [planEffects, setPlanEffects] = useState<OperatorPlanEffects>();
	const [domainTool, setDomainTool] = useState('');
	const [eligibleActions, setEligibleActions] = useState<OperatorEligibleAction[]>([]);
	const [capability, setCapability] = useState<{ operational: true; controls: { read_enabled: boolean; llm_enabled: boolean; execution_enabled: boolean; schedules_enabled: boolean } }>();
	const [capabilityLoading, setCapabilityLoading] = useState(true);
	const available = capability?.controls.read_enabled === true;
  const eventAbortRef = useRef<AbortController | undefined>(undefined);
  const eventTimerRef = useRef<number | undefined>(undefined);
	const invalidatedPlansRef = useRef(new Set<string>());
  const scope = useMemo(() => workspaceScopes.find((item) => item.domain === scopeDomain) ?? workspaceScopes[0], [scopeDomain]);
  const fallbackContext = useMemo(() => contextFor(scope, subjectType, subjectID, explicitTarget), [scope, subjectType, subjectID, explicitTarget]);
  const visibleContext = storedContext ?? fallbackContext;
  const copy = operatorTranslations[locale];
	const action = (() => {
		const candidate = eligibleActions.find((item) => item.key === domainTool) ?? eligibleActions[0];
		return candidate ? { toolKey: candidate.key, label: candidate.localized_action_key.replace('operator.action.', '').replaceAll('_', ' '), affectedDomains: candidate.affected_domains } : undefined;
	})();
	const actionTargetIDs = visibleContext.selection?.mode === 'explicit' && !visibleContext.selection.truncated ? visibleContext.selection.ids ?? [] : [];
	const activePlanID = plan?.id;

	useEffect(() => {
		void (async () => {
			try { setCapability(operatorStatusSchema.parse(await cmsClient.get<unknown>('/admin/operator/status'))); }
			catch { setCapability(undefined); }
			finally { setCapabilityLoading(false); }
		})();
	}, []);

  useEffect(() => {
    const requestedDomain = searchParams.get('domain');
    const requestedView = searchParams.get('view');
    const requestedIntent = searchParams.get('intent') as OperatorIntent | null;
    const requestedSubjectType = searchParams.get('subject_type') ?? 'record';
    const requestedSubjectID = searchParams.get('subject_id') ?? '';
    const requestedSelection = searchParams.get('selection_id') ?? '';
    const requestedScope = workspaceScopes.find((item) => item.domain === requestedDomain && (!requestedView || item.view === requestedView));
    const restored = consumeOperatorLaunchContext(requestedDomain ?? undefined, requestedView ?? undefined);
    if (restored) {
      setStoredContext(restored); setScopeDomain(restored.domain); setSubjectType(restored.subjects[0]?.type ?? 'record'); setSubjectID(restored.subjects[0]?.id ?? '');
      setExplicitTarget(restored.selection?.mode === 'explicit' ? restored.selection.ids?.[0] ?? '' : '');
    } else {
      setStoredContext(undefined);
      if (requestedScope) setScopeDomain(requestedScope.domain);
      setSubjectType(requestedSubjectType); setSubjectID(requestedSubjectID); setExplicitTarget(requestedSelection);
    }
    if (requestedIntent && intents.includes(requestedIntent)) setIntent(requestedIntent);
  }, [searchParams]);

  const loadInbox = async () => {
    try {
		const next = operatorInboxSchema.parse(await cmsClient.get<unknown>('/admin/operator/inbox', { limit: 20 }));
      setInbox(next);
    } catch {
      setInbox({});
    }
  };

  useEffect(() => { void loadInbox(); }, []);

	const loadGovernance = async () => {
		setGovernanceLoading(true);
		try {
		const [schedulePayload, controlPayload] = await Promise.all([
			cmsClient.get<unknown>('/admin/operator/schedules'),
			cmsClient.get<unknown>('/admin/operator/controls'),
		]);
		const scheduleResponse = operatorScheduleListSchema.parse(schedulePayload);
		const controlResponse = operatorControlsSchema.parse(controlPayload);
      setSchedules(scheduleResponse.items ?? []); setControls(controlResponse);
		} catch { setSchedules([]); setControls(undefined); }
		finally { setGovernanceLoading(false); }
	};

  useEffect(() => { void loadGovernance(); }, []);

	const loadThreads = async () => {
		try { setThreads(operatorThreadListSchema.parse(await cmsClient.get<unknown>('/admin/operator/threads')).items as OperatorThread[]); }
		catch { setThreads([]); }
	};
	useEffect(() => { void loadThreads(); }, []);

	const createThread = async (title: string, threadLocale: 'en' | 'ar') => {
		const created = operatorThreadSchema.parse(await cmsClient.post<unknown>('/admin/operator/threads', { title: title.trim().slice(0, 240) || (threadLocale === 'ar' ? 'تحقيق المشغّل' : 'Operator investigation'), locale: threadLocale })) as OperatorThread;
		setThreads((previous) => [created, ...previous.filter((thread) => thread.id !== created.id)]);
		setActiveThreadID(created.id);
		return created.id;
	};

	const updateThreadLocale = async (id: string, threadLocale: 'en' | 'ar') => {
		const updated = operatorThreadSchema.parse(await cmsClient.patch<unknown>(`/admin/operator/threads/${id}`, { locale: threadLocale })) as OperatorThread;
		setThreads((previous) => previous.map((thread) => thread.id === id ? updated : thread));
		setLocale(updated.locale);
	};

	const deleteThread = async (id: string) => {
		await cmsClient.delete(`/admin/operator/threads/${id}`);
		setThreads((previous) => previous.filter((thread) => thread.id !== id));
		if (activeThreadID === id) setActiveThreadID(undefined);
	};

  const loadEvents = (investigationID: string) => {
    eventAbortRef.current?.abort();
    if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
    const controller = new AbortController();
    eventAbortRef.current = controller;
    let after = 0;
    let collected: OperatorEvent[] = [];
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await fetch(`/api/operator/investigations/${investigationID}/events?after=${after}`, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) throw new Error('The durable event trail is temporarily unavailable.');
		const payload = operatorEventResponseSchema.parse(await response.json()) as OperatorEventResponse;
        if (controller.signal.aborted) return;
        const received = Array.isArray(payload.events) ? payload.events : [];
        after = Number.isInteger(payload.next_sequence) ? payload.next_sequence : after;
        collected = [...collected, ...received.filter((event) => !collected.some((saved) => saved.sequence === event.sequence))];
        setEvents(collected);
        const allEvents = collected;
        if (payload.state === 'completed') {
          const packet = allEvents.find((event) => event.event_type === 'packet_ready')?.payload;
          let recommendations: OperatorRecommendation[] = [];
	          try { recommendations = operatorRecommendationListSchema.parse(await cmsClient.get<unknown>('/admin/operator/recommendations')).items; }
	          catch { recommendations = []; }
			  try {
				  const actions = operatorEligibleActionsSchema.parse(await cmsClient.get<unknown>(`/admin/operator/investigations/${investigationID}/eligible-actions`));
				  setEligibleActions(actions.items); setDomainTool(actions.items[0]?.key ?? '');
			  } catch { setEligibleActions([]); setDomainTool(''); }
          setResult({ investigation_id: investigationID, state: payload.state, degraded: eventBlocks(allEvents).some((block) => block.kind === 'degraded'), blocks: eventBlocks(allEvents), recommendations, packet_fingerprint: typeof packet?.packet_fingerprint === 'string' ? packet.packet_fingerprint : 'unavailable' });
          setActiveInvestigationID(undefined); void loadInbox();
        } else if (payload.state === 'failed' || payload.state === 'cancelled') {
          setError('The investigation stopped before a response could be produced. Its durable event trail remains available.'); setActiveInvestigationID(undefined); void loadInbox();
        } else {
			attempts = 0;
          eventTimerRef.current = window.setTimeout(() => { void poll(); }, 700);
        }
      } catch (cause) {
        if (!controller.signal.aborted && attempts++ < 3) {
			eventTimerRef.current = window.setTimeout(() => { void poll(); }, 700 * 2 ** attempts);
		} else if (!controller.signal.aborted) setEventsError(cause instanceof Error ? cause.message : 'The durable event trail is temporarily unavailable.');
      }
    };
    void poll();
  };

  useEffect(() => () => { eventAbortRef.current?.abort(); if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current); }, []);

  useEffect(() => {
    if (!activePlanID) return;
    const controller = new AbortController();
    let timer: number | undefined;
    let after = 0;
    let attempts = 0;
    const poll = async () => {
      try {
        const [snapshotResponse, eventsResponse] = await Promise.all([
		  fetch(`/api/cms/admin/operator/plans/${activePlanID}`, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal }),
		  fetch(`/api/cms/admin/operator/plans/${activePlanID}/events?after=${after}`, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal }),
        ]);
        if (!snapshotResponse.ok || !eventsResponse.ok) throw new Error('The plan lifecycle is temporarily unavailable.');
		const snapshot = operatorPlanSchema.parse(await snapshotResponse.json()) as OperatorPlan & { verified_effects?: OperatorPlanEffects };
		const stream = operatorPlanEventResponseSchema.parse(await eventsResponse.json()) as OperatorPlanEventResponse;
        if (controller.signal.aborted) return;
        after = Number.isInteger(stream.next_sequence) ? stream.next_sequence : after;
        setPlan(snapshot);
        setPlanEffects(snapshot.verified_effects);
        setPlanEvents((previous) => [...previous, ...(Array.isArray(stream.events) ? stream.events : []).filter((event) => !previous.some((saved) => saved.sequence === event.sequence))]);
        if (['succeeded', 'failed', 'blocked', 'cancelled'].includes(snapshot.state)) {
			if (snapshot.verified_effects && !invalidatedPlansRef.current.has(snapshot.id)) {
				invalidatedPlansRef.current.add(snapshot.id);
				for (const root of queryRootsForAffectedDomains(snapshot.verified_effects.affected_domains ?? [])) void queryClient.invalidateQueries({ queryKey: [root] });
			}
		} else { attempts = 0; timer = window.setTimeout(() => { void poll(); }, 1000); }
      } catch (cause) {
        if (!controller.signal.aborted && attempts++ < 3) timer = window.setTimeout(() => { void poll(); }, 1000 * 2 ** attempts);
		else if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'The plan lifecycle is temporarily unavailable.');
      }
    };
    void poll();
    return () => { controller.abort(); if (timer) window.clearTimeout(timer); };
  }, [activePlanID, queryClient]);

  const run = async () => {
	setError(undefined); setEventsError(undefined); setResult(undefined); setEvents([]); setPlan(undefined); setPlanEvents([]); setPlanEffects(undefined); setActiveInvestigationID(undefined);
    const parsed = operatorVisibleContextSchema.safeParse(visibleContext);
    if (!parsed.success || !message.trim()) { setError('Choose a valid typed scope and enter a concrete question before starting.'); return; }
    if (!parsed.data.available_intents.includes(intent)) { setError('This route does not admit that investigation intent.'); return; }
    setPending(true);
    try {
		const detectedLocale: 'en' | 'ar' = /[\u0600-\u06ff]/.test(message) ? 'ar' : locale;
		if (!activeThreadID) setLocale(detectedLocale);
		else if (threads.find((thread) => thread.id === activeThreadID)?.locale !== detectedLocale) await updateThreadLocale(activeThreadID, detectedLocale);
		const threadID = activeThreadID ?? await createThread(message, detectedLocale);
		const started = operatorInvestigationStartSchema.parse(await cmsClient.post<unknown>('/admin/operator/investigations', { visible_context: parsed.data, intent, locale: detectedLocale, message, tier: 'fast', thread_id: threadID })) as OperatorStart;
      setActiveInvestigationID(started.investigation_id);
      window.setTimeout(() => { void loadEvents(started.investigation_id); }, 200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The investigation could not be started.');
    } finally { setPending(false); }
  };

  const prepareAction = async () => {
    if (!result || !action || actionTargetIDs.length !== 1) return;
	setActionPending(true); setError(undefined);
    try {
		const next = operatorPlanSchema.parse(await cmsClient.post<unknown>('/admin/operator/plans', { investigation_id: result.investigation_id, tool_key: action.toolKey, target_ids: actionTargetIDs })) as OperatorPlan;
      setPlan(next); setPlanEvents([]); setPlanEffects(undefined); setConfirmation('');
    } catch (cause) {
      setError(operatorErrorMessage(cause, 'CMS could not prepare this registered action from fresh evidence.'));
    } finally { setActionPending(false); }
  };

  const approveAction = async () => {
    if (!plan) return;
    setActionPending(true); setError(undefined);
		try { setPlan(operatorPlanSchema.parse(await cmsClient.post<unknown>(`/admin/operator/plans/${plan.id}/approve`, { confirmation })) as OperatorPlan); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'CMS could not approve this exact plan.'); }
    finally { setActionPending(false); }
  };

  const cancelPlan = async () => {
    if (!plan) return;
    setActionPending(true); setError(undefined);
		try { setPlan(operatorPlanSchema.parse(await cmsClient.post<unknown>(`/admin/operator/plans/${plan.id}/cancel`)) as OperatorPlan); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'CMS could not cancel this plan in its registered window.'); }
    finally { setActionPending(false); }
  };

  const markRead = async (id: string) => {
    try { await cmsClient.post(`/admin/operator/inbox/${id}/read`); await loadInbox(); } catch { /* Inbox remains safely unread. */ }
  };

	const cancelInvestigation = async () => {
		if (!activeInvestigationID) return;
		try { await cmsClient.post(`/admin/operator/investigations/${activeInvestigationID}/cancel`); eventAbortRef.current?.abort(); setActiveInvestigationID(undefined); void loadInbox(); }
		catch (cause) { setError(cause instanceof Error ? cause.message : 'The investigation could not be cancelled in its current state.'); }
	};

	if (capabilityLoading) return <main className="mx-auto max-w-3xl py-8" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><Card><CardHeader><CardTitle>{copy.launcher}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{locale === 'ar' ? 'جارٍ التحقق من عناصر تحكم CMS…' : 'Checking CMS controls…'}</p></CardContent></Card></main>;
	if (!available) return <main className="mx-auto max-w-3xl py-8" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><Card><CardHeader><CardTitle>{copy.launcher}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{capability ? (locale === 'ar' ? 'تم تعطيل قراءات المشغّل بواسطة عنصر تحكم CMS مستقل.' : 'Operator reads are disabled by an independent CMS control.') : (locale === 'ar' ? 'لا يمكن التحقق من عناصر تحكم CMS حالياً. مساحة المشغّل للقراءة فقط حتى تعود الحالة.' : 'CMS controls cannot be verified right now. Operator remains unavailable until status is restored.')}</p></CardContent></Card></main>;
	return <main className="mx-auto max-w-7xl space-y-5 py-1" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid gap-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-6 text-slate-50 md:grid-cols-[1fr_auto] md:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300"><Sparkles className="size-3.5" />{copy.evidenceWorkspace}</div><h1 className="text-3xl font-semibold tracking-tight">{copy.launcher}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{copy.evidenceWorkspaceDescription}</p></div><div className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-xs text-slate-300"><div className="font-medium text-slate-50">{copy.scopeCurrentPage}</div><div className="mt-1">{localizedScopeLabel(scope, locale)} · {visibleContext.view.replaceAll('_', ' ')}</div></div></div>
      <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
		<div className="space-y-3">
          <label htmlFor="operator-scope" className="text-sm font-medium">{locale === 'ar' ? 'نطاق التحقيق' : 'Investigation scope'}</label>
          <select id="operator-scope" value={scope.domain} onChange={(event) => { setStoredContext(undefined); setScopeDomain(event.target.value); setSubjectID(''); setExplicitTarget(''); setPlan(undefined); setDomainTool(''); setEligibleActions([]); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{workspaceScopes.map((item) => <option key={item.domain} value={item.domain}>{localizedScopeLabel(item, locale)}</option>)}</select>
          {eligibleActions.length ? <select aria-label="CMS eligible action" value={domainTool || eligibleActions[0].key} onChange={(event) => setDomainTool(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{eligibleActions.map((candidate) => <option key={candidate.key} value={candidate.key}>{candidate.localized_action_key.replace('operator.action.', '').replaceAll('_', ' ')}</option>)}</select> : result ? <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لم تُرجع CMS إجراءً آمناً ومؤهلاً لهذا السياق.' : 'CMS found no safe eligible action for this context.'}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2"><Input aria-label={copy.subjectType} value={subjectType} onChange={(event) => { setStoredContext(undefined); setSubjectType(event.target.value); }} placeholder={copy.subjectType} /><Input aria-label={copy.subjectIdentifier} value={subjectID} onChange={(event) => { setStoredContext(undefined); setSubjectID(event.target.value); }} placeholder={locale === 'ar' ? 'معرّف موضوع اختياري' : 'Optional subject ID'} /></div>
          <Input aria-label={copy.exactActionTarget} dir="ltr" value={explicitTarget} onChange={(event) => { setStoredContext(undefined); setExplicitTarget(event.target.value); }} placeholder={locale === 'ar' ? 'هدف صريح مسجل فقط' : 'Exact registered target only'} />
          <p className="text-xs leading-5 text-muted-foreground">{locale === 'ar' ? 'يجب أن يكون الهدف معرّفاً صريحاً واحداً. قد تساعد المرشحات في التحقيق، لكنها لا تصبح اختياراً لإجراء.' : 'A target is always one explicit ID. Filters can help an investigation, but cannot become an action selection.'}</p>
        </div>
        <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-medium">{copy.questionLabel}</label><label className="flex items-center gap-2 text-xs text-muted-foreground"><Languages className="size-3.5" /><select aria-label={copy.responseLanguage} value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'ar')} className="rounded border bg-background px-2 py-1 text-foreground"><option value="en">English</option><option value="ar">العربية</option></select></label></div><div className="flex flex-wrap gap-2">{intents.map((item) => <Button key={item} size="sm" variant={intent === item ? 'default' : 'outline'} disabled={!visibleContext.available_intents.includes(item)} onClick={() => setIntent(item)}>{({ explain: copy.intentExplain, investigate: copy.intentInvestigate, recommend: copy.intentRecommend, resolve: copy.intentResolve, compare: copy.intentCompare })[item]}</Button>)}</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={8000} className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" aria-label={copy.questionAriaLabel} /><p className="text-xs text-muted-foreground">{copy.dataNotice} {copy.factsAuthoritative}</p><Button onClick={run} disabled={pending || !message.trim()} className="w-full">{pending ? copy.collectingEvidence : copy.startInvestigation}</Button></div>
      </div>
    </section>
    {error ? <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertTriangle className="size-4 shrink-0" />{error}</div> : null}
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        {activeInvestigationID ? <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><Clock3 className="mt-0.5 size-5 text-sky-700" /><div className="flex-1"><p className="font-medium">{locale === 'ar' ? 'قبل CMS هذه المهمة الدائمة.' : 'CMS accepted this durable task.'}</p><p className="mt-1 text-xs">{locale === 'ar' ? 'يمكنك مغادرة الصفحة؛ تستمر المهمة بشكل مستقل.' : 'You may leave this page; the task continues independently.'} <span className="font-mono" dir="ltr">{activeInvestigationID}</span></p></div><Button variant="outline" size="sm" onClick={cancelInvestigation}>{locale === 'ar' ? 'إلغاء المهمة' : 'Cancel task'}</Button></div> : null}
		{result ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">{result.degraded ? <AlertTriangle className="size-4 text-amber-500" /> : <CheckCircle2 className="size-4 text-emerald-600" />}{locale === 'ar' ? 'نتيجة التحقيق' : 'Investigation result'}</CardTitle><p className="text-xs text-muted-foreground">{locale === 'ar' ? 'حزمة الأدلة' : 'Evidence packet'} <span dir="ltr">{result.packet_fingerprint.slice(0, 12)}…</span> · {result.degraded ? copy.degraded : (locale === 'ar' ? 'استدلال متحقق منه' : 'Validated reasoning')}</p></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 text-xs text-sky-950"><ShieldCheck className="mr-1 inline size-3.5" />{locale === 'ar' ? 'النطاق المحدد:' : 'Highlighted scope:'} {visibleContext.subjects.map((subject) => `${subject.type}:${subject.id}`).join(', ')}{actionTargetIDs.length ? ` · ${locale === 'ar' ? 'الهدف الصريح' : 'exact target'} ${actionTargetIDs.join(', ')}` : ''}</div>{result.blocks.map((block, index) => <div key={`${block.kind}-${index}`} className="rounded-lg border p-4"><div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><FileSearch className="size-3.5" />{localizedBlockKind(block.kind, locale)}</div><p className="text-sm leading-6" dir="auto">{block.text}</p>{block.evidence_ids?.length ? <p className="mt-2 text-xs text-muted-foreground">{locale === 'ar' ? 'الأدلة:' : 'Evidence:'} <span dir="ltr">{block.evidence_ids.join(', ')}</span></p> : null}</div>)}
		{action && visibleContext.available_intents.includes('resolve') ? <section className="border-t pt-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{locale === 'ar' ? 'إجراء مسجّل' : 'Registered action'}</div><p className="mt-1 text-sm" dir="ltr">{action.toolKey}</p></div>{!plan ? <Button size="sm" onClick={prepareAction} disabled={actionPending || actionTargetIDs.length !== 1}>{visibleContext.domain === 'operator' ? localizedGovernanceAction(action.toolKey, action.label, locale) : action.label}</Button> : null}</div>{actionTargetIDs.length !== 1 ? <p className="mt-2 text-xs text-amber-700">{locale === 'ar' ? 'حدّد هدفاً صريحاً واحداً قبل تجهيز الإجراء.' : 'Set one exact target above before preparing this action.'}</p> : null}{plan ? <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium" dir="ltr">{plan.tool_key}</p><p className="text-xs text-muted-foreground">{locale === 'ar' ? 'الهدف' : 'Target'} <span dir="ltr">{plan.canonical_plan.target_ids.join(', ')}</span> · {locale === 'ar' ? 'إثبات' : 'proof'} <span dir="ltr">{plan.digest.slice(0, 12)}…</span></p></div><span className="text-xs font-semibold uppercase tracking-wide text-sky-800">{localizedLifecycle(plan.state, locale)}</span></div>{plan.state === 'awaiting_approval' ? <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input aria-label="Action confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={plan.confirmation_phrases?.[locale === 'ar' ? 1 : 0] ?? (locale === 'ar' ? 'اكتب أوافق' : 'Type APPROVE')} /><Button onClick={approveAction} disabled={actionPending || !plan.confirmation_phrases?.includes(confirmation)}>{plan.risk_tier === 'high_impact' ? copy.confirmationHighImpact : copy.confirmationRoutine}</Button><Button variant="outline" onClick={cancelPlan} disabled={actionPending}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Button></div> : null}{plan.state === 'queued' || plan.state === 'claimed' || plan.state === 'running' || plan.state === 'verifying' ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sky-200 pt-3"><p className="text-xs text-sky-900">{locale === 'ar' ? 'يتولى CMS هذا التنفيذ الموقّع ويتحقق من النتيجة بصورة دائمة.' : 'CMS owns this signed execution and verifies the outcome durably.'}</p><Button variant="outline" onClick={cancelPlan} disabled={actionPending || plan.state !== 'queued'}>{locale === 'ar' ? 'إلغاء قبل البدء' : 'Cancel before start'}</Button></div> : null}{planEvents.length ? <p className="mt-3 text-xs text-muted-foreground">{locale === 'ar' ? 'دورة الحياة:' : 'Lifecycle:'} {planEvents.slice(-4).map((event) => localizedLifecycle(event.event_type, locale)).join(' · ')}</p> : null}{planEffects?.verified ? <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-950"><span className="font-medium">{locale === 'ar' ? 'تم تسجيل الآثار المتحقق منها.' : 'Verified effects recorded.'}</span>{planEffects.deep_links?.map((href) => <Link key={href} href={href} className="ml-2 underline">{locale === 'ar' ? 'فتح السجل المتأثر' : 'Open affected record'}</Link>)}</div> : null}</div> : null}</section> : null}
          {result.recommendations.length ? <section className="border-t pt-4"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.recommendations}</div><p className="mt-1 text-xs text-muted-foreground">{copy.recommendationsDescription}</p><div className="mt-2 grid gap-2 md:grid-cols-2">{result.recommendations.map((recommendation, index) => <Link key={recommendation.id} href={recommendation.deep_link} className="rounded-lg border p-3 transition-colors hover:bg-muted"><div className="text-xs font-medium uppercase tracking-wide text-sky-700">{index === 0 ? copy.primaryRecommendation : `${copy.secondaryRecommendation} ${index}`}</div><div className="mt-1 text-sm font-medium">{recommendation.title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground" dir="auto">{recommendation.summary}</p>{recommendation.manual_only ? <span className="mt-2 inline-block text-xs font-medium text-amber-700">{copy.manualOnly}</span> : null}</Link>)}</div></section> : null}
          {result.recommendations.length ? <section className="border-t pt-4"><p className="text-xs text-muted-foreground">{locale === 'ar' ? 'تتطلب ملاحظات التوصيات دائماً خطة CMS موقعة.' : 'Recommendation feedback always creates a signed CMS plan.'}</p><div className="mt-2 flex flex-wrap gap-2">{result.recommendations.filter((recommendation) => !recommendation.manual_only).map((recommendation) => <Button key={recommendation.id} size="sm" variant="outline" onClick={() => { setStoredContext(undefined); setScopeDomain('operator'); setDomainTool(''); setEligibleActions([]); setExplicitTarget(recommendation.id); setPlan(undefined); }}>{locale === 'ar' ? 'فتح إجراءات التوصية المؤهلة' : 'Open eligible recommendation actions'}</Button>)}</div></section> : null}
          <section className="border-t pt-4"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.durableTrail}</div>{eventsError ? <p className="mt-2 text-xs text-amber-700">{eventsError}</p> : <ol className="mt-2 flex flex-wrap gap-2">{events.map((event) => <li key={event.sequence} className="rounded-full border px-2 py-1 text-xs"><span className="mr-1 text-muted-foreground">{event.sequence}</span>{localizedLifecycle(event.event_type, locale)}</li>)}</ol>}</section>
        </CardContent></Card> : <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><Bot className="mt-0.5 size-5 text-sky-700" /><p>{copy.emptyWorkspace}</p></div>}
      </div>
      <aside className="space-y-5">
        <Card><CardHeader><CardTitle className="text-base">{locale === 'ar' ? 'المحادثات' : 'Threads'}</CardTitle><p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لغة كل محادثة محفوظة في CMS.' : 'Each thread’s locale is stored by CMS.'}</p></CardHeader><CardContent className="space-y-2">{threads.length ? threads.slice(0, 8).map((thread) => <div key={thread.id} className={`rounded-lg border p-2 text-xs ${activeThreadID === thread.id ? 'border-sky-500 bg-sky-50' : ''}`}><button className="w-full text-left" onClick={() => { setActiveThreadID(thread.id); setLocale(thread.locale); }}><span className="block truncate font-medium">{thread.title}</span><span className="mt-1 block text-muted-foreground">{thread.locale === 'ar' ? 'العربية' : 'EN'} · <span dir="ltr">{thread.id.slice(0, 8)}</span></span></button><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => { void updateThreadLocale(thread.id, thread.locale === 'ar' ? 'en' : 'ar'); }}>{thread.locale === 'ar' ? 'EN' : 'ع'}</Button><Button size="sm" variant="outline" onClick={() => { void deleteThread(thread.id); }}>{locale === 'ar' ? 'حذف' : 'Delete'}</Button></div></div>) : <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لا توجد محادثات بعد.' : 'No threads yet.'}</p>}<Button variant="outline" size="sm" className="w-full" onClick={() => { void createThread('', locale); }}>{locale === 'ar' ? 'محادثة جديدة' : 'New thread'}</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">{locale === 'ar' ? 'صندوق المهام' : 'Task inbox'}</CardTitle><p className="text-xs text-muted-foreground">{locale === 'ar' ? `سجل مرتبط بالمنشئ · ${inbox.unread_count ?? 0} غير مقروء` : `Creator-bound history · ${inbox.unread_count ?? 0} unread`}</p></CardHeader><CardContent className="space-y-2">{inbox.items?.length ? inbox.items.map((item) => <button key={item.id} onClick={() => { void markRead(item.id); void loadEvents(item.id); }} className="w-full rounded-lg border p-3 text-left text-xs transition-colors hover:bg-muted"><div className="flex justify-between gap-2"><span className="font-medium">{localizedLifecycle(item.state, locale)}</span><span>{item.locale === 'ar' ? 'العربية' : 'EN'}</span></div><div className="mt-1 truncate font-mono text-[10px] text-muted-foreground" dir="ltr">{item.id}</div></button>) : <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لا توجد تحقيقات دائمة بعد.' : 'No durable investigations yet.'}</p>}<Button variant="outline" size="sm" className="w-full" onClick={() => { void loadInbox(); }}>{locale === 'ar' ? 'تحديث الصندوق' : 'Refresh inbox'}</Button></CardContent></Card>
		<Card><CardHeader><CardTitle className="text-base">{locale === 'ar' ? 'الحوكمة' : 'Governance'}</CardTitle><p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لا توقف عناصر التحكم المستقلة التنفيذ أو التحقق أو الإلغاء أو التراجع الحتمي.' : 'Independent stops never cancel deterministic execution, verification, cancellation, or rollback.'}</p></CardHeader><CardContent className="space-y-2 text-xs">{controls ? <><div className="grid grid-cols-2 gap-2">{Object.entries(controls.controls ?? {}).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean').map(([key, enabled]) => <div key={key} className="rounded border p-2"><span className="block text-muted-foreground">{localizedControlLabel(key, locale)}</span><span className={enabled ? 'text-emerald-700' : 'text-amber-700'}>{enabled ? (locale === 'ar' ? 'مفعّل' : 'enabled') : (locale === 'ar' ? 'معطّل' : 'disabled')}</span></div>)}</div><p className={controls.spend?.interactive ? 'text-amber-700' : 'text-muted-foreground'}>{controls.spend?.interactive ? (locale === 'ar' ? 'تحذير الإنفاق التفاعلي مفعّل.' : 'Interactive soft-spend warning is active.') : (locale === 'ar' ? 'تحذير الإنفاق التفاعلي واضح.' : 'Interactive soft-spend warning is clear.')}</p></> : <p className="text-muted-foreground">{governanceLoading ? (locale === 'ar' ? 'جارٍ تحميل عناصر التحكم…' : 'Loading governance controls…') : (locale === 'ar' ? 'عناصر التحكم غير متاحة.' : 'Governance controls unavailable.')}</p>}<Button variant="outline" size="sm" className="w-full" onClick={() => { void loadGovernance(); }}>{locale === 'ar' ? 'تحديث الحوكمة' : 'Refresh governance'}</Button></CardContent></Card>
      </aside>
    </div>
  </main>;
}
