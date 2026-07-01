import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getStorageHealth,
    getStoragePolicy,
    getStoragePreview,
    getStorageRecommendations,
    getStorageStats,
    listStorageArtifactEvents,
    listPolicyOverrides,
    listStorageCandidates,
    listSweepRuns,
    purgeStorage,
    reconcileStorage,
    restoreStorageItem,
    runSweepNow,
    updateStoragePolicy,
    deletePolicyOverride,
} from '@/lib/api/cms/storage';
import type {
    PurgeRequest,
    StorageCandidatesParams,
    UpdatePolicyRequest,
} from '@/types/platform/storage';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';
import { getStorageOperations } from '@/lib/api/cms/storage-ops';

export const storageKeys = {
    all: ['storage'] as const,
    stats: () => [...storageKeys.all, 'stats'] as const,
    health: () => [...storageKeys.all, 'health'] as const,
    recommendations: () => [...storageKeys.all, 'recommendations'] as const,
    artifactEvents: (limit: number) => [...storageKeys.all, 'artifact-events', limit] as const,
    preview: () => [...storageKeys.all, 'preview'] as const,
    candidates: (params: StorageCandidatesParams) =>
        [...storageKeys.all, 'candidates', params] as const,
    policy: (scope: 'global' | 'tenant') =>
        [...storageKeys.all, 'policy', scope] as const,
    overrides: () => [...storageKeys.all, 'overrides'] as const,
    sweepRuns: () => [...storageKeys.all, 'sweep-runs'] as const,
    operations: (days: number) => [...storageKeys.all, 'operations', days] as const,
};

export function useStorageOperations(days = 30) {
    return useQuery({
        queryKey: storageKeys.operations(days),
        queryFn: () => getStorageOperations(days),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useStorageStats(options: { paused?: boolean } = {}) {
    return useQuery({
        queryKey: storageKeys.stats(),
        queryFn: getStorageStats,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: options.paused ? false : 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useStorageHealth(options: { paused?: boolean } = {}) {
    return useQuery({
        queryKey: storageKeys.health(),
        queryFn: getStorageHealth,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: options.paused ? false : 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useStorageRecommendations() {
    return useQuery({
        queryKey: storageKeys.recommendations(),
        queryFn: getStorageRecommendations,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useStorageArtifactEvents(limit = 25) {
    return useQuery({
        queryKey: storageKeys.artifactEvents(limit),
        queryFn: () => listStorageArtifactEvents(limit),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
}

export function useStoragePreview() {
    return useQuery({
        queryKey: storageKeys.preview(),
        queryFn: getStoragePreview,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useStorageCandidates(
    params: StorageCandidatesParams = {},
    options: { enabled?: boolean } = {}
) {
    return useQuery({
        queryKey: storageKeys.candidates(params),
        queryFn: () => listStorageCandidates(params),
        enabled: options.enabled ?? true,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useStoragePolicy(scope: 'global' | 'tenant' = 'tenant') {
    return useQuery({
        queryKey: storageKeys.policy(scope),
        queryFn: () => getStoragePolicy(scope),
        staleTime: CACHE_CONFIG.details.staleTime,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

export function usePolicyOverrides() {
    return useQuery({
        queryKey: storageKeys.overrides(),
        queryFn: listPolicyOverrides,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useSweepRuns() {
    return useQuery({
        queryKey: storageKeys.sweepRuns(),
        queryFn: () => listSweepRuns(50),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
}

export function useUpdateStoragePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdatePolicyRequest) => updateStoragePolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.all });
            toast({
                title: 'Policy saved',
                description: 'Storage circulation policy updated.',
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Failed to save policy',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function useDeletePolicyOverride() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tenantId: string) => deletePolicyOverride(tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.all });
            toast({
                title: 'Override removed',
                description: 'Tenant-specific policy override deleted.',
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Failed to delete override',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function usePurgeStorage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (req: PurgeRequest) => purgeStorage(req),
        onSuccess: (resp, vars) => {
            if (!vars.dry_run) {
                queryClient.invalidateQueries({ queryKey: storageKeys.all });
            }
            toast({
                title: vars.dry_run ? 'Dry run complete' : 'Purge complete',
                description: `${resp.deleted_count} items, ${formatBytes(resp.freed_bytes)} freed.`,
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Purge failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function useRestoreStorageItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => restoreStorageItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.all });
            toast({
                title: 'Restore enqueued',
                description: 'Aggregation will re-fetch the item shortly.',
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Restore failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function useRunSweepNow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: runSweepNow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: storageKeys.all });
            toast({
                title: 'Sweep enqueued',
                description: 'Storage sweep will run shortly.',
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Sweep failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function useReconcileStorage() {
    return useMutation({
        mutationFn: reconcileStorage,
        onSuccess: (out) => {
            toast({
                title: out.partial ? 'Reconcile completed partially' : 'Reconcile complete',
                description: `${out.orphan_count} orphan keys, ${out.missing_count} missing objects. Scanned ${out.scanned_object_count ?? 'unknown'} objects.`,
                variant: out.partial ? 'default' : 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Reconcile failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}
