import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import {
    closeExperienceIncident,
    createExperienceSuppression,
    getExperienceMetrics,
    getExperienceStatus,
    listExperienceActions,
    listExperienceIncidents,
    listExperienceRuns,
    listExperienceSuppressions,
    pauseExperienceSchedule,
    revokeExperienceSuppression,
    runExperienceNow,
    updateExperiencePolicy,
} from '@/lib/api/cms/real-experience';
import type { ExperiencePolicy, IncidentCloseReason } from '@/types/platform/real-experience';

export const experienceKeys = {
    all: ['real-experience'] as const,
    status: () => [...experienceKeys.all, 'status'] as const,
    metrics: () => [...experienceKeys.all, 'metrics'] as const,
    runs: () => [...experienceKeys.all, 'runs'] as const,
    incidents: () => [...experienceKeys.all, 'incidents'] as const,
    actions: () => [...experienceKeys.all, 'actions'] as const,
    suppressions: () => [...experienceKeys.all, 'suppressions'] as const,
};

export function useExperienceStatus() {
    return useQuery({ queryKey: experienceKeys.status(), queryFn: getExperienceStatus, staleTime: 15_000, refetchInterval: 30_000 });
}
export function useExperienceMetrics() {
    return useQuery({ queryKey: experienceKeys.metrics(), queryFn: getExperienceMetrics, staleTime: 15_000, refetchInterval: 30_000 });
}
export function useExperienceRuns() {
    return useQuery({ queryKey: experienceKeys.runs(), queryFn: listExperienceRuns, staleTime: 15_000 });
}
export function useExperienceIncidents() {
    return useQuery({ queryKey: experienceKeys.incidents(), queryFn: () => listExperienceIncidents(), staleTime: 15_000, refetchInterval: 30_000 });
}
export function useExperienceActions() {
    return useQuery({ queryKey: experienceKeys.actions(), queryFn: listExperienceActions, staleTime: 15_000 });
}
export function useExperienceSuppressions() {
    return useQuery({ queryKey: experienceKeys.suppressions(), queryFn: listExperienceSuppressions, staleTime: 15_000 });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
    return () => qc.invalidateQueries({ queryKey: experienceKeys.all });
}

export function useUpdateExperiencePolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (patch: Partial<ExperiencePolicy>) => updateExperiencePolicy(patch),
        onSuccess: () => { invalidate(qc)(); toast({ title: 'Real Experience settings saved', variant: 'success' }); },
    });
}
export function useRunExperienceNow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: runExperienceNow,
        onSuccess: (run) => { invalidate(qc)(); toast({ title: 'Evaluation complete', description: run.summary, variant: run.status === 'failed' ? 'destructive' : 'success' }); },
        onError: (e: Error) => toast({ title: 'Evaluation failed', description: e.message, variant: 'destructive' }),
    });
}
export function usePauseExperienceSchedule() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: pauseExperienceSchedule, onSuccess: () => invalidate(qc)() });
}
export function useCloseExperienceIncident() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason_class, notes }: { id: string; reason_class: IncidentCloseReason; notes?: string }) => closeExperienceIncident(id, reason_class, notes),
        onSuccess: () => { invalidate(qc)(); toast({ title: 'Incident closed', variant: 'success' }); },
    });
}
export function useCreateExperienceSuppression() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createExperienceSuppression,
        onSuccess: () => { invalidate(qc)(); toast({ title: 'Suppression created', variant: 'success' }); },
    });
}
export function useRevokeExperienceSuppression() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: revokeExperienceSuppression, onSuccess: () => invalidate(qc)() });
}
