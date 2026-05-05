'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONTENT_STATUS_LABELS } from '@/types/platform/content';
import type { ContentStatus } from '@/types/platform/content';
import type { StatusCounts } from '@/lib/api/cms/content';

interface StatusCountsStripProps {
    counts: StatusCounts | undefined;
    isLoading: boolean;
    activeStatus: 'all' | ContentStatus;
    onSelect: (status: 'all' | ContentStatus) => void;
}

const STATUS_ORDER: ContentStatus[] = [
    'READY',
    'PENDING',
    'PROCESSING',
    'FAILED',
    'ARCHIVED',
];

const STATUS_TONE: Record<ContentStatus, string> = {
    READY: 'border-emerald-500/30 hover:bg-emerald-500/10',
    PENDING: 'border-muted hover:bg-muted/40',
    PROCESSING: 'border-amber-500/30 hover:bg-amber-500/10',
    FAILED: 'border-destructive/30 hover:bg-destructive/10 text-destructive',
    ARCHIVED: 'border-muted hover:bg-muted/40',
};

function formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
}

export function StatusCountsStrip({
    counts,
    isLoading,
    activeStatus,
    onSelect,
}: StatusCountsStripProps) {
    if (isLoading && !counts) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading status counts…
            </div>
        );
    }

    if (!counts) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {STATUS_ORDER.map((status) => {
                const count = counts[status] ?? 0;
                const isActive = activeStatus === status;
                return (
                    <button
                        key={status}
                        type="button"
                        onClick={() => onSelect(isActive ? 'all' : status)}
                        className={cn(
                            'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            STATUS_TONE[status],
                            isActive &&
                                'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                        )}
                    >
                        <span className="font-semibold tabular-nums">
                            {formatCount(count)}
                        </span>
                        <span>{CONTENT_STATUS_LABELS[status]}</span>
                    </button>
                );
            })}
        </div>
    );
}
