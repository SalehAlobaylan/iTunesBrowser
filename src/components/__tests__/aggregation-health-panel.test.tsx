import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AggregationHealthPanel } from '@/components/platform/aggregation-health-panel';
import {
    useAggregationSummary,
    useTriggerAggregationJob,
} from '@/hooks/use-aggregation-monitoring';

jest.mock('@/hooks/use-aggregation-monitoring', () => ({
    useAggregationSummary: jest.fn(),
    useTriggerAggregationJob: jest.fn(),
}));

const mockUseAggregationSummary = useAggregationSummary as jest.MockedFunction<
    typeof useAggregationSummary
>;
const mockUseTriggerAggregationJob = useTriggerAggregationJob as jest.MockedFunction<
    typeof useTriggerAggregationJob
>;

describe('AggregationHealthPanel', () => {
    const refetch = jest.fn();
    const mutateAsync = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAggregationSummary.mockReturnValue({
            data: {
                health: { status: 'healthy', timestamp: '2026-02-14T00:00:00Z' },
                queues: [
                    {
                        queue: 'fetch-queue',
                        waiting: 1,
                        active: 2,
                        completed: 10,
                        failed: 0,
                        delayed: 0,
                    },
                ],
                totalProcessed: 10,
                totalFailed: 0,
                activeWorkers: 2,
                waitingJobs: 1,
            },
            isLoading: false,
            isFetching: false,
            isError: false,
            error: null,
            refetch,
        } as unknown as ReturnType<typeof useAggregationSummary>);

        mockUseTriggerAggregationJob.mockReturnValue({
            mutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useTriggerAggregationJob>);
    });

    it('renders summary metrics', () => {
        render(React.createElement(AggregationHealthPanel));
        expect(screen.getByText('Aggregation Monitoring')).toBeInTheDocument();
        expect(screen.getByText('Processed')).toBeInTheDocument();
        expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    });

    it('renders loading state', () => {
        mockUseAggregationSummary.mockReturnValueOnce({
            data: undefined,
            isLoading: true,
            isFetching: false,
            isError: false,
            error: null,
            refetch,
        } as unknown as ReturnType<typeof useAggregationSummary>);
        render(React.createElement(AggregationHealthPanel));
        expect(screen.getByText('Loading aggregation status...')).toBeInTheDocument();
    });

    it('renders error state', () => {
        mockUseAggregationSummary.mockReturnValueOnce({
            data: undefined,
            isLoading: false,
            isFetching: false,
            isError: true,
            error: new Error('Failed to fetch'),
            refetch,
        } as unknown as ReturnType<typeof useAggregationSummary>);
        render(React.createElement(AggregationHealthPanel));
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('refreshes when refresh button is clicked', async () => {
        render(React.createElement(AggregationHealthPanel));
        await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('validates trigger form URL', async () => {
        render(React.createElement(AggregationHealthPanel));
        await userEvent.click(screen.getByRole('button', { name: /trigger job/i }));
        await userEvent.type(
            screen.getByLabelText(/source url/i),
            'not-a-valid-url'
        );
        await userEvent.click(screen.getByRole('button', { name: /^trigger$/i }));
        expect(screen.getByText('Please enter a valid URL.')).toBeInTheDocument();
    });

    it('submits trigger form successfully', async () => {
        mutateAsync.mockResolvedValueOnce({
            success: true,
            message: 'Triggered',
        });

        render(React.createElement(AggregationHealthPanel));
        await userEvent.click(screen.getByRole('button', { name: /trigger job/i }));
        await userEvent.type(
            screen.getByLabelText(/source url/i),
            'https://example.com/feed.xml'
        );
        await userEvent.click(screen.getByRole('button', { name: /^trigger$/i }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                sourceType: 'RSS',
                url: 'https://example.com/feed.xml',
                name: undefined,
            });
        });
    });
});
