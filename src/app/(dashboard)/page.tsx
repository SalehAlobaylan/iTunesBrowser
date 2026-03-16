'use client';

import Link from 'next/link';
import { Database, FileText, Shield, Activity, ArrowRight, Rss, Video, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AggregationHealthPanel } from '@/components/platform/aggregation-health-panel';
import { isAggregationConfigured } from '@/lib/api/aggregation';
import { useSources } from '@/hooks/use-sources';
import { useContent } from '@/hooks/use-content';

export default function DashboardPage() {
    const { data: sourcesData } = useSources({ page: 1, limit: 1 });
    const { data: contentData } = useContent({ page: 1, limit: 1 });
    const { data: readyData } = useContent({ page: 1, limit: 1, status: 'READY' });
    const { data: failedData } = useContent({ page: 1, limit: 1, status: 'FAILED' });

    const stats = [
        {
            label: 'Total Sources',
            value: sourcesData?.total ?? 0,
            icon: Database,
            href: '/platform/sources',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Content Items',
            value: contentData?.total ?? 0,
            icon: FileText,
            href: '/platform/content',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10',
        },
        {
            label: 'Ready',
            value: readyData?.total ?? 0,
            icon: Activity,
            href: '/platform/content',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            label: 'Failed',
            value: failedData?.total ?? 0,
            icon: Activity,
            href: '/platform/content',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
        },
    ];

    const quickLinks = [
        {
            title: 'Content Sources',
            description: 'Manage RSS feeds, YouTube channels, Telegram channels, and other content ingestion sources.',
            href: '/platform/sources',
            icon: Rss,
            badges: ['RSS', 'YouTube', 'Telegram'],
        },
        {
            title: 'Content Browser',
            description: 'Browse, filter, and manage all ingested content items. Bulk delete, archive, and review.',
            href: '/platform/content',
            icon: Video,
            badges: ['Articles', 'Videos', 'Podcasts'],
        },
        {
            title: 'Admin Users',
            description: 'Manage admin access, roles, and permissions for the Platform Console.',
            href: '/admin/users',
            icon: Shield,
            badges: ['RBAC', 'JWT'],
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                    Overview of your content platform
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.label} href={stat.href}>
                            <Card className="transition-colors hover:border-primary/30">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-semibold tabular-nums">{stat.value.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {isAggregationConfigured() && <AggregationHealthPanel />}

            {/* Quick links */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Card key={link.href} className="group transition-all hover:border-primary/30 hover:shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-base">{link.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <CardDescription className="line-clamp-2">{link.description}</CardDescription>
                                    <div className="flex flex-wrap gap-1.5">
                                        {link.badges.map((badge) => (
                                            <Badge key={badge} variant="secondary" className="text-xs font-normal">
                                                {badge}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="sm" className="group-hover:text-primary -ml-2" asChild>
                                        <Link href={link.href}>
                                            Open
                                            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
