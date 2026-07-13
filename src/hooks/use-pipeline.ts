import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import { toast } from '@/components/ui/toast';
import {
    fetchStatusCounts,
    bulkStatusChange,
    getPipelineAutopilot,
    updatePipelineAutopilotPolicy,
    runPipelineAutopilotNow,
    pausePipelineAutopilot,
    elevatePipelineAutopilot,
	resetPipelineAutopilotTrust,
    listPipelineAutopilotRuns,
    getPipelineAutopilotRun,
} from '@/lib/api/cms/pipeline';
import { retryPending, retryFailed } from '@/lib/api/aggregation';
import { aggregationMonitoringKeys } from '@/hooks/use-aggregation-monitoring';
import type {
    StatusCounts,
    BulkStatusRequest,
    BulkStatusResponse,
    PipelineAutopilotPolicy,
} from '@/types/platform/pipeline';
import type { RetryResponse } from '@/lib/api/aggregation';

export const pipelineKeys = {
    all: ['pipeline'] as const,
    statusCounts: () => [...pipelineKeys.all, 'status-counts'] as const,
    autopilot: () => [...pipelineKeys.all, 'autopilot'] as const,
    autopilotRuns: (limit: number) => [...pipelineKeys.all, 'autopilot-runs', limit] as const,
    autopilotRun: (id: string) => [...pipelineKeys.all, 'autopilot-run', id] as const,
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

    return useMutation<RetryResponse, Error, { source?: string; ids?: string[]; limit?: number }>({
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

    return useMutation<RetryResponse, Error, { source?: string; ids?: string[]; limit?: number }>({
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

export function usePipelineAutopilot() {
    return useQuery({
        queryKey: pipelineKeys.autopilot(),
        queryFn: getPipelineAutopilot,
        staleTime: 15_000,
        gcTime: 60_000,
        refetchInterval: 30_000,
    });
}

export function usePipelineAutopilotRuns(limit = 20) {
    return useQuery({
        queryKey: pipelineKeys.autopilotRuns(limit),
        queryFn: () => listPipelineAutopilotRuns(limit),
        staleTime: 10_000,
    });
}

export function usePipelineAutopilotRun(id: string | null) {
    return useQuery({
        queryKey: pipelineKeys.autopilotRun(id ?? 'none'),
        queryFn: () => getPipelineAutopilotRun(id as string),
        enabled: !!id,
        staleTime: 10_000,
    });
}

export function useUpdatePipelineAutopilotPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (patch: Partial<PipelineAutopilotPolicy>) =>
            updatePipelineAutopilotPolicy(patch),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pipelineKeys.autopilot() });
            toast({ title: 'Pipeline Autopilot settings saved', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Failed to save Pipeline Autopilot', description: error.message, variant: 'destructive' }),
    });
}

export function useRunPipelineAutopilotNow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: runPipelineAutopilotNow,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
            queryClient.invalidateQueries({ queryKey: aggregationMonitoringKeys.all });
            toast({
                title: 'Pipeline Autopilot run complete',
                description: data.run.summary || data.run.status,
                variant: data.run.status === 'failed' ? 'destructive' : 'success',
            });
        },
        onError: (error: Error) =>
            toast({ title: 'Pipeline Autopilot run failed', description: error.message, variant: 'destructive' }),
    });
}

export function usePausePipelineAutopilot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (minutes: number) => pausePipelineAutopilot(minutes),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.autopilot() }),
        onError: (error: Error) =>
            toast({ title: 'Failed to update Pipeline Autopilot pause', description: error.message, variant: 'destructive' }),
    });
}

export function useElevatePipelineAutopilot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ mode, minutes }: { mode: string; minutes?: number }) =>
            elevatePipelineAutopilot(mode, minutes),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.autopilot() }),
        onError: (error: Error) =>
            toast({ title: 'Failed to update Pipeline Autopilot elevation', description: error.message, variant: 'destructive' }),
    });
}

export function useResetPipelineAutopilotTrust() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resetPipelineAutopilotTrust,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pipelineKeys.autopilot() });
            toast({ title: 'Pipeline trust reset', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Failed to reset Pipeline trust', description: error.message, variant: 'destructive' }),
    });
}
