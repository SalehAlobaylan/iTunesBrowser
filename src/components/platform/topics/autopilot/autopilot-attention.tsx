'use client';

import { useState } from 'react';
import { GitMerge, Ghost, Skull, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMergeCatalogTopic } from '@/hooks/use-preference-autopilot';
import type {
    DuplicatePair,
    PreferenceAttentionTopic,
} from '@/types/platform/preference-autopilot';

function AttentionList({
    icon,
    title,
    empty,
    topics,
}: {
    icon: React.ReactNode;
    title: string;
    empty: string;
    topics: PreferenceAttentionTopic[];
}) {
    return (
        <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                {icon}
                {title}
                <span className="text-muted-foreground">({topics.length})</span>
            </div>
            {topics.length === 0 ? (
                <p className="text-xs text-muted-foreground">{empty}</p>
            ) : (
                <ul className="space-y-1">
                    {topics.map((t) => (
                        <li key={t.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs">
                            <span className="truncate">{t.label_en || t.slug}</span>
                            <span className="tabular-nums text-muted-foreground">{t.member_count} members</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function MergeDialog({ pair, onClose }: { pair: DuplicatePair | null; onClose: () => void }) {
    const merge = useMergeCatalogTopic();
    // Default: keep A (target), deactivate B (source).
    const [target, setTarget] = useState<'a' | 'b'>('a');
    if (!pair) return null;
    const survivor = target === 'a' ? pair : { a_id: pair.b_id, a_slug: pair.b_slug };
    const loser = target === 'a' ? { a_id: pair.b_id, a_slug: pair.b_slug } : pair;

    const submit = () => {
        merge.mutate(
            { sourceId: loser.a_id, into: survivor.a_id },
            { onSuccess: onClose }
        );
    };

    return (
        <Dialog open={!!pair} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Merge near-duplicate topics</DialogTitle>
                    <DialogDescription>
                        Cosine {pair.cosine.toFixed(3)}. The source is deactivated and its mappings, prefs, and affinity are
                        rehomed into the survivor; affected users are queued for recompute.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    <Label className="text-xs">Keep as survivor</Label>
                    <Select value={target} onValueChange={(v) => setTarget(v as 'a' | 'b')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="a">{pair.a_slug}</SelectItem>
                            <SelectItem value="b">{pair.b_slug}</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                        <strong>{loser.a_slug}</strong> → <strong>{survivor.a_slug}</strong>
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={merge.isPending}>
                        Merge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AutopilotAttention({
    nullCentroids,
    deadTopics,
    duplicatePairs,
}: {
    nullCentroids: PreferenceAttentionTopic[];
    deadTopics: PreferenceAttentionTopic[];
    duplicatePairs: DuplicatePair[];
}) {
    const [mergeTarget, setMergeTarget] = useState<DuplicatePair | null>(null);
    const nothing = nullCentroids.length === 0 && deadTopics.length === 0 && duplicatePairs.length === 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">What needs attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {nothing && <p className="text-sm text-muted-foreground">Nothing flagged — catalog hygiene is clean.</p>}
                <div className="grid gap-5 sm:grid-cols-2">
                    <AttentionList
                        icon={<Ghost className="h-4 w-4 text-primary" />}
                        title="NULL centroids"
                        empty="All active topics have centroids."
                        topics={nullCentroids}
                    />
                    <AttentionList
                        icon={<Skull className="h-4 w-4 text-muted-foreground" />}
                        title="Dead topics"
                        empty="No dead topics."
                        topics={deadTopics}
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Copy className="h-4 w-4 text-destructive" />
                        Near-duplicate pairs
                        <span className="text-muted-foreground">({duplicatePairs.length})</span>
                    </div>
                    {duplicatePairs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No near-duplicates above threshold.</p>
                    ) : (
                        <ul className="space-y-1">
                            {duplicatePairs.map((p) => (
                                <li
                                    key={`${p.a_id}-${p.b_id}`}
                                    className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-xs"
                                >
                                    <span className="truncate">
                                        <strong>{p.a_slug}</strong> ↔ <strong>{p.b_slug}</strong>{' '}
                                        <span className="tabular-nums text-muted-foreground">({p.cosine.toFixed(3)})</span>
                                    </span>
                                    <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => setMergeTarget(p)}>
                                        <GitMerge className="h-3 w-3" /> Merge
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
            <MergeDialog pair={mergeTarget} onClose={() => setMergeTarget(null)} />
        </Card>
    );
}
