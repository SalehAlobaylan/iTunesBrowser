'use client';

import { type ReactNode } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Database,
    HardDrive,
    TrendingUp,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/format';
import { formatBytes } from '@/hooks/use-storage';
import type { ContentStats, MediaSizeStats } from '@/types/platform/content';

import { DeltaBadge } from './delta-badge';
import { Sparkline } from './sparkline';

interface ContentKpiBandProps {
    stats?: ContentStats;
    media?: MediaSizeStats;
    isLoading: boolean;
}

export function ContentKpiBand({ stats, media, isLoading }: ContentKpiBandProps) {
    const byStatus = stats?.by_status ?? {};
    const daily = stats?.daily ?? [];
    const last7 = daily.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const prior7 = daily.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);

    const cards: KpiCardProps[] = [
        {
            label: 'Total content',
            value: formatNumber(stats?.total ?? 0),
            icon: <Database className="h-4 w-4" />,
            tone: 'text-gold',
        },
        {
            label: 'Ready',
            value: formatNumber(byStatus.READY ?? 0),
            icon: <CheckCircle2 className="h-4 w-4" />,
            tone: 'text-success',
        },
        {
            label: 'In pipeline',
            value: formatNumber((byStatus.PROCESSING ?? 0) + (byStatus.PENDING ?? 0)),
            icon: <Clock3 className="h-4 w-4" />,
            tone: 'text-info',
            sub: 'Processing + pending',
        },
        {
            label: 'Failed',
            value: formatNumber(byStatus.FAILED ?? 0),
            icon: <AlertTriangle className="h-4 w-4" />,
            tone: 'text-destructive',
        },
        {
            label: 'Media storage',
            value: media ? formatBytes(media.total_bytes) : '—',
            icon: <HardDrive className="h-4 w-4" />,
            tone: 'text-info',
        },
        {
            label: 'New · last 7d',
            value: formatNumber(last7),
            icon: <TrendingUp className="h-4 w-4" />,
            tone: 'text-gold',
            badge: <DeltaBadge current={last7} previous={prior7} title="vs prior 7 days" />,
            footer: daily.length >= 2 ? <Sparkline daily={daily} width={140} height={24} /> : undefined,
        },
    ];

    if (isLoading && !stats) {
        return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {cards.map((c) => (
                    <Skeleton key={c.label} className="h-[78px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((card) => (
                <KpiCard key={card.label} {...card} />
            ))}
        </div>
    );
}

interface KpiCardProps {
    label: string;
    value: string;
    icon: ReactNode;
    tone: string;
    sub?: string;
    badge?: ReactNode;
    footer?: ReactNode;
}

function KpiCard({ label, value, icon, tone, sub, badge, footer }: KpiCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-2xl font-semibold tabular-nums">{value}</span>
                            {badge}
                        </div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                        {sub ? <div className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</div> : null}
                    </div>
                    <div className={tone}>{icon}</div>
                </div>
                {footer ? <div className="mt-2">{footer}</div> : null}
            </CardContent>
        </Card>
    );
}
