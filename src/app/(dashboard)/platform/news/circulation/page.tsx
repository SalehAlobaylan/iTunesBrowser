'use client';

import { Activity, RefreshCw } from 'lucide-react';

import { NewsCirculationCard } from '@/components/platform/news/news-circulation-card';
import { NewsSectionNav } from '@/components/platform/news/news-section-nav';
import { Button } from '@/components/ui/button';
import { useRunCirculationNow } from '@/hooks/use-news';
import { cn } from '@/lib/utils';

export default function NewsCirculationPage() {
    const runCirculation = useRunCirculationNow();

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <span className="brand-overline text-news">News Center</span>
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-news" />
                        <h1 className="font-editorial text-3xl font-bold tracking-tight">Circulation</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage story freshness windows, carryover policy, and source cadence for the News feed.
                    </p>
                </div>
                <div className="shrink-0">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => runCirculation.mutate()}
                        disabled={runCirculation.isPending}
                    >
                        <RefreshCw className={cn('mr-1.5 h-4 w-4', runCirculation.isPending && 'animate-spin')} />
                        Run circulation
                    </Button>
                </div>
            </div>

            <NewsSectionNav />
            <NewsCirculationCard />
        </div>
    );
}
