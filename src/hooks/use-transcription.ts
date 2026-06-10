import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTranscriptionConfig,
    updateTranscriptionConfig,
    triggerStt,
    bulkCreateTranscriptionJobs,
} from '@/lib/api/cms/transcription';
import type { UpdateTranscriptionConfigRequest } from '@/types/platform/media';
import { contentKeys } from '@/hooks/use-content';
import { toast } from '@/components/ui/toast';

export const transcriptionKeys = {
    config: ['transcription', 'config'] as const,
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
        mutationFn: (ids: string[]) => bulkCreateTranscriptionJobs(ids, true),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
            toast({
                title: 'Bulk STT queued',
                description: `${res.accepted} accepted, ${res.skipped} skipped, ${res.failed} failed`,
                variant: res.failed ? 'default' : 'success',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to queue bulk STT', description: error.message, variant: 'destructive' });
        },
    });
}
