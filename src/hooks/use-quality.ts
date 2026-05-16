import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createQualityProfile,
    deleteQualityProfile,
    listQualityProfiles,
    probeContentItem,
    resolveQualityProfile,
    updateQualityProfile,
} from '@/lib/api/cms/quality';
import type {
    QualityProfileInput,
} from '@/types/platform/quality';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

// Phase 7: Quality hooks collapsed to ingest configuration. The rules /
// candidates / re-encode / history / stats / queue-depth hooks were
// removed — re-encoding is now driven by Storage policies.

export const qualityKeys = {
    all: ['quality'] as const,
    profiles: (scope: string) => [...qualityKeys.all, 'profiles', scope] as const,
    resolve: (tenantId: string, sourceType: string) =>
        [...qualityKeys.all, 'resolve', tenantId, sourceType] as const,
};

export function useQualityProfiles(scope: 'all' | 'global' | 'tenant' = 'all') {
    return useQuery({
        queryKey: qualityKeys.profiles(scope),
        queryFn: () => listQualityProfiles(scope),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

/**
 * Preview which profile would apply for a (tenant, source_type) combination.
 * Enabled only when at least one of the two scopes is selected so the widget
 * doesn't fire on every input keystroke.
 */
export function useResolveQualityProfile(
    tenantId: string,
    sourceType: string,
    opts: { enabled?: boolean } = {}
) {
    return useQuery({
        queryKey: qualityKeys.resolve(tenantId, sourceType),
        queryFn: () => resolveQualityProfile({
            tenant_id: tenantId || undefined,
            source_type: sourceType || undefined,
        }),
        enabled: opts.enabled ?? true,
        staleTime: 10_000,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

// Mutations ------------------------------------------------------------------

export function useCreateQualityProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: QualityProfileInput) => createQualityProfile(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Profile created', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Create failed', description: err.message, variant: 'destructive' }),
    });
}

export function useUpdateQualityProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: number; input: QualityProfileInput }) => updateQualityProfile(vars.id, vars.input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Profile updated', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
    });
}

export function useDeleteQualityProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteQualityProfile(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Profile deleted', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
    });
}

export function useProbeItem() {
    return useMutation({
        mutationFn: (id: string) => probeContentItem(id),
        onError: (err: Error) => toast({ title: 'Probe failed', description: err.message, variant: 'destructive' }),
    });
}

// Helper kept for callers that import `formatSavingsBytes` from this module.
export function formatSavingsBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}
