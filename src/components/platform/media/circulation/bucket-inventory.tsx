'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/hooks/use-storage';
import type { MediaCirculationProof } from '@/types/platform/media-circulation';
import { bucketStateClass, verdictClass } from './verdict-styles';

interface BucketInventoryProps {
    proof?: MediaCirculationProof;
}

export function BucketInventory({ proof }: BucketInventoryProps) {
    if (!proof) return null;
    const evictEntries = Object.entries(proof.evict_by_verdict ?? {});

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Library inventory by duration bucket</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {proof.buckets.map((b) => (
                        <Badge
                            key={b.bucket}
                            variant="outline"
                            className={cn('gap-1', bucketStateClass(b.state))}
                        >
                            <span className="font-semibold">{b.bucket}m</span>
                            <span className="opacity-70">·</span>
                            <span>{b.visible_units}</span>
                            <span className="opacity-70">·</span>
                            <span className="uppercase">{b.state}</span>
                        </Badge>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                    <Row label="Used" value={formatBytes(proof.storage.used_bytes)} />
                    <Row label="Quota" value={formatBytes(proof.storage.quota_bytes)} />
                    <Row
                        label="Utilization"
                        value={`${proof.storage.utilization_pct.toFixed(1)}%`}
                    />
                    <Row
                        label="Protected"
                        value={`${proof.storage.protected_count} · ${formatBytes(proof.storage.protected_bytes)}`}
                    />
                    {evictEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                            {evictEntries.map(([verdict, count]) => (
                                <Badge
                                    key={verdict}
                                    variant="outline"
                                    className={cn('text-[10px]', verdictClass(verdict))}
                                >
                                    {verdict.replace(/_/g, ' ')}: {count}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
        </div>
    );
}
