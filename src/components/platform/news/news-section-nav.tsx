'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
    { label: 'Library', href: '/platform/news' },
    { label: 'Feeds Finding', href: '/platform/news/finding' },
    { label: 'Circulation', href: '/platform/news/circulation' },
];

export function NewsSectionNav() {
    const pathname = usePathname();
    return (
        <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
            {TABS.map((tab) => {
                const active = tab.href === '/platform/news'
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'rounded px-3 py-1.5 text-sm transition-colors',
                            active ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
