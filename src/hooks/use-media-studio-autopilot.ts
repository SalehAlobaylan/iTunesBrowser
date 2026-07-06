import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getStudioAutopilotInsights,
    getStudioAutopilotRun,
    getStudioAutopilotStatus,
    listStudioAutopilotRuns,
    pauseStudioAutopilot,
    runStudioAutopilotNow,
    updateStudioAutopilotPolicy,
} from '@/lib/api/cms/media-studio-autopilot';
import type { MediaStudioAutopilotPolicy } from '@/types/platform/media-studio-autopilot';
import { toast } from '@/components/ui/toast';

export const studioAutopilotKeys = {
    all: ['media-studio-autopilot'] as const,
    status: () => [...studioAutopilotKeys.all, 'status'] as const,
    insights: () => [...studioAutopilotKeys.all, 'insights'] as const,
    runs: () => [...studioAutopilotKeys.all, 'runs'] as const,
    run: (id: string) => [...studioAutopilotKeys.all, 'run', id] as const,
};

export function useStudioAutopilotStatus() {
    return useQuery({
        queryKey: studioAutopilotKeys.status(),
        queryFn: getStudioAutopilotStatus,
        refetchInterval: 30_000,
    });
}

export function useStudioAutopilotInsights() {
    return useQuery({
        queryKey: studioAutopilotKeys.insights(),
        queryFn: getStudioAutopilotInsights,
        refetchInterval: 30_000,
    });
}

export function useStudioAutopilotRuns(limit = 20) {
    return useQuery({
        queryKey: studioAutopilotKeys.runs(),
        queryFn: () => listStudioAutopilotRuns(limit),
    });
}

export function useStudioAutopilotRun(id: string | null) {
    return useQuery({
        queryKey: studioAutopilotKeys.run(id ?? ''),
        queryFn: () => getStudioAutopilotRun(id as string),
        enabled: !!id,
    });
}

export function useUpdateStudioAutopilotPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<MediaStudioAutopilotPolicy>) =>
            updateStudioAutopilotPolicy(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studioAutopilotKeys.status() });
            toast({ title: 'Studio autopilot policy updated' });
        },
        onError: () => toast({ title: 'Failed to update policy', variant: 'destructive' }),
    });
}

export function useRunStudioAutopilotNow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: runStudioAutopilotNow,
        onSuccess: (detail) => {
            qc.invalidateQueries({ queryKey: studioAutopilotKeys.all });
            toast({ title: `Run ${detail.run.status}`, description: detail.run.summary ?? '' });
        },
        onError: (err: unknown) => {
            const message = (err as { message?: string })?.message ?? 'Run failed';
            toast({ title: 'Run failed', description: message, variant: 'destructive' });
        },
    });
}

export function usePauseStudioAutopilot() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (minutes: number) => pauseStudioAutopilot(minutes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studioAutopilotKeys.status() });
            toast({ title: 'Studio autopilot paused' });
        },
        onError: () => toast({ title: 'Failed to pause', variant: 'destructive' }),
    });
}
