'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';

import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useContent } from '@/hooks/use-content';
import { useTriggerStt } from '@/hooks/use-transcription';
import {
    CAPTION_STATE_LABELS,
    CAPTION_STATE_VARIANTS,
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
    type CaptionState,
    type ContentItem,
    type ContentType,
} from '@/types/platform/content';

function formatDuration(sec?: number): string {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function captionStateOf(item: ContentItem): CaptionState {
    if (item.caption_state) return item.caption_state;
    return item.has_transcript ? 'stt_done' : 'none';
}

/** STT can upgrade only auto-caption or transcript-less media (with a media URL). */
function canEnrich(item: ContentItem): boolean {
    const state = captionStateOf(item);
    return !!item.media_url && (state === 'youtube_auto' || state === 'none');
}

export function MediaList({ type }: { type: ContentType }) {
    const [page, setPage] = useState(1);
    // Reset to page 1 when the type switches, else a stale page index (e.g. p3
    // on Video) can land past the new type's last page and show an empty table.
    useEffect(() => {
        setPage(1);
    }, [type]);
    const { data, isLoading } = useContent({ type, page, limit: 20 });
    const triggerStt = useTriggerStt();
    const [confirm, setConfirm] = useState<ContentItem | null>(null);

    const items = data?.data ?? [];
    const totalPages = data?.total_pages ?? 1;

    const runEnrich = () => {
        if (!confirm) return;
        triggerStt.mutate(confirm.id);
        setConfirm(null);
    };

    return (
        <div className="space-y-3">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead className="w-20">Length</TableHead>
                            <TableHead className="w-64">Transcript</TableHead>
                            <TableHead className="w-36 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                    No {type.toLowerCase()} items.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                const state = captionStateOf(item);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="max-w-0">
                                            <Link
                                                href={`/platform/media/${item.id}`}
                                                className="block truncate font-medium hover:underline"
                                                title={item.title}
                                            >
                                                {item.title || '(untitled)'}
                                            </Link>
                                            {item.source_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    {item.source_name}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={CONTENT_STATUS_VARIANTS[item.status]}>
                                                {CONTENT_STATUS_LABELS[item.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="tabular-nums text-sm">
                                            {formatDuration(item.duration_sec)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={CAPTION_STATE_VARIANTS[state]}>
                                                {state === 'youtube_auto' && '⚠️ '}
                                                {CAPTION_STATE_LABELS[state]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canEnrich(item) && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setConfirm(item)}
                                                    disabled={triggerStt.isPending}
                                                >
                                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                                    Enrich with STT
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upgrade transcript with STT?</DialogTitle>
                        <DialogDescription>
                            This transcribes “{confirm?.title || 'this item'}” with the configured STT
                            engine and replaces the current caption. It also re-runs embeddings so
                            search reflects the new transcript. The monthly budget cap still applies.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfirm(null)}>
                            Cancel
                        </Button>
                        <Button onClick={runEnrich} disabled={triggerStt.isPending}>
                            {triggerStt.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enrich with STT
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
