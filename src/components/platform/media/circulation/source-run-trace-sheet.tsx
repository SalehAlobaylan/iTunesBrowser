'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/format';
import { useMediaSourceRunTrace } from '@/hooks/use-media-circulation';
import type { MediaSourceRunTrace } from '@/types/platform/media-circulation';

function StateBadge({ children }: { children: string }) {
    return <Badge variant="outline" className="font-normal">{children.replace(/_/g, ' ')}</Badge>;
}

function TimelineSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <div className="mt-2 space-y-2">{children}</div>
        </section>
    );
}

function EmptyEvidence({ children }: { children: string }) {
    return <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{children}</p>;
}

function TraceContents({ trace }: { trace: MediaSourceRunTrace }) {
    const { request } = trace;
    const truncated = Object.values(trace.truncation).some(Boolean);
    return (
        <div className="space-y-5 pb-6">
            {truncated ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">This is a bounded diagnostic view; one or more high-volume timelines are truncated. No missing row is treated as absent evidence.</div> : null}
            <TimelineSection title="Request">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{request.source_name || 'Unnamed media source'}</span>
                        <StateBadge>{request.state}</StateBadge>
                        <StateBadge>{request.evidence_state}</StateBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {request.lane} · {request.purpose} · requested {formatRelativeTime(request.requested_at)}
                    </p>
                    {request.failure_summary ? <p className="mt-2 text-xs text-destructive">{request.failure_summary}</p> : null}
                </div>
            </TimelineSection>

            <TimelineSection title={`Fenced attempts (${trace.attempts.length})`}>
                {trace.attempts.length ? trace.attempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">Attempt {attempt.number}</span><StateBadge>{attempt.state}</StateBadge></div>
                        {attempt.failure_summary ? <p className="mt-1 text-destructive">{attempt.failure_summary}</p> : null}
                    </div>
                )) : <EmptyEvidence>No attempt was authorized for this request.</EmptyEvidence>}
            </TimelineSection>

            <TimelineSection title={`Execution units (${trace.units.length})`}>
                {trace.units.length ? trace.units.map((unit) => (
                    <div key={unit.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{unit.unit_type.replace(/_/g, ' ')}</span><StateBadge>{unit.state}</StateBadge></div>
                        <p className="mt-1 text-muted-foreground">
                            {unit.page_id ? `page ${unit.page_id}` : unit.batch_id ? `batch ${unit.batch_id}` : 'supervisory unit'}
                            {unit.terminal_outcome ? ` · ${unit.terminal_outcome}` : ''}
                            {unit.verification_required ? ' · verification required' : ''}
                        </p>
                    </div>
                )) : <EmptyEvidence>No execution unit has been manifested.</EmptyEvidence>}
            </TimelineSection>

            <TimelineSection title={`Immutable receipts (${trace.receipts.length})`}>
                {trace.receipts.length ? trace.receipts.slice(0, 16).map((receipt) => (
                    <div key={receipt.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{receipt.stage.replace(/_/g, ' ')}</span><StateBadge>{receipt.outcome}</StateBadge></div>
                        <p className="mt-1 text-muted-foreground">
                            {receipt.event_type.replace(/_/g, ' ')} · sequence {receipt.sequence} · observed {formatRelativeTime(receipt.observed_at)}
                        </p>
                    </div>
                )) : <EmptyEvidence>No durable receipt has reached CMS yet.</EmptyEvidence>}
            </TimelineSection>

            <TimelineSection title={`Verification (${trace.verification_tasks.length})`}>
                {trace.verification_tasks.length ? trace.verification_tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{task.stage.replace(/_/g, ' ')}</span><StateBadge>{task.state}</StateBadge>{task.terminal_verdict ? <StateBadge>{task.terminal_verdict}</StateBadge> : null}</div>
                        <p className="mt-1 text-muted-foreground">{task.evidence_boundary} · observation {task.attempt_count}</p>
                    </div>
                )) : <EmptyEvidence>No verification task exists yet.</EmptyEvidence>}
            </TimelineSection>

            <TimelineSection title={`Reconciliation evidence (${trace.reconciliation_events.length})`}>
                {trace.reconciliation_events.length ? trace.reconciliation_events.map((event) => (
                    <div key={event.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{event.stage.replace(/_/g, ' ')}</span><StateBadge>{event.verdict}</StateBadge></div>
                        <p className="mt-1 text-muted-foreground">{event.scope_type.replace(/_/g, ' ')} · observed {formatRelativeTime(event.observed_at)}</p>
                    </div>
                )) : <EmptyEvidence>No independent reconciliation evidence exists yet.</EmptyEvidence>}
            </TimelineSection>

            <TimelineSection title={`CMS-attributed items (${trace.attributed_items.length})`}>
                {trace.attributed_items.length ? trace.attributed_items.map((item) => (
                    <div key={item.id} className="rounded-md border border-border/70 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{item.title || 'Untitled item'}</span><StateBadge>{item.status}</StateBadge></div>
                        <p className="mt-1 text-muted-foreground">{item.type} · {item.is_feed_unit ? 'feed unit' : 'parent'} · {item.feed_visibility}</p>
                    </div>
                )) : <EmptyEvidence>No content item is attributed to this source run.</EmptyEvidence>}
            </TimelineSection>

            <p className="text-xs text-muted-foreground">Receipt payload bytes and queue details are intentionally excluded.</p>
        </div>
    );
}

export function SourceRunTraceSheet({ requestID, onOpenChange }: { requestID: string | null; onOpenChange: (open: boolean) => void }) {
    const trace = useMediaSourceRunTrace(requestID);
    return (
        <Sheet open={Boolean(requestID)} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-xl">
                <SheetHeader className="mb-5 text-left">
                    <SheetTitle>Source-run trace</SheetTitle>
                    <SheetDescription>Bounded CMS evidence from admission through consumer delivery verification.</SheetDescription>
                </SheetHeader>
                {trace.isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading trace…</div> : null}
                {trace.isError ? <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{trace.error.message || 'The CMS trace could not be loaded.'}</div> : null}
                {trace.data ? <TraceContents trace={trace.data} /> : null}
                {trace.data?.request.verified_at ? <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />CMS verification completed {formatRelativeTime(trace.data.request.verified_at)}</div> : null}
            </SheetContent>
        </Sheet>
    );
}
