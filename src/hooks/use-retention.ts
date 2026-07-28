import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import {
    getRetentionStatus,
    listRetentionHolds,
    listRetentionRunActions,
    listRetentionRuns,
    pauseRetention,
    runRetention,
    updateRetentionPolicy,
} from '@/lib/api/cms/retention';
import type { RetentionPolicy } from '@/types/platform/retention';

export const retentionKeys = {
    all: ['retention'] as const,
    status: () => [...retentionKeys.all, 'status'] as const,
    runs: () => [...retentionKeys.all, 'runs'] as const,
    actions: (runId?: string) => [...retentionKeys.all, 'actions', runId] as const,
    holds: () => [...retentionKeys.all, 'holds'] as const,
};

export function useRetentionStatus() {
    return useQuery({
        queryKey: retentionKeys.status(),
        queryFn: getRetentionStatus,
        staleTime: 15_000,
        refetchInterval: 30_000,
    });
}

export function useRetentionRuns() {
    return useQuery({ queryKey: retentionKeys.runs(), queryFn: listRetentionRuns, staleTime: 15_000 });
}

export function useRetentionRunActions(runId?: string) {
    return useQuery({
        queryKey: retentionKeys.actions(runId),
        queryFn: () => listRetentionRunActions(runId!),
        enabled: Boolean(runId),
        staleTime: 15_000,
    });
}

export function useRetentionHolds() {
    return useQuery({ queryKey: retentionKeys.holds(), queryFn: listRetentionHolds, staleTime: 15_000 });
}

function invalidateRetention(queryClient: ReturnType<typeof useQueryClient>) {
    return queryClient.invalidateQueries({ queryKey: retentionKeys.all });
}

export function useUpdateRetentionPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (patch: Partial<RetentionPolicy>) => updateRetentionPolicy(patch),
        onSuccess: () => {
            invalidateRetention(queryClient);
            toast({ title: 'Retention policy saved', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Policy was not saved', description: error.message, variant: 'destructive' }),
    });
}

export function useRunRetention() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: runRetention,
        onSuccess: (run) => {
            invalidateRetention(queryClient);
            toast({ title: 'Retention observation complete', description: `Verdict: ${run.verdict}`, variant: 'success' });
        },
        onError: (error: Error) =>
            toast({ title: 'Retention run failed', description: error.message, variant: 'destructive' }),
    });
}

export function usePauseRetention() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: pauseRetention,
        onSuccess: () => {
            invalidateRetention(queryClient);
            toast({ title: 'Retention schedule paused', variant: 'success' });
        },
    });
}

