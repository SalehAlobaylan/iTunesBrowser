import { render, screen } from '@testing-library/react';
import React from 'react';
import { FileText, Database } from 'lucide-react';
import { ContentStatStrip } from '@/components/platform/overview/content-stat-strip';

const stats = [
    { label: 'Content Items', value: 4200, icon: FileText, href: '/platform/content', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Sources', value: 42, icon: Database, href: '/platform/sources', color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

describe('ContentStatStrip', () => {
    it('renders labelled tiles with formatted values and links', () => {
        render(<ContentStatStrip stats={stats} loading={false} />);
        expect(screen.getByText('Content Items')).toBeInTheDocument();
        expect(screen.getByText('4,200')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sources/i })).toHaveAttribute('href', '/platform/sources');
    });

    it('shows skeletons while loading', () => {
        const { container } = render(<ContentStatStrip stats={stats} loading />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        expect(screen.queryByText('4,200')).not.toBeInTheDocument();
    });

    it('falls back to an em dash for missing values', () => {
        render(<ContentStatStrip stats={[{ ...stats[0], value: undefined }]} loading={false} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
