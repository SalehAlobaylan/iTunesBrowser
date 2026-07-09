import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import { toast } from '@/components/ui/toast';
import {
    approveTopicProposal,
    createCatalogTopic,
    createTopicCategory,
    deleteCatalogTopic,
    getPreferenceSettings,
    getTopicDrilldown,
    listTopicCatalog,
    listTopicCategories,
    listTopicProposals,
    mergeTopicProposal,
    mineTopics,
    rejectTopicProposal,
    remapTopics,
    updateCatalogTopic,
    updateTopicCategory,
    updatePreferenceSettings,
} from '@/lib/api/cms/topics';
import type {
    ApproveProposalPayload,
    CatalogFilters,
    CatalogTopic,
    CategoryPayload,
    PreferenceSettings,
    ProposalStatus,
} from '@/types/platform/topics';

export const topicKeys = {
    all: ['topics'] as const,
    catalog: (filters?: CatalogFilters) => [...topicKeys.all, 'catalog', filters ?? {}] as const,
    drilldown: (id: string) => [...topicKeys.all, 'drilldown', id] as const,
    categories: () => [...topicKeys.all, 'categories'] as const,
    proposals: (status: ProposalStatus) => [...topicKeys.all, 'proposals', status] as const,
    settings: () => [...topicKeys.all, 'settings'] as const,
};

const err = (title: string) => (e: Error) =>
    toast({ title, description: e.message, variant: 'destructive' });

export function useTopicCatalog(filters?: CatalogFilters) {
    return useQuery({
        queryKey: topicKeys.catalog(filters),
        queryFn: () => listTopicCatalog(filters),
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useTopicDrilldown(id: string | null) {
    return useQuery({
        queryKey: topicKeys.drilldown(id ?? ''),
        queryFn: () => getTopicDrilldown(id as string),
        enabled: !!id,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useTopicCategories() {
    return useQuery({
        queryKey: topicKeys.categories(),
        queryFn: listTopicCategories,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useTopicProposals(status: ProposalStatus = 'pending') {
    return useQuery({
        queryKey: topicKeys.proposals(status),
        queryFn: () => listTopicProposals(status),
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function usePreferenceSettings() {
    return useQuery({
        queryKey: topicKeys.settings(),
        queryFn: async () => (await getPreferenceSettings()).data,
        staleTime: CACHE_CONFIG.lists.staleTime,
    });
}

export function useCreateCatalogTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CatalogTopic>) => createCatalogTopic(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Topic created', variant: 'success' });
        },
        onError: err('Failed to create topic'),
    });
}

export function useUpdateCatalogTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CatalogTopic> }) => updateCatalogTopic(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Topic updated', variant: 'success' });
        },
        onError: err('Failed to update topic'),
    });
}

export function useDeleteCatalogTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCatalogTopic(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Topic deleted', variant: 'success' });
        },
        onError: err('Failed to delete topic'),
    });
}

export function useCreateTopicCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CategoryPayload) => createTopicCategory(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.categories() });
            toast({ title: 'Category created', variant: 'success' });
        },
        onError: err('Failed to create category'),
    });
}

export function useUpdateTopicCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: CategoryPayload }) => updateTopicCategory(slug, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.categories() });
            toast({ title: 'Category updated', variant: 'success' });
        },
        onError: err('Failed to update category'),
    });
}

export function useApproveTopicProposal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: ApproveProposalPayload }) => approveTopicProposal(id, data ?? {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Proposal approved', variant: 'success' });
        },
        onError: err('Failed to approve proposal'),
    });
}

export function useRejectTopicProposal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: rejectTopicProposal,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Proposal rejected', variant: 'success' });
        },
        onError: err('Failed to reject proposal'),
    });
}

export function useMergeTopicProposal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, into }: { id: number; into: string }) => mergeTopicProposal(id, into),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: 'Proposal merged', variant: 'success' });
        },
        onError: err('Failed to merge proposal'),
    });
}

export function useMineTopics() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: mineTopics,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: `Mining complete (${res.created} new)`, variant: 'success' });
        },
        onError: err('Mining failed'),
    });
}

export function useRemapTopics() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: remapTopics,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: topicKeys.all });
            toast({ title: `Mapped ${res.mapped_items} items / ${res.mapped_stories} stories`, variant: 'success' });
        },
        onError: err('Remap failed'),
    });
}

export function useUpdatePreferenceSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<PreferenceSettings>) => updatePreferenceSettings(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: topicKeys.settings() });
            toast({ title: 'Personalization settings updated', variant: 'success' });
        },
        onError: err('Failed to update settings'),
    });
}
