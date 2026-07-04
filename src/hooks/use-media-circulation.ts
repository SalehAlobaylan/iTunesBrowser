import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    applyMediaCirculationRecommendation,
    createMediaCirculationOverride,
    deleteMediaCirculationOverride,
    dismissMediaCirculationRecommendation,
    generateMediaCirculationRecommendations,
    getMediaCirculationCockpit,
    getMediaCirculationHealth,
    getMediaCirculationPolicy,
    getMediaIntelligenceDiagnostics,
    listMediaCirculationRecommendations,
    listMediaCirculationOverrides,
    revertMediaCirculationRecommendation,
    updateMediaCirculationPolicy,
} from '@/lib/api/cms/media-circulation';
import type {
    MediaCirculationOverrideRequest,
    MediaCirculationPolicy,
    RecommendationUnitType,
} from '@/types/platform/media-circulation';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

export const mediaCirculationKeys = {
    all: ['media-circulation'] as const,
    cockpit: () => [...mediaCirculationKeys.all, 'cockpit'] as const,
    health: () => [...mediaCirculationKeys.all, 'health'] as const,
    policy: () => [...mediaCirculationKeys.all, 'policy'] as const,
    overrides: () => [...mediaCirculationKeys.all, 'overrides'] as const,
    intelligence: () => [...mediaCirculationKeys.all, 'intelligence'] as const,
    recommendations: (unitType: RecommendationUnitType, status: string) =>
        [...mediaCirculationKeys.all, 'recommendations', unitType, status] as const,
};

export function useMediaIntelligenceDiagnostics() {
    return useQuery({
        queryKey: mediaCirculationKeys.intelligence(),
        queryFn: getMediaIntelligenceDiagnostics,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useMediaCirculationCockpit() {
    return useQuery({
        queryKey: mediaCirculationKeys.cockpit(),
        queryFn: getMediaCirculationCockpit,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useMediaCirculationOverrides() {
    return useQuery({
        queryKey: mediaCirculationKeys.overrides(),
        queryFn: listMediaCirculationOverrides,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useMediaCirculationHealth() {
    return useQuery({
        queryKey: mediaCirculationKeys.health(),
        queryFn: getMediaCirculationHealth,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
}

export function useMediaCirculationPolicy() {
    return useQuery({
        queryKey: mediaCirculationKeys.policy(),
        queryFn: getMediaCirculationPolicy,
        staleTime: CACHE_CONFIG.details.staleTime,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

export function useMediaCirculationRecommendations(
    unitType: RecommendationUnitType,
    status: 'pending' | 'all' = 'all'
) {
    return useQuery({
        queryKey: mediaCirculationKeys.recommendations(unitType, status),
        queryFn: () => listMediaCirculationRecommendations({ unit_type: unitType, status }),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useUpdateMediaCirculationPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<MediaCirculationPolicy>) => updateMediaCirculationPolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({
                title: 'Policy saved',
                description: 'Media circulation policy updated.',
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

export function useGenerateMediaCirculationRecommendations() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: generateMediaCirculationRecommendations,
        onSuccess: (resp) => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            const { item_family, source } = resp.data;
            toast({
                title: 'Recommendations generated',
                description: `${item_family.count} evict · ${source.count} intake`,
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({
                title: 'Generation failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}

export function useApplyRecommendation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => applyMediaCirculationRecommendation(id),
        onSuccess: (resp) => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({
                title: 'Recommendation applied',
                description: `Outcome: ${resp.data.outcome ?? 'applied'}`,
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({ title: 'Apply failed', description: err.message, variant: 'destructive' });
        },
    });
}

export function useDismissRecommendation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => dismissMediaCirculationRecommendation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({ title: 'Recommendation dismissed', variant: 'success' });
        },
        onError: (err: Error) => {
            toast({ title: 'Dismiss failed', description: err.message, variant: 'destructive' });
        },
    });
}

export function useRevertRecommendation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => revertMediaCirculationRecommendation(id),
        onSuccess: (resp) => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({
                title: 'Recommendation reverted',
                description: `Outcome: ${resp.data.outcome ?? 'reverted'}`,
                variant: 'success',
            });
        },
        onError: (err: Error) => {
            toast({ title: 'Revert failed', description: err.message, variant: 'destructive' });
        },
    });
}

export function useCreateMediaCirculationOverride() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: MediaCirculationOverrideRequest) => createMediaCirculationOverride(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({ title: 'Override saved', variant: 'success' });
        },
        onError: (err: Error) => {
            toast({ title: 'Override failed', description: err.message, variant: 'destructive' });
        },
    });
}

export function useDeleteMediaCirculationOverride() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMediaCirculationOverride(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaCirculationKeys.all });
            toast({ title: 'Override removed', variant: 'success' });
        },
        onError: (err: Error) => {
            toast({ title: 'Remove failed', description: err.message, variant: 'destructive' });
        },
    });
}
