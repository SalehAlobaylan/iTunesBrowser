'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Flag,
  Loader2,
  ShieldAlert,
  Trash2,
  UserX,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useModerationQueue,
  useRemoveModerationComment,
  useResolveModerationReport,
  useSuspendModerationAuthor,
} from '@/hooks/use-moderation';
import type { ModerationStatus } from '@/types/platform/moderation';

const statuses: Array<ModerationStatus | 'all'> = [
  'open',
  'resolved',
  'dismissed',
  'all',
];

export default function ModerationPage() {
  const [status, setStatus] = useState<ModerationStatus | 'all'>('open');
  const queue = useModerationQueue(status);
  const resolve = useResolveModerationReport();
  const removeComment = useRemoveModerationComment();
  const suspendAuthor = useSuspendModerationAuthor();
  const reports = queue.data?.data ?? [];
  const openCount = status === 'open' ? (queue.data?.total ?? 0) : undefined;

  return (
    <main className="space-y-6 p-6">
      <header className="border-b-2 border-foreground pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="border-2 border-red-600 bg-red-600 p-2 text-white">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Consumer safety desk
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight">
                Moderation queue
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Review user reports. Resolve only after a human decision;
                removing a comment is permanent and is recorded in the CMS audit
                log.
              </p>
            </div>
          </div>
          {openCount !== undefined ? (
            <Badge variant="destructive" className="rounded-none px-3 py-1.5">
              {openCount} open
            </Badge>
          ) : null}
        </div>
      </header>
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {statuses.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={status === entry ? 'default' : 'outline'}
            className="rounded-none capitalize"
            onClick={() => setStatus(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>
      <Card className="rounded-none border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Reports
          </CardTitle>
          <CardDescription>
            Reports do not reveal reporter identities. Suspending an author
            revokes their refresh sessions and immediately invalidates their
            existing CMS access tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="border border-dashed p-10 text-center text-sm text-muted-foreground">
              No {status === 'all' ? '' : status} reports.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <a
                        className="inline-flex items-center gap-1 font-mono text-xs underline"
                        href={
                          report.target_type === 'content'
                            ? `/platform/content/${report.target_id}`
                            : '#'
                        }
                      >
                        {report.target_type}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none">
                        {report.reason.replaceAll('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-pre-wrap text-sm">
                      {report.detail || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === 'open' ? 'destructive' : 'secondary'
                        }
                        className="rounded-none"
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {report.status === 'open' ? (
                          <>
                            <Button
                              size="sm"
                              className="rounded-none"
                              disabled={resolve.isPending}
                              onClick={() =>
                                resolve.mutate({
                                  id: report.id,
                                  status: 'resolved',
                                })
                              }
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none"
                              disabled={resolve.isPending}
                              onClick={() =>
                                resolve.mutate({
                                  id: report.id,
                                  status: 'dismissed',
                                })
                              }
                            >
                              Dismiss
                            </Button>
                          </>
                        ) : null}
                        {report.target_type === 'comment' ? (
                          <>
                            {report.author_id ? (
                              <Button
                                size="icon"
                                variant="outline"
                                className="rounded-none border-red-600 text-red-700 hover:bg-red-50 hover:text-red-800"
                                disabled={suspendAuthor.isPending}
                                onClick={() => {
                                  const nextSuspended =
                                    !report.author_suspended;
                                  if (
                                    window.confirm(
                                      nextSuspended
                                        ? 'Suspend this account? Their refresh sessions will be revoked and active CMS access will stop immediately.'
                                        : 'Restore this account? They will be able to sign in again, but revoked sessions will remain signed out.'
                                    )
                                  ) {
                                    suspendAuthor.mutate({
                                      authorID: report.author_id!,
                                      suspended: nextSuspended,
                                    });
                                  }
                                }}
                                aria-label={
                                  report.author_suspended
                                    ? 'Restore comment author'
                                    : 'Suspend comment author'
                                }
                                title={
                                  report.author_suspended
                                    ? 'Restore account'
                                    : 'Suspend account'
                                }
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="rounded-none"
                              disabled={removeComment.isPending}
                              onClick={() =>
                                removeComment.mutate(report.target_id)
                              }
                              aria-label="Remove comment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
