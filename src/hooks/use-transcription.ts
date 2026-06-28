import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTranscriptionConfig,
    updateTranscriptionConfig,
    triggerStt,
    createTranscriptionBatch,
    getTranscriptionBatch,
    listTranscriptionBatches,
    listTranscriptionJobs,
    cancelTranscriptionBatch,
    repairTranscriptionQualitySweep,
} from '@/lib/api/cms/transcription';
import type { ListTranscriptionBatchesParams, ListTranscriptionJobsParams } from '@/lib/api/cms/transcription';
import type { UpdateTranscriptionConfigRequest } from '@/types/platform/media';
import { contentKeys } from '@/hooks/use-content';
import { mediaAtomizationKeys } from '@/hooks/use-media-atomization';
import { toast } from '@/components/ui/toast';

export const transcriptionKeys = {
    config: ['transcription', 'config'] as const,
    batch: (id: string) => ['transcription', 'batch', id] as const,
    batches: (params?: ListTranscriptionBatchesParams) => ['transcription', 'batches', params] as const,
    jobs: (params?: ListTranscriptionJobsParams) => ['transcription', 'jobs', params] as const,
};

export function useTranscriptionConfig() {
    return useQuery({
        queryKey: transcriptionKeys.config,
        queryFn: () => getTranscriptionConfig(),
        staleTime: 30_000,
    });
}

export function useUpdateTranscriptionConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateTranscriptionConfigRequest) => updateTranscriptionConfig(data),
        onSuccess: (cfg) => {
            queryClient.setQueryData(transcriptionKeys.config, cfg);
            toast({ title: 'STT settings saved', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
        },
    });
}

/**
 * Manual "Enrich with STT" upgrade. Re-runs embeddings downstream (the CMS
 * cascade), so the confirmation dialog warns the operator before calling this.
 */
export function useTriggerStt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => triggerStt(id),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['transcription', 'batches'] });
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({
                title: res.triggered ? 'STT job queued' : 'STT skipped',
                description: res.reason || `Job ${res.job.id}`,
                variant: res.triggered ? 'success' : 'default',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to start STT', description: error.message, variant: 'destructive' });
        },
    });
}

export function useBulkTriggerStt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => createTranscriptionBatch(ids, true),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['transcription', 'batches'] });
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({
                title: 'Bulk STT batch queued',
                description: `${res.total_count} items accepted into batch`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to queue bulk STT', description: error.message, variant: 'destructive' });
        },
    });
}

export function useTranscriptionBatch(id?: string) {
    return useQuery({
        queryKey: id ? transcriptionKeys.batch(id) : ['transcription', 'batch', 'none'],
        queryFn: () => getTranscriptionBatch(id!),
        enabled: !!id,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'queued' || status === 'running' ? 2500 : false;
        },
    });
}

export function useTranscriptionBatches(params?: ListTranscriptionBatchesParams) {
    return useQuery({
        queryKey: transcriptionKeys.batches(params),
        queryFn: () => listTranscriptionBatches(params),
        refetchInterval: (query) => {
            const hasActive = query.state.data?.data.some((batch) => batch.status === 'queued' || batch.status === 'running');
            return hasActive ? 2500 : false;
        },
    });
}

export function useTranscriptionJobs(params?: ListTranscriptionJobsParams) {
    return useQuery({
        queryKey: transcriptionKeys.jobs(params),
        queryFn: () => listTranscriptionJobs(params),
        refetchInterval: params?.status === 'queued' || params?.status === 'running' ? 2500 : false,
    });
}

export function useCancelTranscriptionBatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cancelTranscriptionBatch(id),
        onSuccess: (batch) => {
            queryClient.setQueryData(transcriptionKeys.batch(batch.id), batch);
            queryClient.invalidateQueries({ queryKey: ['transcription', 'batches'] });
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            toast({ title: 'Transcription batch canceled', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to cancel batch', description: error.message, variant: 'destructive' });
        },
    });
}

export function useRepairTranscriptionSweep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (limit?: number) => repairTranscriptionQualitySweep(limit),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['transcription', 'batches'] });
            queryClient.invalidateQueries({ queryKey: ['transcription', 'jobs'] });
            toast({
                title: 'Repair sweep processed',
                description: `${res.accepted} queued · ${res.skipped} skipped · ${res.failed} failed`,
                variant: res.failed > 0 ? 'destructive' : 'success',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Repair sweep failed', description: error.message, variant: 'destructive' });
        },
    });
}
