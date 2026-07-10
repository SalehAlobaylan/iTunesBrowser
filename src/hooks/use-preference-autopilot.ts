import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import {
    deleteRecomputeRow,
    getPreferenceAutopilotInsights,
    getPreferenceAutopilotRunActions,
    getPreferenceAutopilotStatus,
    listPreferenceAutopilotActions,
    listPreferenceAutopilotRuns,
    listRecomputeQueue,
    mergeCatalogTopic,
    requeueRecompute,
    resetPreferenceCursors,
    revertAutopilotTopic,
    runPreferenceAutopilotNow,
    updatePreferenceAutopilotPolicy,
} from '@/lib/api/cms/preference-autopilot';
import type {
    PreferenceActionFilters,
    PreferenceAutopilotPolicyPatch,
} from '@/types/platform/preference-autopilot';
import { topicKeys } from '@/hooks/use-topics';

export const prefAutopilotKeys = {
    all: ['preference-autopilot'] as const,
    status: () => [...prefAutopilotKeys.all, 'status'] as const,
    insights: () => [...prefAutopilotKeys.all, 'insights'] as const,
    runs: (limit: number) => [...prefAutopilotKeys.all, 'runs', limit] as const,
    run: (id: string) => [...prefAutopilotKeys.all, 'run', id] as const,
    actions: (filters: PreferenceActionFilters) => [...prefAutopilotKeys.all, 'actions', filters] as const,
    recomputeQueue: () => [...prefAutopilotKeys.all, 'recompute-queue'] as const,
};

export function usePreferenceAutopilotStatus() {
    return useQuery({
        queryKey: prefAutopilotKeys.status(),
        queryFn: getPreferenceAutopilotStatus,
        staleTime: 15_000,
        gcTime: 60_000,
        refetchInterval: 30_000,
    });
}

export function usePreferenceAutopilotRuns(limit = 20) {
    return useQuery({
        queryKey: prefAutopilotKeys.runs(limit),
        queryFn: () => listPreferenceAutopilotRuns(limit),
        staleTime: 10_000,
    });
}

export function usePreferenceAutopilotRunActions(id: string | null) {
    return useQuery({
        queryKey: prefAutopilotKeys.run(id ?? 'none'),
        queryFn: () => getPreferenceAutopilotRunActions(id as string),
        enabled: !!id,
        staleTime: 10_000,
    });
}

export function useUpdatePreferenceAutopilotPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (patch: PreferenceAutopilotPolicyPatch) =>
            updatePreferenceAutopilotPolicy(patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.status() });
            toast({ title: 'Autopilot policy saved', variant: 'success' });
        },
        onError: (error: Error) =>
            toast({
                title: 'Failed to save autopilot policy',
                description: error.message,
                variant: 'destructive',
            }),
    });
}

export function useRunPreferenceAutopilotNow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: runPreferenceAutopilotNow,
        onSuccess: (detail) => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.all });
            qc.invalidateQueries({ queryKey: topicKeys.all });
            const partial = detail.run.status === 'partial';
            toast({
                title: partial ? 'Autopilot run completed with attention needed' : 'Autopilot run complete',
                description: detail.run.summary || detail.run.status,
                variant: detail.run.status === 'failed' ? 'destructive' : partial ? 'default' : 'success',
            });
        },
        onError: (error: Error) =>
            toast({
                title: 'Autopilot run failed',
                description: error.message,
                variant: 'destructive',
            }),
    });
}

// Insights is the heavier read-model (grouped rollups + series). Poll at 60s —
// half the status cadence — per the cheap-status/deeper-insights split.
export function usePreferenceAutopilotInsights() {
    return useQuery({
        queryKey: prefAutopilotKeys.insights(),
        queryFn: getPreferenceAutopilotInsights,
        staleTime: 30_000,
        gcTime: 120_000,
        refetchInterval: 60_000,
    });
}

export function usePreferenceAutopilotActions(filters: PreferenceActionFilters) {
    return useQuery({
        queryKey: prefAutopilotKeys.actions(filters),
        queryFn: () => listPreferenceAutopilotActions(filters),
        staleTime: 15_000,
        placeholderData: keepPreviousData,
    });
}

export function useRecomputeQueue(limit = 50) {
    return useQuery({
        queryKey: prefAutopilotKeys.recomputeQueue(),
        queryFn: () => listRecomputeQueue(limit),
        staleTime: 15_000,
    });
}

export function useRequeueRecompute() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => requeueRecompute(userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.recomputeQueue() });
            toast({ title: 'User queued for recompute', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Requeue failed', description: e.message, variant: 'destructive' }),
    });
}

export function useClearRecomputeRow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => deleteRecomputeRow(userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.recomputeQueue() });
            toast({ title: 'Queue row cleared', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Clear failed', description: e.message, variant: 'destructive' }),
    });
}

export function useResetCursors() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cursors: string[]) => resetPreferenceCursors(cursors),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.status() });
            toast({ title: 'Cursors reset — sweeps restart from the head', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Cursor reset failed', description: e.message, variant: 'destructive' }),
    });
}

export function useRevertAutopilotTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (topicId: string) => revertAutopilotTopic(topicId),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.all });
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({
                title: 'Autopilot topic reverted',
                description: `${res.data.slug} deactivated; its proposal is back in the human queue.`,
                variant: 'success',
            });
        },
        onError: (e: Error) =>
            toast({ title: 'Revert failed', description: e.message, variant: 'destructive' }),
    });
}

export function useMergeCatalogTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sourceId, into }: { sourceId: string; into: string }) =>
            mergeCatalogTopic(sourceId, into),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: prefAutopilotKeys.all });
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({
                title: 'Topics merged',
                description: `${res.data.source} → ${res.data.target} (${res.data.affected_users} users queued)`,
                variant: 'success',
            });
        },
        onError: (error: Error) =>
            toast({
                title: 'Merge failed',
                description: error.message,
                variant: 'destructive',
            }),
    });
}
