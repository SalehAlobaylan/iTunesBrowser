import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import { toast } from '@/components/ui/toast';
import { fetchStatusCounts, bulkStatusChange } from '@/lib/api/cms/pipeline';
import { retryPending, retryFailed } from '@/lib/api/aggregation';
import { aggregationMonitoringKeys } from '@/hooks/use-aggregation-monitoring';
import type { StatusCounts, BulkStatusRequest, BulkStatusResponse } from '@/types/platform/pipeline';
import type { RetryResponse } from '@/lib/api/aggregation';

export const pipelineKeys = {
    all: ['pipeline'] as const,
    statusCounts: () => [...pipelineKeys.all, 'status-counts'] as const,
};

/**
 * Fetch content status counts with auto-refresh every 15 seconds.
 */
export function useStatusCounts() {
    return useQuery<StatusCounts>({
        queryKey: pipelineKeys.statusCounts(),
        queryFn: fetchStatusCounts,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 15_000,
    });
}

/**
 * Bulk change content item status.
 * Only invalidates caches and shows toast on real executions (not dry-run).
 */
export function useBulkStatusChange() {
    const queryClient = useQueryClient();

    return useMutation<BulkStatusResponse, Error, BulkStatusRequest>({
        mutationFn: bulkStatusChange,
        onSuccess: (response, variables) => {
            // Skip cache invalidation and success toast on dry-run
            if (variables.dry_run) return;

            queryClient.invalidateQueries({ queryKey: pipelineKeys.statusCounts() });
            queryClient.invalidateQueries({ queryKey: ['content'] });
            toast({
                title: 'Status updated',
                description: response.message,
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to update status',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Retry PENDING content items — enqueue media jobs.
 */
export function useRetryPending() {
    const queryClient = useQueryClient();

    return useMutation<RetryResponse, Error, { source?: string; limit?: number }>({
        mutationFn: retryPending,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: pipelineKeys.statusCounts() });
            queryClient.invalidateQueries({ queryKey: aggregationMonitoringKeys.all });
            toast({
                title: 'Pending items queued',
                description: response.message,
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to retry pending items',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Retry FAILED content items — reset to PENDING and re-enqueue.
 */
export function useRetryFailed() {
    const queryClient = useQueryClient();

    return useMutation<RetryResponse, Error, { source?: string; limit?: number }>({
        mutationFn: retryFailed,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: pipelineKeys.statusCounts() });
            queryClient.invalidateQueries({ queryKey: aggregationMonitoringKeys.all });
            toast({
                title: 'Failed items re-queued',
                description: response.message,
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to retry items',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
