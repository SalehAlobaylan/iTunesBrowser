'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useMergeTopicProposal, useTopicCatalog } from '@/hooks/use-topics';
import type { TopicProposal } from '@/types/platform/topics';

export function MergeDialog({
    proposal,
    open,
    onOpenChange,
}: {
    proposal: TopicProposal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const merge = useMergeTopicProposal();
    const catalog = useTopicCatalog({ active: true });
    const [into, setInto] = useState('');

    if (!proposal) return null;

    const activeTopics = catalog.data?.data ?? [];

    const submit = () => {
        if (!into) return;
        merge.mutate({ id: proposal.id, into }, { onSuccess: () => onOpenChange(false) });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) setInto('');
                onOpenChange(o);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Merge proposal</DialogTitle>
                    <DialogDescription>
                        Mark <strong>{proposal.suggested_label_en || proposal.suggested_slug}</strong> as a duplicate of an existing
                        active topic.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    <Label className="text-xs">Merge into</Label>
                    <Select value={into} onValueChange={setInto}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select target topic…" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeTopics.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.label_en} <span className="text-muted-foreground">· {t.slug}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!into || merge.isPending}>
                        Merge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
