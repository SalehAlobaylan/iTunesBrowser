'use client';

import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useRetryFailedItem } from './detail-actions-menu';
import type { ContentItem } from '@/types/platform/content';

interface FailedBannerProps {
    item: ContentItem;
}

export function FailedBanner({ item }: FailedBannerProps) {
    const { retry } = useRetryFailedItem();
    const [busy, setBusy] = useState(false);

    if (item.status !== 'FAILED') return null;

    const handleRetry = async () => {
        setBusy(true);
        try {
            await retry(item);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                <div>
                    <p className="text-sm font-medium text-destructive">
                        This item failed to process.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Re-queue this item through the aggregation pipeline.
                    </p>
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={busy}
            >
                {busy ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying…
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry processing
                    </>
                )}
            </Button>
        </div>
    );
}
