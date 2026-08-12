'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OperatorLaunchLink } from '@/components/operator/operator-launch-link';
import { useStatusCounts } from '@/hooks/use-pipeline';
import { OPERATOR_CONTRACT_VERSION, type OperatorVisibleContext } from '@/types/platform/operator';

const pipelineContext: OperatorVisibleContext = {
  schema_version: OPERATOR_CONTRACT_VERSION,
  domain: 'pipeline',
  view: 'cockpit',
  filters: {},
  subjects: [{ type: 'tenant', id: 'current' }],
  available_intents: ['explain', 'investigate', 'recommend', 'compare', 'resolve'],
};

// Pipeline recovery is intentionally a diagnostic surface. Exact recovery is
// admitted only from a CMS evidence packet and never from aggregate filters.
export function PipelineOperations() {
  const { data: counts } = useStatusCounts();
  const attention = (counts?.PENDING ?? 0) + (counts?.PROCESSING ?? 0) + (counts?.FAILED ?? 0);

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-sky-600" />
              Evidence-backed recovery
            </CardTitle>
            <CardDescription>
              Pipeline status is visible here. Recovery is previewed, approved, fenced, and verified by CMS for one exact item and stage.
            </CardDescription>
          </div>
          <OperatorLaunchLink context={pipelineContext} intent="investigate" size="sm">
            Investigate pipeline
          </OperatorLaunchLink>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Pipeline status counts">
          {(['PENDING', 'PROCESSING', 'FAILED', 'READY'] as const).map((status) => (
            <Badge key={status} variant={status === 'FAILED' ? 'destructive' : status === 'READY' ? 'success' : 'secondary'}>
              {status.toLowerCase()} {counts?.[status]?.toLocaleString() ?? '—'}
            </Badge>
          ))}
        </div>
        {attention > 0 ? (
          <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <p>Aggregate retries and status resets are disabled. Choose an exact content item in Operator so CMS can derive its last unverified stage and reject live, stale, or ambiguous work.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pipeline backlog is currently reported by the status summary.</p>
        )}
      </CardContent>
    </Card>
  );
}
