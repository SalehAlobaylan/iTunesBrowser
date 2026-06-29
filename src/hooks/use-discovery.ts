import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    runProfile,
    listSuggestions,
    approveSuggestion,
    rejectSuggestion,
    bulkApproveSuggestions,
    bulkRejectSuggestions,
    listNewsSources,
    suggestProfiles,
    getDiscoveryConfig,
    updateDiscoveryConfig,
    sweepNow,
    buildGraph,
    getAuthorities,
    importYouTubeFeed,
    importYouTubeLinks,
    getMediaSourcesContext,
} from '@/lib/api/cms/discovery';
import type { CreateProfileRequest, UpdateProfileRequest, DiscoveryConfig } from '@/types/platform/discovery';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

export const discoveryKeys = {
    all: ['discovery'] as const,
    profiles: () => [...discoveryKeys.all, 'profiles'] as const,
    suggestions: (profileId?: string, status?: string, category?: string) =>
        [...discoveryKeys.all, 'suggestions', profileId ?? 'all', status ?? 'PENDING', category ?? 'all'] as const,
    sources: (profileId?: string) => [...discoveryKeys.all, 'sources', profileId ?? 'all'] as const,
    mediaSourcesContext: (profile?: string | null, source?: string | null, suggestion?: string | null) =>
        [...discoveryKeys.all, 'media-sources-context', profile ?? 'all', source ?? 'none', suggestion ?? 'none'] as const,
    config: () => [...discoveryKeys.all, 'config'] as const,
};

export function useDiscoveryConfig() {
    return useQuery({
        queryKey: discoveryKeys.config(),
        queryFn: getDiscoveryConfig,
        staleTime: CACHE_CONFIG.details.staleTime,
        gcTime: CACHE_CONFIG.details.gcTime,
    });
}

export function useUpdateDiscoveryConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DiscoveryConfig) => updateDiscoveryConfig(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discoveryKeys.config() });
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Discovery settings saved', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to save settings', description: String(e), variant: 'destructive' }),
    });
}

export function useSweepNow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: sweepNow,
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Discovery started', description: r.message ?? 'Sweeping all interests — suggestions will appear shortly.', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to start discovery', description: String(e), variant: 'destructive' }),
    });
}

export function useBuildGraph() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: buildGraph,
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Building source graph', description: r.message ?? 'Mapping your network — new sources will surface shortly.', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to build graph', description: String(e), variant: 'destructive' }),
    });
}

export function useImportYouTubeFeed() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: ({ raw, profileId }: { raw: unknown; profileId?: string }) => importYouTubeFeed(raw, profileId),
        onSuccess: (r) => {
            invalidate();
            const n = r.imported ?? 0;
            toast({
                title: n > 0 ? `Imported ${n} channel${n === 1 ? '' : 's'}` : 'Nothing to import',
                description: n > 0 ? 'Review them below and approve the ones you want.' : 'No channels were found in the pasted payload.',
                variant: n > 0 ? 'success' : 'destructive',
            });
        },
        onError: (e) => toast({ title: 'Import failed', description: String(e), variant: 'destructive' }),
    });
}

export function useImportYouTubeLinks() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: ({ inputs, profileId }: { inputs: string[]; profileId?: string }) => importYouTubeLinks(inputs, profileId),
        onSuccess: (r) => {
            invalidate();
            const n = r.imported ?? 0;
            toast({
                title: n > 0 ? `Imported ${n} channel${n === 1 ? '' : 's'}` : 'Nothing to import',
                description: n > 0 ? 'Review them below and approve the ones you want.' : 'None of those links resolved to a channel.',
                variant: n > 0 ? 'success' : 'destructive',
            });
        },
        onError: (e) => toast({ title: 'Import failed', description: String(e), variant: 'destructive' }),
    });
}

export function useAuthorities(kind?: string) {
    return useQuery({
        queryKey: [...discoveryKeys.all, 'authorities', kind ?? 'all'] as const,
        queryFn: () => getAuthorities(kind),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useMediaSourcesContext(params?: {
    profile?: string | null;
    source?: string | null;
    suggestion?: string | null;
}) {
    return useQuery({
        queryKey: discoveryKeys.mediaSourcesContext(params?.profile, params?.source, params?.suggestion),
        queryFn: () => getMediaSourcesContext(params),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
    });
}

export function useProfiles() {
    return useQuery({
        queryKey: discoveryKeys.profiles(),
        queryFn: listProfiles,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useCreateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateProfileRequest) => createProfile(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discoveryKeys.profiles() });
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Profile created', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to create profile', description: String(e), variant: 'destructive' }),
    });
}

export function useUpdateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProfileRequest }) => updateProfile(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discoveryKeys.profiles() });
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Profile updated', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to update profile', description: String(e), variant: 'destructive' }),
    });
}

export function useDeleteProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteProfile(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discoveryKeys.profiles() });
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Profile deleted', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to delete profile', description: String(e), variant: 'destructive' }),
    });
}

export function useRunProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => runProfile(id),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
            toast({ title: 'Discovery started', description: res.message ?? 'Sweep queued — suggestions will appear shortly.', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to start discovery', description: String(e), variant: 'destructive' }),
    });
}

export function useSuggestProfiles() {
    return useMutation({
        mutationFn: () => suggestProfiles(),
        onError: (e) => toast({ title: 'Failed to suggest profiles', description: String(e), variant: 'destructive' }),
    });
}

export function useSuggestions(profileId?: string, status: string = 'PENDING', category?: string) {
    return useQuery({
        queryKey: discoveryKeys.suggestions(profileId, status, category),
        queryFn: () => listSuggestions({ profile_id: profileId, status, category, limit: 100 }),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
    });
}

export function useNewsSources(profileId?: string, category?: string) {
    return useQuery({
        queryKey: [...discoveryKeys.sources(profileId), category ?? 'news'] as const,
        queryFn: () => listNewsSources(profileId, category),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        // Reflect run/enable/disable/delete done via the shared source hooks
        // (which invalidate the Sources-page cache, not this one) within ~15s.
        refetchInterval: 15_000,
    });
}

function useInvalidateHub() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'suggestions'] });
        qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'sources'] });
        qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
    };
}

export function useApproveSuggestion() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: (id: string) => approveSuggestion(id),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Source approved', description: 'It is now active and will start ingesting.', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to approve', description: String(e), variant: 'destructive' }),
    });
}

export function useRejectSuggestion() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectSuggestion(id, reason),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Suggestion rejected', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Failed to reject', description: String(e), variant: 'destructive' }),
    });
}

export function useBulkApprove() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: (ids: string[]) => bulkApproveSuggestions(ids),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Sources approved', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Bulk approve failed', description: String(e), variant: 'destructive' }),
    });
}

export function useBulkReject() {
    const invalidate = useInvalidateHub();
    return useMutation({
        mutationFn: (ids: string[]) => bulkRejectSuggestions(ids),
        onSuccess: () => {
            invalidate();
            toast({ title: 'Suggestions rejected', variant: 'success' });
        },
        onError: (e) => toast({ title: 'Bulk reject failed', description: String(e), variant: 'destructive' }),
    });
}
