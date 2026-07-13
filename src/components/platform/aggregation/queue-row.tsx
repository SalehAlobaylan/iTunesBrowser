'use client';

import { Badge } from '@/components/ui/badge';
import type { QueueStats } from '@/types/platform/aggregation';
import {
    QUEUE_STATE_LABEL,
    classifyQueue,
    queueDescription,
    queueLabel,
    queueLoad,
    queueTone,
} from './aggregation-logic';

/** One BullMQ queue: identity, health badge, in-flight load bar, and counts. */
export function QueueRow({ queue }: { queue: QueueStats }) {
    const state = classifyQueue(queue);
    const description = queueDescription(queue.queue);
    const { segments, total } = queueLoad(queue);

    return (
        <div className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{queueLabel(queue.queue)}</span>
                        <Badge variant={queueTone(state)}>{QUEUE_STATE_LABEL[state]}</Badge>
                    </div>
                    {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                    <Count label="wait" value={queue.waiting} highlight={queue.waiting > 0 ? 'text-warning' : undefined} />
                    <Count label="active" value={queue.active} highlight={queue.active > 0 ? 'text-info' : undefined} />
                    <Count label="done" value={queue.completed} />
                    <Count label="failed" value={queue.failed} highlight={queue.failed > 0 ? 'text-destructive' : undefined} />
                </div>
            </div>

            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${queueLabel(queue.queue)} load`}>
                {total === 0
                    ? null
                    : segments
                        .filter((segment) => segment.value > 0)
                        .map((segment) => (
                            <div
                                key={segment.key}
                                className={segment.className}
                                style={{ width: `${(segment.value / total) * 100}%` }}
                                title={`${segment.label}: ${segment.value}`}
                            />
                        ))}
            </div>
        </div>
    );
}

function Count({ label, value, highlight }: { label: string; value: number; highlight?: string }) {
    return (
        <span className="flex items-baseline gap-1">
            <span className={`font-semibold ${highlight ?? 'text-foreground'}`}>{value}</span>
            <span>{label}</span>
        </span>
    );
}
