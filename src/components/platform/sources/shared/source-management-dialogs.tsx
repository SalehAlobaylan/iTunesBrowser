'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';
import type { SourceType } from '@/types/platform/source';
import { BulkIntervalDialog } from '@/components/platform/sources/list/bulk-interval-dialog';
import { RunStaleDialog } from '@/components/platform/sources/list/run-stale-dialog';

import type { SourceManagement } from './use-source-management';

/** Renders every confirm dialog for a source surface, wired from the hook. */
export function SourceManagementDialogs({ dialogs }: { dialogs: SourceManagement['dialogs'] }) {
    return (
        <>
            {/* Single-row delete */}
            <Dialog
                open={!!dialogs.deleteId}
                onOpenChange={(o) => !o && !dialogs.deleting && dialogs.onCancelDelete()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete source</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this source? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={dialogs.onCancelDelete} disabled={dialogs.deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={dialogs.onConfirmDelete} disabled={dialogs.deleting}>
                            {dialogs.deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk delete */}
            <Dialog open={dialogs.bulkDeleteOpen} onOpenChange={(o) => !o && dialogs.onCancelBulkDelete()}>
                <DialogContent className="max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Delete {dialogs.selectedSources.length} sources</DialogTitle>
                        <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-64 overflow-y-auto rounded-md border">
                        <ul className="divide-y text-sm">
                            {dialogs.selectedSources.map((s) => (
                                <li key={s.id} className="flex items-center justify-between px-3 py-2">
                                    <span className="truncate font-medium">{s.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {SOURCE_TYPE_LABELS[s.type as SourceType]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={dialogs.onCancelBulkDelete}
                            disabled={dialogs.bulkDeleteRunning}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={dialogs.onConfirmBulkDelete}
                            disabled={dialogs.bulkDeleteRunning}
                        >
                            {dialogs.bulkDeleteRunning
                                ? 'Deleting…'
                                : `Delete ${dialogs.selectedSources.length}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BulkIntervalDialog
                open={dialogs.intervalOpen}
                count={dialogs.selectedSources.length}
                onClose={dialogs.onCancelInterval}
                onSubmit={dialogs.onConfirmInterval}
                isSubmitting={dialogs.intervalRunning}
            />

            <RunStaleDialog
                open={dialogs.runStaleOpen}
                sources={dialogs.staleSources}
                onClose={dialogs.onCancelRunStale}
                onConfirm={dialogs.onConfirmRunStale}
                isSubmitting={dialogs.runStaleRunning}
            />
        </>
    );
}
