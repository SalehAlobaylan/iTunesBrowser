'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CirclePause, CircleHelp, PlayCircle, TimerReset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type { MediaCirculationSourceScheduleProof, MediaCirculationSourceScheduleProofItem } from '@/types/platform/media-circulation';

const STATE_META: Record<string, { label: string; ar: string; className: string; icon: typeof CalendarClock }> = {
    due_unadmitted: { label: 'Due, no run', ar: 'مستحق بلا تشغيل', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: TimerReset },
    in_flight: { label: 'Run in progress', ar: 'التشغيل جارٍ', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300', icon: PlayCircle },
    scheduled: { label: 'Scheduled', ar: 'مجدول', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: CalendarClock },
    paused: { label: 'Paused', ar: 'متوقف مؤقتاً', className: 'border-border bg-muted/60 text-muted-foreground', icon: CirclePause },
    unknown: { label: 'Schedule unknown', ar: 'الجدول غير معروف', className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300', icon: CircleHelp },
};

function stateMeta(state: string) {
    return STATE_META[state] ?? STATE_META.unknown;
}

function ScheduleRow({ item, onInspect, ar }: { item: MediaCirculationSourceScheduleProofItem; onInspect?: (requestID: string) => void; ar: boolean }) {
    const meta = stateMeta(item.schedule_state);
    const Icon = meta.icon;
    return (
        <li className="border-t border-border/70 py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.source_name || (ar ? 'مصدر وسائط بلا اسم' : 'Unnamed media source')}</p>
                    <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted-foreground" dir="auto">{item.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('gap-1 border', meta.className)}><Icon className="h-3.5 w-3.5" />{ar ? meta.ar : meta.label}</Badge>
                    {item.latest_request_id && onInspect ? <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onInspect(item.latest_request_id as string)}>{ar ? 'التتبع' : 'Trace'}</Button> : null}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {item.next_due_at ? <span>{ar ? 'الاستحقاق التالي' : 'Next due'} {formatRelativeTime(item.next_due_at)}</span> : null}
                {item.last_claimed_at ? <span>{ar ? 'آخر مطالبة' : 'Claimed'} {formatRelativeTime(item.last_claimed_at)}</span> : null}
                {item.last_attempted_at ? <span>{ar ? 'محاولة المزوّد' : 'Provider attempted'} {formatRelativeTime(item.last_attempted_at)}</span> : null}
                {item.last_upstream_observed_at ? <span>{ar ? 'تغيير أعلى المسار' : 'Upstream observed'} {formatRelativeTime(item.last_upstream_observed_at)}</span> : null}
                {item.last_provider_success_at ? <span>{ar ? 'نجاح المزوّد' : 'Provider success'} {formatRelativeTime(item.last_provider_success_at)}</span> : null}
                {item.last_no_change_at ? <span>{ar ? 'آخر نتيجة بلا تغيير' : 'Last no-change'} {formatRelativeTime(item.last_no_change_at)}</span> : null}
                {item.last_delivery_verified_at ? <span>{ar ? 'تحقق Pods' : 'Pods verified'} {formatRelativeTime(item.last_delivery_verified_at)}</span> : null}
                {item.intake_circuit_until ? <span>{ar ? 'دائرة الإدخال حتى' : 'Intake circuit until'} {formatRelativeTime(item.intake_circuit_until)}</span> : null}
            </div>
        </li>
    );
}

export function SourceScheduleProof({ proof, onInspect }: { proof?: MediaCirculationSourceScheduleProof; onInspect?: (requestID: string) => void }) {
	const [ar, setAr] = useState(false);
	useEffect(() => { setAr(document.documentElement.lang.toLowerCase().startsWith('ar')); }, []);
    if (!proof || !proof.available) {
        return (
            <section className="rounded-xl border border-dashed border-border bg-card/40 p-4">
                <p className="text-sm font-semibold">{ar ? 'جدولة المصادر' : 'Source scheduling'}</p>
                <p className="mt-1 text-sm text-muted-foreground" dir="auto">{proof?.unavailable_reason || (ar ? 'لم يقدّم CMS أدلة الجدولة بعد.' : 'The CMS has not provided source scheduling evidence yet.')}</p>
            </section>
        );
    }
    return (
        <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="source-schedule-proof-title" lang={ar ? 'ar' : 'en'} dir={ar ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="brand-overline text-muted-foreground">{ar ? 'حد القبول' : 'Admission boundary'}</p>
                    <h2 id="source-schedule-proof-title" className="mt-1 text-base font-semibold tracking-tight">{ar ? 'جدولة المصادر' : 'Source scheduling'}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{ar ? 'نقاط تحقق CMS قبل بدء عمل المزوّد. المصدر المستحق بلا تشغيل ليس فشلاً للمزوّد تلقائياً.' : 'CMS checkpoints before provider work begins. A due source without a run is not automatically a provider failure.'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{ar ? 'حُدّث' : 'Updated'} {formatRelativeTime(proof.generated_at)}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Count label={ar ? 'مستحق بلا تشغيل' : 'Due, no run'} value={proof.due_unadmitted} className="text-amber-600 dark:text-amber-300" />
                <Count label={ar ? 'جارٍ' : 'In flight'} value={proof.in_flight} className="text-sky-600 dark:text-sky-300" />
                <Count label={ar ? 'مجدول' : 'Scheduled'} value={proof.scheduled} className="text-emerald-600 dark:text-emerald-400" />
                <Count label={ar ? 'متوقف' : 'Paused'} value={proof.paused} className="text-muted-foreground" />
                <Count label={ar ? 'غير معروف' : 'Unknown'} value={proof.unknown} className="text-rose-600 dark:text-rose-300" />
            </div>
            {proof.items.length ? <ul className="mt-4">{proof.items.slice(0, 8).map((item) => <ScheduleRow key={item.source_id} item={item} onInspect={onInspect} ar={ar} />)}</ul> : <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">{ar ? 'لا توجد نقاط تحقق لجدولة مصادر الوسائط بعد.' : 'No media sources have schedule checkpoints yet.'}</p>}
        </section>
    );
}

function Count({ label, value, className }: { label: string; value: number; className: string }) {
    return <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className={cn('mt-0.5 text-xl font-semibold tabular-nums', className)}>{value}</p></div>;
}
