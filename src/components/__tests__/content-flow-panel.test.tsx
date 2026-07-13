import { render, screen } from '@testing-library/react';
import React from 'react';
import { ContentFlowPanel } from '@/components/platform/overview/content-flow-panel';
import type { StatusCounts } from '@/types/platform/pipeline';
import type { StorageHealth } from '@/types/platform/storage';

const counts: StatusCounts = { PENDING: 12, PROCESSING: 3, READY: 4200, FAILED: 7, ARCHIVED: 90 };

const storage = {
    state: 'watch',
    score: 80,
    summary: '',
    generated_at: '2026-07-13T00:00:00Z',
    proof: { utilization_pct: 63.4, used_bytes: 1, quota_bytes: 2 },
} as unknown as StorageHealth;

describe('ContentFlowPanel', () => {
    it('renders funnel rows with tone classes', () => {
        render(
            <ContentFlowPanel
                counts={counts}
                countsLoading={false}
                sourcesTotal={42}
                sourcesLoading={false}
                storage={storage}
                storageLoading={false}
            />,
        );
        expect(screen.getByText('4,200')).toBeInTheDocument();
        expect(screen.getByText('7')).toHaveClass('text-destructive');
        expect(screen.getByText('12')).toHaveClass('text-amber-600');
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders storage state, percentage, and bar width', () => {
        render(
            <ContentFlowPanel
                counts={counts}
                countsLoading={false}
                sourcesTotal={42}
                sourcesLoading={false}
                storage={storage}
                storageLoading={false}
            />,
        );
        expect(screen.getByText('watch')).toBeInTheDocument();
        expect(screen.getByText('63%')).toBeInTheDocument();
        expect(screen.getByTestId('storage-utilization-bar')).toHaveStyle({ width: '63.4%' });
    });

    it('shows em dashes when data is missing', () => {
        render(
            <ContentFlowPanel
                counts={undefined}
                countsLoading={false}
                sourcesTotal={undefined}
                sourcesLoading={false}
                storage={undefined}
                storageLoading={false}
            />,
        );
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6);
        expect(screen.queryByTestId('storage-utilization-bar')).not.toBeInTheDocument();
    });
});
