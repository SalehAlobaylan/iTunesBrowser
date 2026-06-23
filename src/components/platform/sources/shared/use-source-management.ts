'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast';
import { sourceKeys } from '@/hooks/use-sources';
import { useBulkAction } from '@/hooks/use-bulk-action';
import { runSource, updateSource, deleteSource } from '@/lib/api/cms/sources';
import type { ContentSource } from '@/types/platform/source';

interface UseSourceManagementArgs {
    /** The full set this surface manages — used to resolve selected ids. */
    sources: ContentSource[];
    refetch: () => Promise<unknown> | void;
    /** Reports bulk-busy up so the page can pause auto-refresh. */
    onBusyChange?: (busy: boolean) => void;
}

/**
 * Shared management engine for every source surface (media card gallery + fleet
 * table). Owns selection, all bulk operations, single-row delete, and confirm
 * dialog state — so the redesigned layouts stay purely presentational. Mutations
 * invalidate `sourceKeys.all` (covers fleet/list/stats) and call `refetch`.
 */
export function useSourceManagement({ sources, refetch, onBusyChange }: UseSourceManagementArgs) {
    const queryClient = useQueryClient();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [intervalOpen, setIntervalOpen] = useState(false);
    const [runStaleOpen, setRunStaleOpen] = useState(false);
    const [staleForRun, setStaleForRun] = useState<ContentSource[]>([]);

    const bulkRun = useBulkAction({ mode: 'sequential' });
    const bulkDelete = useBulkAction({ mode: 'sequential' });
    const bulkActive = useBulkAction({ mode: 'parallel' });
    const bulkInterval = useBulkAction({ mode: 'parallel' });
    const bulkCategory = useBulkAction({ mode: 'parallel' });
    const bulkBusy =
        bulkRun.running ||
        bulkDelete.running ||
        bulkActive.running ||
        bulkInterval.running ||
        bulkCategory.running;

    useEffect(() => {
        onBusyChange?.(bulkBusy);
    }, [bulkBusy, onBusyChange]);

    const byId = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
    const selectedSources = useMemo(
        () => [...selected].map((id) => byId.get(id)).filter(Boolean) as ContentSource[],
        [selected, byId]
    );

    const progress = bulkBusy
        ? {
              completed:
                  bulkRun.completed +
                  bulkDelete.completed +
                  bulkActive.completed +
                  bulkInterval.completed +
                  bulkCategory.completed,
              total:
                  bulkRun.total +
                  bulkDelete.total +
                  bulkActive.total +
                  bulkInterval.total +
                  bulkCategory.total,
          }
        : null;

    const toggleOne = useCallback(
        (id: string) =>
            setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            }),
        []
    );
    const toggleMany = useCallback(
        (ids: string[], on: boolean) =>
            setSelected((prev) => {
                const next = new Set(prev);
                for (const id of ids) {
                    if (on) next.add(id);
                    else next.delete(id);
                }
                return next;
            }),
        []
    );
    const clear = useCallback(() => setSelected(new Set()), []);

    const runBulk = useCallback(
        async (
            action: ReturnType<typeof useBulkAction>,
            ids: string[],
            handler: (id: string) => Promise<unknown>,
            verb: string
        ) => {
            if (ids.length === 0) return;
            const result = await action.run(ids, handler);
            await refetch();
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
            if (result.failed.length === 0) {
                toast({
                    title: `${verb} ${result.completed}`,
                    description: `Bulk ${verb.toLowerCase()} complete.`,
                    variant: 'success',
                });
            } else {
                toast({
                    title: `${verb} finished with errors`,
                    description: `${result.completed} succeeded, ${result.failed.length} failed.`,
                    variant: 'destructive',
                });
            }
            setSelected(new Set());
        },
        [refetch, queryClient]
    );

    const ids = () => [...selected];

    const actions = {
        runSelected: () => runBulk(bulkRun, ids(), (id) => runSource(id), 'Ran'),
        enableSelected: () =>
            runBulk(bulkActive, ids(), (id) => updateSource(id, { is_active: true }), 'Enabled'),
        disableSelected: () =>
            runBulk(bulkActive, ids(), (id) => updateSource(id, { is_active: false }), 'Disabled'),
        moveSelectedToNews: () =>
            runBulk(bulkCategory, ids(), (id) => updateSource(id, { category: 'news' }), 'Moved'),
        moveSelectedToMedia: () =>
            runBulk(bulkCategory, ids(), (id) => updateSource(id, { category: 'media' }), 'Moved'),
        openChangeInterval: () => setIntervalOpen(true),
        openBulkDelete: () => setBulkDeleteOpen(true),
    };

    const openRunStale = (stale: ContentSource[]) => {
        setStaleForRun(stale);
        setRunStaleOpen(true);
    };

    const confirmSingleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteSource(deleteId);
            await refetch();
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
            toast({ title: 'Source deleted', variant: 'success' });
            setDeleteId(null);
        } catch (e) {
            toast({
                title: 'Failed to delete source',
                description: e instanceof Error ? e.message : undefined,
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
        }
    };

    return {
        // selection
        selected,
        toggleOne,
        toggleMany,
        clear,
        selectedSources,
        // bulk status
        bulkBusy,
        progress,
        // bulk actions (for SelectionToolbar)
        actions,
        // per-row
        requestDelete: (id: string) => setDeleteId(id),
        openRunStale,
        // dialog wiring (for SourceManagementDialogs)
        dialogs: {
            deleteId,
            deleting,
            onCancelDelete: () => setDeleteId(null),
            onConfirmDelete: confirmSingleDelete,
            bulkDeleteOpen,
            bulkDeleteRunning: bulkDelete.running,
            onCancelBulkDelete: () => setBulkDeleteOpen(false),
            onConfirmBulkDelete: async () => {
                await runBulk(bulkDelete, ids(), (id) => deleteSource(id), 'Deleted');
                setBulkDeleteOpen(false);
            },
            selectedSources,
            intervalOpen,
            intervalRunning: bulkInterval.running,
            onCancelInterval: () => setIntervalOpen(false),
            onConfirmInterval: async (minutes: number) => {
                await runBulk(
                    bulkInterval,
                    ids(),
                    (id) => updateSource(id, { fetch_interval_minutes: minutes }),
                    'Updated'
                );
                setIntervalOpen(false);
            },
            runStaleOpen,
            runStaleRunning: bulkRun.running,
            staleSources: staleForRun,
            onCancelRunStale: () => setRunStaleOpen(false),
            onConfirmRunStale: async () => {
                await runBulk(bulkRun, staleForRun.map((s) => s.id), (id) => runSource(id), 'Ran');
                setRunStaleOpen(false);
            },
        },
    };
}

export type SourceManagement = ReturnType<typeof useSourceManagement>;
