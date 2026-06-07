import {
    LayoutDashboard,
    Rss,
    FileText,
    Newspaper,
    Video,
    Activity,
    Brain,
    Sparkles,
    Shield,
    HardDrive,
    Sliders,
    HeartPulse,
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
            { name: 'System Health', href: '/platform/system-health', icon: HeartPulse },
        ],
    },
    {
        title: 'Platform',
        items: [
            { name: 'Sources', href: '/platform/sources', icon: Rss },
            { name: 'Content', href: '/platform/content', icon: FileText },
            { name: 'News', href: '/platform/news', icon: Newspaper },
            { name: 'Media', href: '/platform/media', icon: Video },
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
        NEWS: '/platform/news',
        MEDIA: '/platform/media',
        STORAGE: '/platform/storage',
        PIPELINE: '/platform/pipeline',
        INTELLIGENCE: '/platform/intelligence',
        ENRICHMENT: '/platform/enrichment',
        SYSTEM_HEALTH: '/platform/system-health',
    },
    ADMIN: {
        USERS: '/admin/users',
    },
} as const;
