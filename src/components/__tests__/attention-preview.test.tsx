import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AttentionPreview } from '@/components/platform/overview/attention-preview';
import type { OpsAttentionItem } from '@/lib/api/cms/operations';

const item = (overrides: Partial<OpsAttentionItem>): OpsAttentionItem =>
    ({
        key: 'k1',
        fingerprint: 'k1',
        system: 'feed-integrity',
        kind: 'episode',
        severity: 'major',
        title: 'For You serving duplicate items',
        detail: 'edge_fy_dup confirmed twice',
        count: 1,
        first_seen: new Date(Date.now() - 30 * 60_000).toISOString(),
        href: '/platform/feed-integrity',
        snoozed: false,
        ...overrides,
    }) as OpsAttentionItem;

describe('AttentionPreview', () => {
    it('renders items with severity badge and deep link', () => {
        render(<AttentionPreview items={[item({})]} isLoading={false} isError={false} onRetry={jest.fn()} />);
        expect(screen.getByText('major')).toBeInTheDocument();
        expect(screen.getByText('feed-integrity')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'For You serving duplicate items' })).toHaveAttribute(
            'href',
            '/platform/feed-integrity',
        );
        expect(screen.getByRole('link', { name: /open operations/i })).toHaveAttribute('href', '/platform/operations');
    });

    it('shows the all-clear empty state', () => {
        render(<AttentionPreview items={[]} isLoading={false} isError={false} onRetry={jest.fn()} />);
        expect(screen.getByText('Nothing needs attention right now.')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /open operations/i })).not.toBeInTheDocument();
    });

    it('shows the error state with a working retry', async () => {
        const onRetry = jest.fn();
        render(<AttentionPreview items={[]} isLoading={false} isError onRetry={onRetry} />);
        expect(screen.getByText('Attention inbox unavailable')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /try again/i }));
        expect(onRetry).toHaveBeenCalled();
    });

    it('renders skeletons while loading', () => {
        render(<AttentionPreview items={[]} isLoading isError={false} onRetry={jest.fn()} />);
        expect(screen.queryByText('Nothing needs attention right now.')).not.toBeInTheDocument();
    });
});
