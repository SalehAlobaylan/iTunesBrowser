import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import { toast } from '@/components/ui/toast';
import {
    fetchAggregationSummary,
    isAggregationConfigured,
    triggerAggregationJob,
} from '@/lib/api/aggregation';
import type {
    AggregationSummary,
    TriggerAggregationJobRequest,
    TriggerAggregationJobResponse,
} from '@/types/platform/aggregation';

export const aggregationMonitoringKeys = {
    all: ['aggregation-monitoring'] as const,
    summary: () => [...aggregationMonitoringKeys.all, 'summary'] as const,
};

export function useAggregationSummary() {
    return useQuery({
        queryKey: aggregationMonitoringKeys.summary(),
        queryFn: fetchAggregationSummary,
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
        refetchInterval: 30_000,
        enabled: isAggregationConfigured(),
    });
}

export function useTriggerAggregationJob() {
    const queryClient = useQueryClient();

    return useMutation<
        TriggerAggregationJobResponse,
        Error,
        TriggerAggregationJobRequest
    >({
        mutationFn: triggerAggregationJob,
        onSuccess: (response) => {
            queryClient.invalidateQueries({
                queryKey: aggregationMonitoringKeys.summary(),
            });
            toast({
                title: 'Aggregation job triggered',
                description: response.message,
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to trigger aggregation job',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export type { AggregationSummary };
