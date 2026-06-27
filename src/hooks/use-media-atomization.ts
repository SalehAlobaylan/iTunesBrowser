import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	    approveAtomizedChapter,
	    getMediaAtomizationOverview,
	    getMediaAtomizationPipeline,
    listMediaAtomizationChapters,
    listMediaAtomizationParents,
    listMediaAtomizationRuns,
    repairMediaAtomizationLeaks,
    rejectAtomizedChapter,
    runMediaAtomizationSweep,
} from '@/lib/api/cms/media-atomization';
import type { AtomizationFilters, MediaAtomizationOverview } from '@/types/platform/media-atomization';
import { toast } from '@/components/ui/toast';

export const mediaAtomizationKeys = {
    all: ['media-atomization'] as const,
	    overview: () => [...mediaAtomizationKeys.all, 'overview'] as const,
	    pipeline: (filters: AtomizationFilters) => [...mediaAtomizationKeys.all, 'pipeline', filters] as const,
    parents: (filters: AtomizationFilters) => [...mediaAtomizationKeys.all, 'parents', filters] as const,
    chapters: (filters: AtomizationFilters) => [...mediaAtomizationKeys.all, 'chapters', filters] as const,
    runs: () => [...mediaAtomizationKeys.all, 'runs'] as const,
};

const activeStatuses = new Set([
    'queued',
    'waiting_media',
    'media_ready',
    'waiting_transcript',
    'transcript_ready',
    'planning',
    'cutting',
    'renditions',
    'children',
    'embedding',
    'embedding_pending',
]);

function overviewPollMs(data?: MediaAtomizationOverview): number {
    const hasActiveParents = data?.parent_status_counts?.some((row) => activeStatuses.has(row.name));
    const hasEmbeddingPending = data?.child_state_counts?.some((row) => row.feed_visibility === 'embedding_pending');
    return hasActiveParents || hasEmbeddingPending ? 5_000 : 60_000;
}

export function useMediaAtomizationOverview() {
    return useQuery({
        queryKey: mediaAtomizationKeys.overview(),
        queryFn: getMediaAtomizationOverview,
        refetchInterval: (query) => overviewPollMs(query.state.data),
        staleTime: 5_000,
    });
}

export function useMediaAtomizationParents(filters: AtomizationFilters) {
    return useQuery({
        queryKey: mediaAtomizationKeys.parents(filters),
        queryFn: () => listMediaAtomizationParents({ ...filters, limit: 80 }),
        refetchInterval: 10_000,
        staleTime: 5_000,
    });
}

export function useMediaAtomizationPipeline(filters: AtomizationFilters) {
    return useQuery({
        queryKey: mediaAtomizationKeys.pipeline(filters),
        queryFn: () => getMediaAtomizationPipeline({ ...filters, limit: 320 }),
        refetchInterval: 5_000,
        staleTime: 5_000,
    });
}

export function useMediaAtomizationChapters(filters: AtomizationFilters) {
    return useQuery({
        queryKey: mediaAtomizationKeys.chapters(filters),
        queryFn: () => listMediaAtomizationChapters({ ...filters, limit: 80 }),
        refetchInterval: filters.review === 'needed' || filters.review === 'embedding_pending' ? 5_000 : 60_000,
        staleTime: 5_000,
    });
}

export function useMediaAtomizationRuns() {
    return useQuery({
        queryKey: mediaAtomizationKeys.runs(),
        queryFn: () => listMediaAtomizationRuns({ limit: 30 }),
        refetchInterval: 5_000,
        staleTime: 5_000,
    });
}

export function useApproveAtomizedChapter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveAtomizedChapter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({ title: 'Chapter approved', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Approval failed', description: error.message, variant: 'destructive' });
        },
    });
}

export function useRejectAtomizedChapter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectAtomizedChapter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({ title: 'Chapter rejected', variant: 'success' });
        },
        onError: (error: Error) => {
            toast({ title: 'Rejection failed', description: error.message, variant: 'destructive' });
        },
    });
}

export function useRepairMediaAtomizationLeaks() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: repairMediaAtomizationLeaks,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({
                title: 'Atomization invariants repaired',
                description: `${result.updated_count} item${result.updated_count === 1 ? '' : 's'} changed. ${result.remaining_count} visible duration issue${result.remaining_count === 1 ? '' : 's'} remaining.`,
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Repair failed', description: error.message, variant: 'destructive' });
        },
    });
}

export function useRunMediaAtomizationSweep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: runMediaAtomizationSweep,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: mediaAtomizationKeys.all });
            toast({
                title: 'Atomization sweep queued',
                description: result.message ?? (result.jobId ? `Job ${result.jobId}` : 'Transcript-ready parents will be checked.'),
                variant: 'success',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Sweep failed', description: error.message, variant: 'destructive' });
        },
    });
}
