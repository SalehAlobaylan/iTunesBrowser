'use client';

import { useState } from 'react';
import { Bot, ListChecks, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OperatorLaunchLink } from '@/components/operator/operator-launch-link';
import { usePipelineAutopilot } from '@/hooks/use-pipeline';
import { PipelineAutopilotRunsSheet } from './autopilot-runs-sheet';
import { OPERATOR_CONTRACT_VERSION, type OperatorVisibleContext } from '@/types/platform/operator';

const pipelineContext: OperatorVisibleContext = {
  schema_version: OPERATOR_CONTRACT_VERSION,
  domain: 'pipeline',
  view: 'cockpit',
  filters: {},
  subjects: [{ type: 'tenant', id: 'current' }],
  available_intents: ['explain', 'investigate', 'recommend', 'compare', 'resolve'],
};

function formatWhen(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// The legacy Pipeline Autopilot is intentionally diagnostics-only. It may
// report candidates and evidence, but cannot queue, reset, or change status.
export function PipelineAutopilotStrip() {
  const { data: autopilot, isLoading } = usePipelineAutopilot();
  const [runsOpen, setRunsOpen] = useState(false);

  if (isLoading) return <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />;
  if (!autopilot) return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Pipeline diagnostics are unavailable.</div>;

  const attention = autopilot.attention ?? [];
  const trust = autopilot.trust ?? [];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Bot className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Pipeline diagnostics</span>
        <Badge variant="outline">{autopilot.state.replace(/_/g, ' ')}</Badge>
        <span className="text-xs text-muted-foreground">
          Last evaluation: {formatWhen(autopilot.last_run?.started_at)} · {attention.length} attention signal{attention.length === 1 ? '' : 's'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setRunsOpen(true)}><ListChecks className="mr-1 size-4" />Runs & ledger</Button>
          <OperatorLaunchLink context={pipelineContext} intent="investigate" size="sm">Investigate</OperatorLaunchLink>
        </div>
      </div>
      {autopilot.recommended_action ? <p className="mt-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">Recommendation:</span> {autopilot.recommended_action}</p> : null}
      {attention.length ? (
        <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <ShieldAlert className="size-4 shrink-0 text-amber-700" />
          <p>Attention remains evidence-only until CMS selects an exact item and stage. Aggregate retries, backlog drains, trust resets, and status transitions are unavailable here.</p>
        </div>
      ) : null}
      {trust.length ? <div className="mt-3 flex flex-wrap gap-1.5">{trust.map((entry) => <Badge key={entry.lane} variant="secondary">{entry.lane.replace(/_/g, ' ')} · {entry.state}</Badge>)}</div> : null}
      <PipelineAutopilotRunsSheet open={runsOpen} onOpenChange={setRunsOpen} />
    </div>
  );
}
