import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import {
    fetchStatusCounts,
    getPipelineAutopilot,
    listPipelineAutopilotRuns,
    getPipelineAutopilotRun,
	getContentStageHealth,
	updateContentStageControl,
	getContentStageQualification,
	getContentStageTrace,
} from '@/lib/api/cms/pipeline';
import type { ContentStageLane, StatusCounts } from '@/types/platform/pipeline';

export const pipelineKeys = {
    all: ['pipeline'] as const,
    statusCounts: () => [...pipelineKeys.all, 'status-counts'] as const,
    autopilot: () => [...pipelineKeys.all, 'autopilot'] as const,
    autopilotRuns: (limit: number) => [...pipelineKeys.all, 'autopilot-runs', limit] as const,
    autopilotRun: (id: string) => [...pipelineKeys.all, 'autopilot-run', id] as const,
	contentStages: () => [...pipelineKeys.all, 'content-stages'] as const,
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

export function useContentStageHealth() {
    return useQuery({ queryKey: pipelineKeys.contentStages(), queryFn: getContentStageHealth, staleTime: 5_000, refetchInterval: 10_000 });
}

export function useContentStageControl() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ lane, schedulingEnabled }: { lane: ContentStageLane; schedulingEnabled: boolean }) =>
            updateContentStageControl(lane, { scheduling_enabled: schedulingEnabled, reason: schedulingEnabled ? 'resumed_from_console' : 'paused_from_console' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.contentStages() }),
    });
}

export function useContentStageQualification() {
    return useMutation({ mutationFn: getContentStageQualification });
}

export function useContentStageTrace() {
    return useMutation({ mutationFn: getContentStageTrace });
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
