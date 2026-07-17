'use client';

import { useState } from 'react';
import {
  Bot,
  History,
  ListTree,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useCloseSystemIncidentEpisode,
  usePauseSystemAutopilotContainment,
  useRunSystemAutopilotNow,
  useSystemAutopilotStatus,
  useUpdateSystemAutopilotPolicy,
} from '@/hooks/use-system-autopilot';
import type {
  SystemAutopilotMode,
  SystemIncidentEpisode,
} from '@/types/platform/system-autopilot';
import { SystemIncidentCloseDialog } from './system-incident-close-dialog';
import { SystemIncidentHistorySheet } from './system-incident-history-sheet';
import { SystemAutopilotRunsSheet } from './system-autopilot-runs-sheet';
import { SystemAutopilotPolicySheet } from './system-autopilot-policy-sheet';

function formatDate(value?: string | null): string {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusVariant(
  status: string
): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'resolved') return 'success';
  if (status === 'recovering') return 'warning';
  if (status === 'open') return 'destructive';
  return 'secondary';
}

function IncidentRow({
  episode,
  onClose,
  isClosing,
  canClose = true,
}: {
  episode: SystemIncidentEpisode;
  onClose: (id: string) => void;
  isClosing: boolean;
  canClose?: boolean;
}) {
  const lastTransition = episode.timeline?.[episode.timeline.length - 1];
  return (
    <div className="flex min-h-[92px] flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(episode.status)}>
            {episode.status}
          </Badge>
          {episode.shadow ? <Badge variant="secondary">shadow</Badge> : null}
          <Badge variant="outline">{episode.root_service}</Badge>
          <span className="text-xs text-muted-foreground">
            {episode.verdict}
          </span>
        </div>
        <p className="text-sm font-medium leading-5">{episode.summary}</p>
        {episode.root_cause_hint ? (
          <p className="text-xs text-muted-foreground">
            {episode.root_cause_hint}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          First seen {formatDate(episode.first_detected_at)} · Last seen{' '}
          {formatDate(episode.last_seen_at)}
        </p>
        {lastTransition ? (
          <p className="text-xs text-muted-foreground">
            Last transition: {lastTransition.transition} ·{' '}
            {formatDate(lastTransition.at)}
          </p>
        ) : null}
      </div>
      {canClose ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={isClosing}
          onClick={() => onClose(episode.id)}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Close
        </Button>
      ) : null}
    </div>
  );
}

export function SystemAutopilotPanel() {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useSystemAutopilotStatus();
  const updatePolicy = useUpdateSystemAutopilotPolicy();
  const runNow = useRunSystemAutopilotNow();
  const pauseContainment = usePauseSystemAutopilotContainment();
  const closeEpisode = useCloseSystemIncidentEpisode();
  const [episodeToClose, setEpisodeToClose] =
    useState<SystemIncidentEpisode | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [runsOpen, setRunsOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const policy = data?.policy;
  const containmentPaused =
    !!policy?.containment_paused_until &&
    new Date(policy.containment_paused_until).getTime() > Date.now();
  const openEpisodes = data?.open_episodes ?? [];
  const recentInactiveEpisodes = (data?.recent_episodes ?? []).filter(
    (episode) => episode.status !== 'open' && episode.status !== 'recovering'
  );
  const latestRunHasEpisodePersistenceError =
    data?.latest_run?.error_class === 'episode_persistence';
  const latestRunReportsMissingEpisode =
    !latestRunHasEpisodePersistenceError &&
    openEpisodes.length === 0 &&
    (data?.recent_episodes ?? []).length === 0 &&
    (data?.latest_run?.headline === 'incident_open' ||
      data?.latest_run?.headline === 'contained');
  const latestRunHadIncidentWork =
    data?.latest_run?.headline === 'incident_open' ||
    data?.latest_run?.headline === 'contained' ||
    latestRunHasEpisodePersistenceError ||
    latestRunReportsMissingEpisode;
  const latestRunSummary = latestRunReportsMissingEpisode
    ? 'Latest run reported incident work, but no incident episode exists. Run a fresh probe or check the run ledger.'
    : data?.latest_run?.summary;

  if (isLoading && !data) {
    return (
      <Card
        className="h-40 animate-pulse"
        aria-label="Loading System Health Autopilot"
      />
    );
  }

  if (isError && !data) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Bot className="h-5 w-5" /> System Health Autopilot unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            {error instanceof Error
              ? error.message
              : 'CMS status could not be loaded.'}
          </span>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5" />
            System Health Autopilot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {latestRunSummary ??
              'CMS-owned incident detection and containment ledger.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={data?.state === 'safe_auto' ? 'success' : 'secondary'}
          >
            {data?.state ?? 'unknown'}
          </Badge>
          {data?.latest_run ? (
            <Badge
              variant={latestRunReportsMissingEpisode ? 'warning' : 'outline'}
            >
              {latestRunReportsMissingEpisode
                ? 'episode_missing'
                : data.latest_run.headline}
            </Badge>
          ) : null}
          {data?.latest_run?.status &&
          data.latest_run.status !== 'completed' ? (
            <Badge
              variant={
                data.latest_run.status === 'failed' ? 'destructive' : 'warning'
              }
            >
              {data.latest_run.status}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
          {isError && data ? (
            <p className="text-xs text-destructive sm:col-span-2">
              Status may be stale:{' '}
              {error instanceof Error
                ? error.message
                : 'latest refresh failed.'}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex h-10 items-center gap-3 rounded-md border px-3">
              <Switch
                id="system-autopilot-enabled"
                checked={policy?.enabled ?? false}
                disabled={!policy || updatePolicy.isPending}
                onCheckedChange={(enabled) => updatePolicy.mutate({ enabled })}
              />
              <Label htmlFor="system-autopilot-enabled" className="text-sm">
                Enabled
              </Label>
            </div>
            <Select
              value={policy?.mode ?? 'observe'}
              disabled={!policy || updatePolicy.isPending}
              onValueChange={(mode) =>
                updatePolicy.mutate({ mode: mode as SystemAutopilotMode })
              }
            >
              <SelectTrigger aria-label="System Health Autopilot mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="observe">Observe</SelectItem>
                <SelectItem value="safe_auto">Safe Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            type="button"
            disabled={runNow.isPending}
            onClick={() => runNow.mutate()}
          >
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
          <Button
            type="button"
            variant={containmentPaused ? 'secondary' : 'outline'}
            disabled={pauseContainment.isPending}
            onClick={() => pauseContainment.mutate(containmentPaused ? 0 : 120)}
          >
            <Pause className="mr-2 h-4 w-4" />
            {containmentPaused ? 'Resume containment' : 'Pause containment'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Incident history
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRunsOpen(true)}
          >
            <ListTree className="mr-2 h-4 w-4" />
            Run ledger
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!policy}
            onClick={() => setPolicyOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Policy
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Cadence</p>
            <p className="text-sm font-medium">
              {policy?.interval_minutes ?? 10} min
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Confirm</p>
            <p className="text-sm font-medium">
              {policy?.confirm_probes ?? 2} probes
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Resolve</p>
            <p className="text-sm font-medium">
              {policy?.resolve_probes ?? 3} probes
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Containment TTL</p>
            <p className="text-sm font-medium">
              {policy?.containment_ttl_minutes ?? 60} min
            </p>
          </div>
        </div>

        {openEpisodes.length ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold">Open incidents</h3>
            </div>
            <div className="space-y-2">
              {openEpisodes.map((episode) => (
                <IncidentRow
                  key={episode.id}
                  episode={episode}
                  isClosing={closeEpisode.isPending}
                  onClose={() => setEpisodeToClose(episode)}
                />
              ))}
            </div>
          </div>
        ) : recentInactiveEpisodes.length ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">No active incidents</h3>
            </div>
            {latestRunHadIncidentWork ? (
              <p className="text-xs text-muted-foreground">
                {latestRunHasEpisodePersistenceError
                  ? 'The latest run detected incident work but could not persist every episode change. Check the run ledger before trusting this as clear.'
                  : 'The latest run recorded incident work, but there is no open episode now. Recent resolved or closed episodes are shown below.'}
              </p>
            ) : null}
            <div className="space-y-2">
              {recentInactiveEpisodes.slice(0, 3).map((episode) => (
                <IncidentRow
                  key={episode.id}
                  episode={episode}
                  isClosing={true}
                  canClose={false}
                  onClose={() => undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {latestRunHadIncidentWork
              ? latestRunHasEpisodePersistenceError
                ? 'No active System Health incidents are visible, but the latest run could not persist every episode change. Check the run ledger before treating this as clear.'
                : latestRunReportsMissingEpisode
                  ? 'No active System Health incidents are visible, but the latest run reported incident work without a matching episode. Run a fresh probe or inspect the run ledger.'
                  : 'No active System Health incidents. The latest incident run did not leave an open episode; check the run ledger if this looks wrong.'
              : 'No open System Health incidents.'}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Containment registry</h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {(data?.registered_autopilots ?? []).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                  <Badge
                    variant={item.containment_enabled ? 'success' : 'secondary'}
                  >
                    {item.containment_enabled ? 'on' : 'opted out'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.dependencies.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Last run {formatDate(data?.latest_run?.started_at)} · Last policy run{' '}
          {formatDate(policy?.last_run_at)}
        </p>
      </CardContent>
      <SystemIncidentCloseDialog
        episode={episodeToClose}
        open={!!episodeToClose}
        pending={closeEpisode.isPending}
        onOpenChange={(open) => !open && setEpisodeToClose(null)}
        onConfirm={(id, reason) =>
          closeEpisode.mutate(
            { id, reason },
            { onSuccess: () => setEpisodeToClose(null) }
          )
        }
      />
      <SystemIncidentHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      <SystemAutopilotRunsSheet open={runsOpen} onOpenChange={setRunsOpen} />
      {policy ? (
        <SystemAutopilotPolicySheet
          policy={policy}
          registered={data?.registered_autopilots ?? []}
          open={policyOpen}
          onOpenChange={setPolicyOpen}
        />
      ) : null}
    </Card>
  );
}
