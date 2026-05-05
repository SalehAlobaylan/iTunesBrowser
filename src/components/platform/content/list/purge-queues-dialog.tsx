'use client';

import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { purgeQueues } from '@/lib/api/aggregation';

interface PurgeQueuesDialogProps {
    open: boolean;
    onClose: () => void;
}

const STATE_OPTIONS = [
    { key: 'waiting', label: 'Waiting', desc: 'Queued, not started' },
    { key: 'delayed', label: 'Delayed', desc: 'Scheduled for later' },
    { key: 'active', label: 'Active', desc: 'Running now (FFmpeg, etc.)' },
    { key: 'failed', label: 'Failed', desc: 'Errored out' },
    { key: 'completed', label: 'Completed', desc: 'Already finished' },
] as const;

export function PurgeQueuesDialog({ open, onClose }: PurgeQueuesDialogProps) {
    const [queue, setQueue] = useState<string>('all');
    const [states, setStates] = useState<Record<string, boolean>>({
        waiting: true,
        delayed: true,
        active: true,
        completed: false,
        failed: true,
    });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ message: string; purged: Record<string, number> } | null>(null);

    const submit = async () => {
        const selected = Object.entries(states)
            .filter(([, v]) => v)
            .map(([k]) => k);
        if (selected.length === 0) return;
        setBusy(true);
        setResult(null);
        try {
            const res = await purgeQueues({
                queue: queue === 'all' ? undefined : queue,
                states: selected,
            });
            setResult({ message: res.message, purged: res.purged });
            toast({
                title: 'Queues purged',
                description: res.message,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Purge failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) {
                    setResult(null);
                    onClose();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Purge queues</DialogTitle>
                    <DialogDescription>
                        Remove jobs from aggregation queues. Active jobs are force-stopped.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Queue</Label>
                        <Select value={queue} onValueChange={setQueue}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Queues</SelectItem>
                                <SelectItem value="fetch-queue">
                                    Fetch (RSS / YouTube / X scraping)
                                </SelectItem>
                                <SelectItem value="normalize-queue">
                                    Normalize (content normalization)
                                </SelectItem>
                                <SelectItem value="media-queue">
                                    Media (FFmpeg transcode / thumbnails)
                                </SelectItem>
                                <SelectItem value="ai-queue">
                                    AI (transcription / embeddings)
                                </SelectItem>
                                <SelectItem value="aggregation-dlq">
                                    Dead Letter Queue
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Job states to purge</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS.map(({ key, label, desc }) => (
                                <label
                                    key={key}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={states[key]}
                                        onCheckedChange={(c) =>
                                            setStates((p) => ({
                                                ...p,
                                                [key]: Boolean(c),
                                            }))
                                        }
                                    />
                                    <div>
                                        <span className="font-medium">{label}</span>
                                        <p className="text-[11px] text-muted-foreground">
                                            {desc}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {states.active && (
                            <p className="text-xs text-amber-600">
                                Workers are paused to force-stop active jobs (e.g. FFmpeg
                                transcodes), then resumed.
                            </p>
                        )}
                    </div>
                    {result && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                            <p className="font-medium">{result.message}</p>
                            {Object.entries(result.purged).map(([q, count]) => (
                                <p key={q} className="text-xs text-muted-foreground">
                                    {q}: {count} jobs removed
                                </p>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={busy}>
                        Close
                    </Button>
                    <Button variant="destructive" onClick={submit} disabled={busy}>
                        {busy ? 'Purging…' : 'Purge'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
