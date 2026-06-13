'use client';

import { useMediaSizeStats } from '@/hooks/use-content';
import { formatBytes } from '@/hooks/use-storage';
import { formatNumber } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';

const MEDIA_TYPES_FILTER = 'in:VIDEO,PODCAST';

// Size buckets in display order (keys match the CMS media-size-stats response).
const BUCKET_ORDER = ['<100MB', '100-500MB', '500MB-1GB', '1-2GB', '>2GB', 'untracked'];

export function StorageSummary() {
    const { data, isLoading } = useMediaSizeStats({ type: MEDIA_TYPES_FILTER });

    if (isLoading && !data) {
        return <Skeleton className="h-28 w-full" />;
    }
    if (!data) return null;

    const trackedPct = data.total_count > 0 ? (data.tracked_count / data.total_count) * 100 : 0;
    const maxBucket = Math.max(...BUCKET_ORDER.map((k) => data.size_buckets[k]?.count ?? 0), 1);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Total" value={formatBytes(data.total_bytes)} />
                <MiniStat label="Average" value={formatBytes(data.avg_bytes)} />
                <MiniStat label="Largest" value={formatBytes(data.max_bytes)} />
            </div>

            <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Size tracked</span>
                    <span className="font-mono tabular-nums">
                        {formatNumber(data.tracked_count)} / {formatNumber(data.total_count)}
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-info" style={{ width: `${trackedPct}%` }} />
                </div>
            </div>

            <div className="space-y-1.5">
                {BUCKET_ORDER.map((key) => {
                    const bucket = data.size_buckets[key];
                    const count = bucket?.count ?? 0;
                    return (
                        <div key={key} className="flex items-center gap-2 text-xs">
                            <span className="w-20 shrink-0 text-muted-foreground">{key}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-gold"
                                    style={{ width: `${(count / maxBucket) * 100}%` }}
                                />
                            </div>
                            <span className="w-10 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                                {formatNumber(count)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-2">
            <div className="truncate text-sm font-semibold tabular-nums">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
    );
}
