'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useMergeTopics, useRenameTopic, useTopics } from '@/hooks/use-news';

interface TopicEditDialogProps {
    topic: { id: string; label: string } | null;
    mode: 'rename' | 'merge';
    onClose: () => void;
}

export function TopicEditDialog({ topic, mode, onClose }: TopicEditDialogProps) {
    const [label, setLabel] = useState('');
    const [target, setTarget] = useState('');

    const topics = useTopics({ limit: 200 });
    const rename = useRenameTopic();
    const merge = useMergeTopics();

    useEffect(() => {
        setLabel(topic?.label ?? '');
        setTarget('');
    }, [topic]);

    const busy = rename.isPending || merge.isPending;
    const isMerge = mode === 'merge';

    const commit = () => {
        if (!topic) return;
        if (isMerge) {
            if (!target) return;
            merge.mutate({ source_ids: [topic.id], target_id: target }, { onSuccess: onClose });
        } else {
            const l = label.trim();
            if (!l) return;
            rename.mutate({ id: topic.id, label: l }, { onSuccess: onClose });
        }
    };

    const others = (topics.data?.data ?? []).filter((t) => t.id !== topic?.id);

    return (
        <Dialog open={Boolean(topic)} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isMerge ? 'Merge story' : 'Rename story'}</DialogTitle>
                    <DialogDescription>
                        {isMerge
                            ? `Move all of "${topic?.label}" into another story, then delete it.`
                            : `Rename "${topic?.label}".`}
                    </DialogDescription>
                </DialogHeader>

                {isMerge ? (
                    <div className="space-y-1.5">
                        <Label>Merge into</Label>
                        <Select value={target} onValueChange={setTarget}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose target story…" />
                            </SelectTrigger>
                            <SelectContent>
                                {others.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label htmlFor="topic-label">New name</Label>
                        <Input
                            id="topic-label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={commit}
                        disabled={busy || (isMerge ? !target : !label.trim())}
                    >
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isMerge ? 'Merge' : 'Rename'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
