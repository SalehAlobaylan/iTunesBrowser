import {
    LayoutDashboard,
    Rss,
    FileText,
    Brain,
    Shield,
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
            { name: 'Intelligence', href: '/platform/intelligence', icon: Brain },
        ],
    },
    {
        title: 'Admin',
        items: [
            { name: 'Users', href: '/admin/users', icon: Shield },
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
        INTELLIGENCE: '/platform/intelligence',
    },
    ADMIN: {
        USERS: '/admin/users',
    },
} as const;
