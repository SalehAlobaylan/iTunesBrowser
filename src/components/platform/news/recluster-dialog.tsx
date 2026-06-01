'use client';

import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { reclusterTopics, labelTopicsBatch } from '@/lib/api/cms/news';
import { newsKeys } from '@/hooks/use-news';

type Phase = 'idle' | 'clustering' | 'naming' | 'done';

interface RecclusterDialogProps {
    open: boolean;
    onClose: () => void;
}

export function RecclusterDialog({ open, onClose }: RecclusterDialogProps) {
    const qc = useQueryClient();
    const [k, setK] = useState('');
    const [phase, setPhase] = useState<Phase>('idle');
    const [named, setNamed] = useState(0);
    const [total, setTotal] = useState(0);

    const running = phase === 'clustering' || phase === 'naming';

    const close = () => {
        if (running) return;
        setPhase('idle');
        setK('');
        setNamed(0);
        setTotal(0);
        onClose();
    };

    const run = async () => {
        try {
            setPhase('clustering');
            const kn = Number(k);
            const res = await reclusterTopics(Number.isFinite(kn) && kn > 0 ? kn : undefined);
            setTotal(res.clusters);
            qc.invalidateQueries({ queryKey: newsKeys.all });

            setPhase('naming');
            let done = 0;
            let guard = 0;
            while (guard++ < 300) {
                const r = await labelTopicsBatch(8);
                done += r.processed;
                setNamed(done);
                qc.invalidateQueries({ queryKey: newsKeys.topics() });
                if (r.remaining === 0 || r.processed === 0) break;
            }
            qc.invalidateQueries({ queryKey: newsKeys.all });
            setPhase('done');
            toast({
                title: 'Re-cluster complete',
                description: `${res.clusters} topics from ${res.articles.toLocaleString()} articles.`,
                variant: 'success',
            });
        } catch (e) {
            setPhase('idle');
            toast({
                title: 'Re-cluster failed',
                description: (e as Error).message,
                variant: 'destructive',
            });
        }
    };

    const pct = total > 0 ? Math.min(100, Math.round((named / total) * 100)) : 0;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Re-cluster all topics</DialogTitle>
                    <DialogDescription>
                        Rebuilds the entire taxonomy from scratch — clusters every article by
                        meaning, then names each cluster with AI.
                    </DialogDescription>
                </DialogHeader>

                {phase === 'idle' && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-50/50 p-3 text-sm text-amber-900">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                This replaces all current topics and reassigns every article.
                                Manual renames and merges will be lost.
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="k">Number of topics (optional)</Label>
                            <Input
                                id="k"
                                type="number"
                                min={2}
                                value={k}
                                onChange={(e) => setK(e.target.value)}
                                placeholder="Auto"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave blank to auto-pick (~1 topic per 30 articles).
                            </p>
                        </div>
                    </div>
                )}

                {running && (
                    <div className="space-y-2 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {phase === 'clustering'
                                ? 'Clustering articles…'
                                : `Naming topics ${named}${total ? ` / ${total}` : ''}…`}
                        </div>
                        {phase === 'naming' && total > 0 && (
                            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {phase === 'done' && (
                    <p className="py-2 text-sm text-muted-foreground">
                        Done — {total} topics created and named.
                    </p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={close} disabled={running}>
                        {phase === 'done' ? 'Close' : 'Cancel'}
                    </Button>
                    {phase !== 'done' && (
                        <Button onClick={run} disabled={running}>
                            {running ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Re-cluster
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
