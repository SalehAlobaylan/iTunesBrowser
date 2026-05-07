import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createQualityProfile,
    createQualityRule,
    deleteQualityProfile,
    deleteQualityRule,
    getQualityStats,
    listQualityCandidates,
    listQualityHistory,
    listQualityProfiles,
    listQualityRules,
    probeContentItem,
    triggerReEncode,
    updateQualityProfile,
    updateQualityRule,
} from '@/lib/api/cms/quality';
import type {
    QualityCandidatesParams,
    QualityProfileInput,
    QualityRuleInput,
    ReEncodeRequest,
} from '@/types/platform/quality';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

export const qualityKeys = {
    all: ['quality'] as const,
    profiles: (scope: string) => [...qualityKeys.all, 'profiles', scope] as const,
    rules: () => [...qualityKeys.all, 'rules'] as const,
    candidates: (p: QualityCandidatesParams) => [...qualityKeys.all, 'candidates', p] as const,
    history: () => [...qualityKeys.all, 'history'] as const,
    stats: () => [...qualityKeys.all, 'stats'] as const,
    probe: (id: string) => [...qualityKeys.all, 'probe', id] as const,
};

export function useQualityProfiles(scope: 'all' | 'global' | 'tenant' = 'all') {
    return useQuery({
        queryKey: qualityKeys.profiles(scope),
        queryFn: () => listQualityProfiles(scope),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useQualityRules() {
    return useQuery({
        queryKey: qualityKeys.rules(),
        queryFn: listQualityRules,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useQualityCandidates(params: QualityCandidatesParams, opts: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: qualityKeys.candidates(params),
        queryFn: () => listQualityCandidates(params),
        enabled: (opts.enabled ?? true) && (params.rule_id !== undefined || params.profile_id !== undefined),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useQualityHistory() {
    return useQuery({
        queryKey: qualityKeys.history(),
        queryFn: () => listQualityHistory(50),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
}

export function useQualityStats() {
    return useQuery({
        queryKey: qualityKeys.stats(),
        queryFn: getQualityStats,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
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

export function useCreateQualityRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: QualityRuleInput) => createQualityRule(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Rule created', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Create failed', description: err.message, variant: 'destructive' }),
    });
}

export function useUpdateQualityRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: number; input: QualityRuleInput }) => updateQualityRule(vars.id, vars.input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Rule updated', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
    });
}

export function useDeleteQualityRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteQualityRule(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qualityKeys.all });
            toast({ title: 'Rule deleted', variant: 'success' });
        },
        onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
    });
}

export function useTriggerReEncode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (req: ReEncodeRequest) => triggerReEncode(req),
        onSuccess: (resp, vars) => {
            if (!vars.dry_run) {
                qc.invalidateQueries({ queryKey: qualityKeys.all });
            }
            toast({
                title: vars.dry_run ? 'Dry run complete' : 'Re-encode enqueued',
                description: `${resp.enqueued} item(s), ~${formatSavingsBytes(resp.estimated_freed_bytes)} estimated savings.`,
                variant: 'success',
            });
        },
        onError: (err: Error) => toast({ title: 'Re-encode failed', description: err.message, variant: 'destructive' }),
    });
}

export function useProbeItem() {
    return useMutation({
        mutationFn: (id: string) => probeContentItem(id),
        onError: (err: Error) => toast({ title: 'Probe failed', description: err.message, variant: 'destructive' }),
    });
}

// Helper — same pattern as formatBytes in use-storage but inlined to avoid the dep
export function formatSavingsBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}
