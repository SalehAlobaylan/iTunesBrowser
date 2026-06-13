'use client';

import { formatNumber } from '@/lib/utils/format';
import {
    CONTENT_TYPE_LABELS,
    CONTENT_STATUS_LABELS,
} from '@/types/platform/content';
import type { ContentStatus, ContentType } from '@/types/platform/content';

// Segmented-bar order + color per status. Lightweight CSS bars (no Recharts) keep
// the matrix compact inside a narrow monitoring column.
const STATUS_ORDER: ContentStatus[] = ['READY', 'PROCESSING', 'PENDING', 'FAILED', 'ARCHIVED'];

const STATUS_BAR_CLASS: Record<ContentStatus, string> = {
    READY: 'bg-success',
    PROCESSING: 'bg-warning',
    PENDING: 'bg-info',
    FAILED: 'bg-destructive',
    ARCHIVED: 'bg-muted-foreground/40',
};

interface TypeStatusMatrixProps {
    matrix: Record<string, Record<string, number>>;
    types: ContentType[];
}

export function TypeStatusMatrix({ matrix, types }: TypeStatusMatrixProps) {
    return (
        <div className="space-y-3">
            {types.map((type) => {
                const row = matrix[type] ?? {};
                const total = STATUS_ORDER.reduce((sum, s) => sum + (row[s] ?? 0), 0);
                return (
                    <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{CONTENT_TYPE_LABELS[type]}</span>
                            <span className="font-mono tabular-nums text-muted-foreground">
                                {formatNumber(total)}
                            </span>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                            {total > 0 &&
                                STATUS_ORDER.map((s) => {
                                    const value = row[s] ?? 0;
                                    if (value === 0) return null;
                                    return (
                                        <div
                                            key={s}
                                            className={STATUS_BAR_CLASS[s]}
                                            style={{ width: `${(value / total) * 100}%` }}
                                            title={`${CONTENT_STATUS_LABELS[s]}: ${formatNumber(value)}`}
                                        />
                                    );
                                })}
                        </div>
                    </div>
                );
            })}
            <MatrixLegend />
        </div>
    );
}

function MatrixLegend() {
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${STATUS_BAR_CLASS[s]}`} />
                    {CONTENT_STATUS_LABELS[s]}
                </div>
            ))}
        </div>
    );
}
