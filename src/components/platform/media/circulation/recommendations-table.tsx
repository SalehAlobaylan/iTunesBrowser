'use client';

import { Check, X } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/hooks/use-storage';
import type {
    MediaCirculationRecommendation,
    RecommendationUnitType,
} from '@/types/platform/media-circulation';
import { verdictClass } from './verdict-styles';

interface RecommendationsTableProps {
    unitType: RecommendationUnitType;
    rows?: MediaCirculationRecommendation[];
    loading: boolean;
    onApply?: (id: string) => void;
    onDismiss?: (id: string) => void;
    acting?: boolean;
    applyDisabled?: boolean;
}

function metricString(m: Record<string, unknown> | undefined, key: string): string {
    const v = m?.[key];
    if (v === undefined || v === null) return '—';
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
    if (typeof v === 'number') return String(v);
    return String(v);
}

function metricBytes(m: Record<string, unknown> | undefined, key: string): string {
    const v = m?.[key];
    return typeof v === 'number' && v > 0 ? formatBytes(v) : '—';
}

export function RecommendationsTable({
    unitType,
    rows,
    loading,
    onApply,
    onDismiss,
    acting,
    applyDisabled,
}: RecommendationsTableProps) {
    const isSource = unitType === 'source';
    const showActions = Boolean(onApply || onDismiss);

    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }
    if (!rows || rows.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No {isSource ? 'intake' : 'evict'} recommendations. Click “Generate recommendations”.
            </p>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{isSource ? 'Source' : 'Subject'}</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>{isSource ? 'Allowed intake' : 'Impact'}</TableHead>
                    <TableHead>{isSource ? 'Thin buckets' : 'Role'}</TableHead>
                    <TableHead>Reasons</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((r) => (
                    <TableRow key={r.id}>
                        <TableCell className="max-w-[180px] truncate font-medium">
                            {isSource
                                ? metricString(r.metrics, 'source_name')
                                : `${r.subject_kind ?? 'item'} · ${r.subject_id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn(verdictClass(r.verdict))}>
                                {r.verdict.replace(/_/g, ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.score.toFixed(3)}</TableCell>
                        <TableCell className="tabular-nums">
                            {isSource
                                ? metricString(r.metrics, 'allowed_intake')
                                : metricBytes(r.metrics, 'file_size_bytes')}
                        </TableCell>
                        <TableCell className="text-xs">
                            {isSource
                                ? metricString(r.metrics, 'matched_thin_buckets')
                                : metricString(r.metrics, 'role')}
                        </TableCell>
                        <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                            {(r.reasons ?? []).join(' ')}
                        </TableCell>
                        {showActions && (
                            <TableCell className="text-right">
                                {r.status === 'pending' ? (
                                    <div className="flex justify-end gap-1">
                                        {onApply && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={acting || applyDisabled}
                                                onClick={() => onApply(r.id)}
                                            >
                                                <Check className="mr-1 h-3.5 w-3.5" />
                                                Apply
                                            </Button>
                                        )}
                                        {onDismiss && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={acting}
                                                onClick={() => onDismiss(r.id)}
                                            >
                                                <X className="mr-1 h-3.5 w-3.5" />
                                                Dismiss
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        {r.outcome ?? r.status}
                                    </span>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
