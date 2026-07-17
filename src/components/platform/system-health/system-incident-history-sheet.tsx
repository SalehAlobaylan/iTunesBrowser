'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSystemIncidentEpisode,
  useSystemIncidentEpisodes,
} from '@/hooks/use-system-autopilot';

function allowedHref(value?: string) {
  return value === '/platform/system-health' ? value : null;
}

export function SystemIncidentHistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const episodesQuery = useSystemIncidentEpisodes(50);
  const detailQuery = useSystemIncidentEpisode(open ? selected : null);
  const episodes = episodesQuery.data?.items ?? [];
  const detail = detailQuery.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-5 sm:max-w-2xl"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>System Health incident history</SheetTitle>
        </SheetHeader>
        {episodesQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}
        {episodesQuery.isError ? (
          <p className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
            Incident history could not be loaded.
          </p>
        ) : null}
        <div className="space-y-2">
          {episodes.map((episode) => (
            <button
              key={episode.id}
              type="button"
              onClick={() =>
                setSelected(selected === episode.id ? null : episode.id)
              }
              className="w-full rounded-md border p-3 text-left hover:bg-muted/40"
            >
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    episode.status === 'open'
                      ? 'destructive'
                      : episode.status === 'recovering'
                        ? 'warning'
                        : 'outline'
                  }
                >
                  {episode.status}
                </Badge>
                {episode.shadow ? (
                  <Badge variant="secondary">shadow</Badge>
                ) : null}
                <span className="text-sm font-medium">
                  {episode.root_service}
                </span>
              </div>
              <p className="mt-2 text-sm">{episode.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {episode.verdict} · last seen{' '}
                {new Date(episode.last_seen_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
        {selected ? (
          <section className="mt-5 space-y-3">
            <h3 className="text-sm font-semibold">Incident detail</h3>
            {detailQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : detailQuery.isError || !detail ? (
              <p className="text-sm text-destructive">
                Incident detail could not be loaded.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {detail.episode.root_cause_hint || detail.episode.summary}
                </p>
                {allowedHref(detail.recommended_action?.href) ? (
                  <a
                    className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={detail.recommended_action.href}
                  >
                    {detail.recommended_action.label}
                  </a>
                ) : detail.recommended_action ? (
                  <p className="text-sm text-muted-foreground">
                    {detail.recommended_action.label}
                  </p>
                ) : null}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Transitions
                  </h4>
                  <div className="space-y-2">
                    {(detail.episode.timeline ?? []).map((entry, index) => (
                      <p
                        key={`${entry.at}-${index}`}
                        className="rounded-md border p-2 text-xs"
                      >
                        <strong>{entry.transition}</strong> ·{' '}
                        {new Date(entry.at).toLocaleString()}
                        <br />
                        {entry.summary || entry.verdict}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Action ledger
                  </h4>
                  <div className="space-y-2">
                    {detail.actions.map((action) => (
                      <p
                        key={action.id}
                        className="rounded-md border p-2 text-xs"
                      >
                        <strong>{action.action}</strong> · {action.status}
                        <br />
                        {action.reason || action.guardrail || action.target}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
