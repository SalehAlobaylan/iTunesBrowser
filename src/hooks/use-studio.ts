import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getStudio,
    generateChapters,
    saveChapters,
    saveTranscript,
} from '@/lib/api/cms/studio';
import type {
    GenerateChaptersRequest,
    StudioChapter,
    StudioSegment,
} from '@/types/platform/studio';
import { toast } from '@/components/ui/toast';

export const studioKeys = {
    detail: (id: string) => ['studio', id] as const,
};

export function useStudio(id: string) {
    return useQuery({
        queryKey: studioKeys.detail(id),
        queryFn: () => getStudio(id),
        enabled: !!id,
        staleTime: 60_000,
    });
}

export function useGenerateChapters(id: string) {
    return useMutation({
        mutationFn: (req: GenerateChaptersRequest) => generateChapters(id, req),
        onError: (error: Error) => {
            toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
        },
    });
}

export function useSaveChapters(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (chapters: StudioChapter[]) => saveChapters(id, chapters),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studioKeys.detail(id) });
            toast({ title: 'Chapters saved', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to save chapters', description: error.message, variant: 'destructive' });
        },
    });
}

export function useSaveTranscript(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (segments: StudioSegment[]) => saveTranscript(id, segments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studioKeys.detail(id) });
            toast({ title: 'Transcript saved', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to save transcript', description: error.message, variant: 'destructive' });
        },
    });
}
