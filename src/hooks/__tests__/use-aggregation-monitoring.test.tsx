import { ReactNode } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import {
    useAggregationSummary,
    useTriggerAggregationJob,
} from '@/hooks/use-aggregation-monitoring';
import {
    fetchAggregationSummary,
    triggerAggregationJob,
} from '@/lib/api/aggregation';
import { toast } from '@/components/ui/toast';

jest.mock('@/lib/api/aggregation', () => ({
    fetchAggregationSummary: jest.fn(),
    triggerAggregationJob: jest.fn(),
    isAggregationConfigured: () => true,
}));

jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}));

const mockFetchAggregationSummary = fetchAggregationSummary as jest.MockedFunction<
    typeof fetchAggregationSummary
>;
const mockTriggerAggregationJob = triggerAggregationJob as jest.MockedFunction<
    typeof triggerAggregationJob
>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
        );
    };
}

describe('useAggregationSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches aggregation summary', async () => {
        mockFetchAggregationSummary.mockResolvedValueOnce({
            health: { status: 'healthy', timestamp: '2026-02-14T00:00:00Z' },
            queues: [],
            totalProcessed: 10,
            totalFailed: 1,
            activeWorkers: 2,
            waitingJobs: 3,
        });

        const { result } = renderHook(() => useAggregationSummary(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockFetchAggregationSummary).toHaveBeenCalledTimes(1);
        expect(result.current.data?.totalProcessed).toBe(10);
    });
});

describe('useTriggerAggregationJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('triggers aggregation job and shows success toast', async () => {
        mockTriggerAggregationJob.mockResolvedValueOnce({
            success: true,
            jobId: 'job-123',
            message: 'Triggered',
        });

        const { result } = renderHook(() => useTriggerAggregationJob(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({
            sourceType: 'RSS',
            url: 'https://example.com/feed.xml',
        });

        expect(mockTriggerAggregationJob).toHaveBeenCalledWith(
            {
                sourceType: 'RSS',
                url: 'https://example.com/feed.xml',
            },
            expect.any(Object)
        );
        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Aggregation job triggered',
                variant: 'success',
            })
        );
    });

    it('shows error toast when trigger fails', async () => {
        mockTriggerAggregationJob.mockRejectedValueOnce(new Error('Request failed'));

        const { result } = renderHook(() => useTriggerAggregationJob(), {
            wrapper: createWrapper(),
        });

        await expect(
            result.current.mutateAsync({
                sourceType: 'RSS',
                url: 'https://example.com/feed.xml',
            })
        ).rejects.toThrow('Request failed');

        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Failed to trigger aggregation job',
                variant: 'destructive',
            })
        );
    });
});
