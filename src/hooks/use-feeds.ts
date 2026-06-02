import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listFeeds, createFeed, updateFeed, deleteFeed } from '@/lib/api/cms/feeds';
import type { CreateFeedRequest, UpdateFeedRequest } from '@/types/platform/feed';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

export const feedKeys = {
    all: ['feeds'] as const,
    list: () => [...feedKeys.all, 'list'] as const,
};

export function useFeeds() {
    return useQuery({
        queryKey: feedKeys.list(),
        queryFn: listFeeds,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}

export function useCreateFeed() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateFeedRequest) => createFeed(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: feedKeys.all });
            toast({ title: 'Feed created', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
    });
}

export function useUpdateFeed() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateFeedRequest }) => updateFeed(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: feedKeys.all });
            toast({ title: 'Feed updated', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
    });
}

export function useDeleteFeed() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteFeed(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: feedKeys.all });
            toast({ title: 'Feed deleted', variant: 'success' });
        },
        onError: (e: Error) =>
            toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
    });
}
