import {
    LayoutDashboard,
    Rss,
    FileText,
    Newspaper,
    Radar,
    Video,
    Radio,
    Clapperboard,
    Scissors,
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
            { name: 'Feeds Finding', href: '/platform/news/finding', icon: Radar },
            { name: 'Media Library', href: '/platform/media', icon: Video },
            { name: 'Media Sources', href: '/platform/media/sources', icon: Radio },
            { name: 'Media Finding', href: '/platform/media/finding', icon: Radar },
            { name: 'Atomization', href: '/platform/media/atomization', icon: Scissors },
            { name: 'Media Studio', href: '/platform/media-studio', icon: Clapperboard },
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
        NEWS_FINDING: '/platform/news/finding',
        MEDIA: '/platform/media',
        MEDIA_SOURCES: '/platform/media/sources',
        MEDIA_FINDING: '/platform/media/finding',
        MEDIA_ATOMIZATION: '/platform/media/atomization',
        MEDIA_STUDIO: '/platform/media-studio',
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
