import { render, screen } from '@testing-library/react';
import React from 'react';
import { VerdictTile } from '@/components/platform/overview/verdict-tile';

// recharts' ResponsiveContainer requires ResizeObserver, which jsdom lacks.
// The tile's show/hide logic is what's under test, not the chart internals.
jest.mock('@/components/platform/content/monitor/sparkline', () => ({
    Sparkline: () => <div data-testid="sparkline-stub" />,
}));

describe('VerdictTile', () => {
    it('renders title, verdict badge with underscores replaced, and detail', () => {
        render(<VerdictTile href="/platform/operations" title="Autopilot Fleet" verdict="all_clear" detail="16 lanes" />);
        expect(screen.getByText('Autopilot Fleet')).toBeInTheDocument();
        expect(screen.getByText('all clear')).toBeInTheDocument();
        expect(screen.getByText('16 lanes')).toBeInTheDocument();
    });

    it('links to the owning cockpit', () => {
        render(<VerdictTile href="/platform/system-health" title="Services" verdict="healthy" />);
        expect(screen.getByTestId('verdict-tile-Services')).toHaveAttribute('href', '/platform/system-health');
    });

    it('shows a skeleton and no badge while loading', () => {
        render(<VerdictTile href="/x" title="Services" loading />);
        expect(screen.queryByText('unavailable')).not.toBeInTheDocument();
        expect(screen.queryByText('unknown')).not.toBeInTheDocument();
    });

    it('falls back to unavailable on error', () => {
        render(<VerdictTile href="/x" title="AI Spend" isError verdict="within" detail="$5.00" />);
        expect(screen.getByText('unavailable')).toBeInTheDocument();
        expect(screen.getByText('Could not load status.')).toBeInTheDocument();
        expect(screen.queryByText('$5.00')).not.toBeInTheDocument();
    });

    it('treats missing verdict and detail as unavailable', () => {
        render(<VerdictTile href="/x" title="Real Experience" />);
        expect(screen.getByText('unavailable')).toBeInTheDocument();
    });

    const point = (day: string, count: number) => ({ day, count, failed: 0 });

    it('renders a trend sparkline with 2+ points', () => {
        render(<VerdictTile href="/x" title="AI Spend" verdict="within" trend={[point('d1', 1), point('d2', 2), point('d3', 3)]} />);
        expect(screen.getByTestId('verdict-trend-AI Spend')).toBeInTheDocument();
    });

    it('hides the trend under 2 points and when unavailable', () => {
        render(<VerdictTile href="/x" title="AI Spend" verdict="within" trend={[point('d1', 1)]} />);
        expect(screen.queryByTestId('verdict-trend-AI Spend')).not.toBeInTheDocument();

        render(<VerdictTile href="/x" title="Feed Integrity" isError trend={[point('d1', 1), point('d2', 2)]} />);
        expect(screen.queryByTestId('verdict-trend-Feed Integrity')).not.toBeInTheDocument();
    });
});
