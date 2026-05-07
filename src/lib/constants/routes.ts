import {
    LayoutDashboard,
    Rss,
    FileText,
    Activity,
    Brain,
    Sparkles,
    Shield,
    HardDrive,
    Sliders,
    type LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

export interface NavigationSection {
    title: string;
    items: NavigationItem[];
}

export const navigation: NavigationSection[] = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Platform',
        items: [
            { name: 'Sources', href: '/platform/sources', icon: Rss },
            { name: 'Content', href: '/platform/content', icon: FileText },
            { name: 'Storage', href: '/platform/storage', icon: HardDrive },
            { name: 'Quality', href: '/platform/quality', icon: Sliders },
            { name: 'Pipeline', href: '/platform/pipeline', icon: Activity },
            { name: 'Intelligence', href: '/platform/intelligence', icon: Brain },
            { name: 'Enrichment', href: '/platform/enrichment', icon: Sparkles },
        ],
    },
    {
        title: 'Admin',
        items: [
            { name: 'Auth Center', href: '/admin/users', icon: Shield },
        ],
    },
];

// Route constants for type-safe navigation
export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/',
    PLATFORM: {
        SOURCES: '/platform/sources',
        CONTENT: '/platform/content',
        STORAGE: '/platform/storage',
        PIPELINE: '/platform/pipeline',
        INTELLIGENCE: '/platform/intelligence',
        ENRICHMENT: '/platform/enrichment',
    },
    ADMIN: {
        USERS: '/admin/users',
    },
} as const;
