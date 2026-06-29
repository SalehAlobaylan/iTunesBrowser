'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreHorizontal,
    Sparkles,
    RefreshCw,
    Copy,
    Trash2,
    Loader2,
    Clapperboard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import {
    useUpdateContentStatus,
    useDeleteContentByIds,
} from '@/hooks/use-content';
import { triggerEnrichment } from '@/lib/api/cms/enrichment';
import { retryFailed } from '@/lib/api/aggregation';
import { CONTENT_STATUS_LABELS } from '@/types/platform/content';
import type { ContentItem, ContentStatus } from '@/types/platform/content';

const STATUS_OPTIONS: ContentStatus[] = [
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED',
    'ARCHIVED',
];

interface DetailActionsMenuProps {
    item: ContentItem;
}

export function DetailActionsMenu({ item }: DetailActionsMenuProps) {
    const router = useRouter();
    const updateStatus = useUpdateContentStatus();
    const deleteByIds = useDeleteContentByIds();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [working, setWorking] = useState<null | 'enrich' | 'retry'>(null);
    const isMediaItem = item.type === 'VIDEO' || item.type === 'PODCAST';

    const isBusy =
        updateStatus.isPending || deleteByIds.isPending || Boolean(working);

    const reEnrich = async () => {
        setWorking('enrich');
        try {
            await triggerEnrichment(item.id, ['transcript', 'embedding', 'news']);
            toast({
                title: 'Enrichment triggered',
                description: item.title,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Enrichment failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setWorking(null);
        }
    };

    const retryProcessing = async () => {
        setWorking('retry');
        try {
            const res = await retryFailed({
                ids: [item.id],
                limit: 1,
            });
            toast({
                title: 'Requeued',
                description: `${res.requeued}/${res.total} requeued. ${res.message}`,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Retry failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setWorking(null);
        }
    };

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(item.id);
            toast({ title: 'ID copied', description: item.id, variant: 'success' });
        } catch {
            toast({
                title: 'Copy failed',
                description: 'Clipboard access denied.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = () => {
        deleteByIds.mutate([item.id], {
            onSuccess: () => {
                setConfirmDelete(false);
                router.push('/platform/content');
            },
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isBusy}>
                        {isBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="mr-2 h-4 w-4" />
                        )}
                        Actions
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {isMediaItem && (
                        <>
                            <DropdownMenuItem onClick={() => router.push(`/platform/media/atomization?tab=studio&item=${item.id}`)}>
                                <Clapperboard className="mr-2 h-4 w-4" /> Open in Media Studio
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <DropdownMenuLabel className="flex items-center px-0 py-0 font-normal">
                                Set status
                            </DropdownMenuLabel>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {STATUS_OPTIONS.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    disabled={s === item.status}
                                    onClick={() =>
                                        updateStatus.mutate({ id: item.id, status: s })
                                    }
                                >
                                    {CONTENT_STATUS_LABELS[s]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={reEnrich}>
                        <Sparkles className="mr-2 h-4 w-4" /> Re-enrich
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={retryProcessing}
                        disabled={item.status !== 'FAILED'}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry processing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={copyId}>
                        <Copy className="mr-2 h-4 w-4" /> Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setConfirmDelete(true)}
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete content</DialogTitle>
                        <DialogDescription>
                            This permanently deletes <strong>{item.title}</strong>. This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleteByIds.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteByIds.isPending}
                        >
                            {deleteByIds.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * Exposed retry helper so the FAILED banner can reuse the same logic.
 */
export function useRetryFailedItem() {
    const retry = async (item: ContentItem) => {
        try {
            const res = await retryFailed({
                source: item.source_name,
                limit: 1,
            });
            toast({
                title: 'Requeued',
                description: `${res.requeued}/${res.total} requeued. ${res.message}`,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Retry failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        }
    };
    return { retry };
}
