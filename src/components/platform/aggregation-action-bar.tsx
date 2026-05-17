'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/platform/system-health/confirm-dialog';
import { useAuditedAction } from '@/hooks/use-audited-action';
import { useIsAdmin } from '@/lib/stores/auth';
import { aggregationMonitoringKeys } from '@/hooks/use-aggregation-monitoring';
import { systemHealthKeys } from '@/hooks/use-system-health';
import { purgeQueues, retryFailed, retryPending } from '@/lib/api/aggregation';

export function AggregationActionBar() {
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();

    function invalidate() {
        queryClient.invalidateQueries({ queryKey: aggregationMonitoringKeys.summary() });
        queryClient.invalidateQueries({ queryKey: systemHealthKeys.all });
    }

    const retryFailedAction = useAuditedAction(
        async () => {
            const res = await retryFailed();
            invalidate();
            return res;
        },
        {
            action: 'aggregation.retry_failed',
            targetService: 'aggregation',
            targetResource: 'all-queues',
            successMessage: 'Retried failed jobs',
        }
    );

    const retryPendingAction = useAuditedAction(
        async () => {
            const res = await retryPending();
            invalidate();
            return res;
        },
        {
            action: 'aggregation.retry_pending',
            targetService: 'aggregation',
            targetResource: 'all-queues',
            successMessage: 'Requeued pending jobs',
        }
    );

    const purgeAction = useAuditedAction(
        async () => {
            const res = await purgeQueues({ includeFailed: true });
            invalidate();
            return res;
        },
        {
            action: 'aggregation.purge_queues',
            targetService: 'aggregation',
            targetResource: 'all-queues',
            successMessage: 'Queues purged',
        }
    );

    if (!isAdmin) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => retryFailedAction.run()}
                disabled={retryFailedAction.isPending}
            >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry failed
            </Button>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => retryPendingAction.run()}
                disabled={retryPendingAction.isPending}
            >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry pending
            </Button>

            <ConfirmDialog
                trigger={
                    <Button type="button" variant="destructive" size="sm" disabled={purgeAction.isPending}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Purge all queues
                    </Button>
                }
                title="Purge all queues?"
                description={
                    <span>
                        This removes <strong>all jobs</strong> (waiting, delayed, completed, and failed)
                        from every BullMQ queue. This cannot be undone.
                    </span>
                }
                confirmLabel="Purge queues"
                confirmVariant="destructive"
                onConfirm={async () => {
                    await purgeAction.run();
                }}
            />
        </div>
    );
}
