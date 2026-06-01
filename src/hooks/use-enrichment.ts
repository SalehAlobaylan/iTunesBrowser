import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEnrichmentStats,
    getMissingEnrichments,
    getEnrichmentHealth,
    triggerEnrichment,
    triggerBatchEnrichment,
    triggerAllEnrichment,
    getBulkEnrichStatus,
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
    missingCount: (missing: string, type: string) =>
        [...enrichmentKeys.missing(), 'count', missing, type] as const,
    bulkStatus: () => [...enrichmentKeys.all, 'bulk-status'] as const,
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

/**
 * Count of items missing a single artifact, scoped to a content-type filter.
 * Reuses the missing endpoint with limit=1 and reads `.total` — cheap COUNT.
 */
export function useMissingCount(missing: string, type: string, enabled = true) {
    return useQuery({
        queryKey: enrichmentKeys.missingCount(missing, type),
        queryFn: () =>
            getMissingEnrichments({ missing, type, status: 'READY', limit: 1, offset: 0 }),
        select: (data) => data.total,
        enabled,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

/**
 * Live status of the background bulk-enrichment run. Polls every 2s while a
 * run is active, idle otherwise.
 */
export function useBulkEnrichStatus() {
    return useQuery({
        queryKey: enrichmentKeys.bulkStatus(),
        queryFn: getBulkEnrichStatus,
        refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
        staleTime: 0,
        gcTime: 60 * 1000,
    });
}

export function useTriggerAllEnrichment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ types, type, max }: { types: string[]; type?: string; max?: number }) =>
            triggerAllEnrichment(types, type, max),
        onSuccess: (data) => {
            // Start polling the run + reflect that work has begun.
            queryClient.invalidateQueries({ queryKey: enrichmentKeys.bulkStatus() });
            if (data.started) {
                toast({
                    title: 'Bulk enrichment started',
                    description: `Enriching ${data.total} item${data.total === 1 ? '' : 's'} in the background`,
                    variant: 'success',
                });
            } else {
                toast({
                    title: 'Nothing to enrich',
                    description: 'No items are missing this artifact',
                    variant: 'default',
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to start bulk enrichment',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
