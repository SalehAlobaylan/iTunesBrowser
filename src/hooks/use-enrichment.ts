import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEnrichmentStats,
    getMissingEnrichments,
    getEnrichmentHealth,
    triggerEnrichment,
    triggerBatchEnrichment,
} from '@/lib/api/cms/enrichment';
import type { MissingEnrichmentsParams } from '@/types/platform/enrichment';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

// ── Query Keys ──────────────────────────────────────────────

export const enrichmentKeys = {
    all: ['enrichment'] as const,
    stats: () => [...enrichmentKeys.all, 'stats'] as const,
    health: () => [...enrichmentKeys.all, 'health'] as const,
    missing: () => [...enrichmentKeys.all, 'missing'] as const,
    missingList: (params: MissingEnrichmentsParams) =>
        [...enrichmentKeys.missing(), params] as const,
};

// ── Hooks ───────────────────────────────────────────────────

export function useEnrichmentStats() {
    return useQuery({
        queryKey: enrichmentKeys.stats(),
        queryFn: getEnrichmentStats,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30 * 1000, // Auto-refresh every 30s
    });
}

export function useEnrichmentHealth() {
    return useQuery({
        queryKey: enrichmentKeys.health(),
        queryFn: getEnrichmentHealth,
        staleTime: 15 * 1000,
        gcTime: 60 * 1000,
        refetchInterval: 30 * 1000,
    });
}

export function useMissingEnrichments(params: MissingEnrichmentsParams = {}) {
    return useQuery({
        queryKey: enrichmentKeys.missingList(params),
        queryFn: () => getMissingEnrichments(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useTriggerEnrichment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, types }: { id: string; types: string[] }) =>
            triggerEnrichment(id, types),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: enrichmentKeys.all });
            const errorCount = data.errors?.length ?? 0;
            if (errorCount > 0) {
                toast({
                    title: 'Enrichment partially completed',
                    description: data.errors.join(', '),
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Enrichment triggered',
                    description: data.results?.join(', ') || 'Processing started',
                    variant: 'success',
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to trigger enrichment',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useTriggerBatchEnrichment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, types }: { ids: string[]; types: string[] }) =>
            triggerBatchEnrichment(ids, types),
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: enrichmentKeys.all });
            const succeeded = results.filter((r) => r.status === 'triggered').length;
            const failed = results.filter((r) => r.status === 'error').length;
            toast({
                title: 'Batch enrichment completed',
                description: `${succeeded} triggered, ${failed} failed`,
                variant: failed > 0 ? 'destructive' : 'success',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Batch enrichment failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
