'use client';

import { useCallback, useRef, useState } from 'react';

export interface BulkActionState {
    running: boolean;
    completed: number;
    total: number;
    failed: string[]; // ids that errored
}

export interface BulkActionResult {
    completed: number;
    total: number;
    failed: string[];
    cancelled: boolean;
}

interface UseBulkActionOptions {
    /** 'sequential' awaits each in turn; 'parallel' fires Promise.all. */
    mode?: 'sequential' | 'parallel';
}

/**
 * Generic bulk-loop helper for running the same per-id mutation across many ids.
 * Cancellation flips a flag that the sequential loop respects between iterations;
 * any in-flight request still completes.
 */
export function useBulkAction(options: UseBulkActionOptions = {}) {
    const { mode = 'sequential' } = options;

    const [state, setState] = useState<BulkActionState>({
        running: false,
        completed: 0,
        total: 0,
        failed: [],
    });

    const cancelRef = useRef(false);

    const run = useCallback(
        async (
            ids: string[],
            handler: (id: string) => Promise<unknown>
        ): Promise<BulkActionResult> => {
            cancelRef.current = false;
            setState({ running: true, completed: 0, total: ids.length, failed: [] });

            const failed: string[] = [];
            let completed = 0;

            if (mode === 'parallel') {
                const results = await Promise.allSettled(ids.map((id) => handler(id)));
                results.forEach((r, i) => {
                    if (r.status === 'fulfilled') completed += 1;
                    else failed.push(ids[i]);
                });
                setState({ running: false, completed, total: ids.length, failed });
                return { completed, total: ids.length, failed, cancelled: false };
            }

            // sequential
            for (const id of ids) {
                if (cancelRef.current) {
                    setState({ running: false, completed, total: ids.length, failed });
                    return { completed, total: ids.length, failed, cancelled: true };
                }
                try {
                    await handler(id);
                    completed += 1;
                } catch {
                    failed.push(id);
                }
                setState((s) => ({ ...s, completed, failed: [...failed] }));
            }

            setState({ running: false, completed, total: ids.length, failed });
            return { completed, total: ids.length, failed, cancelled: false };
        },
        [mode]
    );

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    return { ...state, run, cancel };
}
