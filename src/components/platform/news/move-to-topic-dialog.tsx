'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAssignTopic, useTopics } from '@/hooks/use-news';
import type { BulkSelection } from '@/types/platform/news';

const UNCATEGORIZE = '__uncategorize__';

interface MoveToTopicDialogProps {
    selection: BulkSelection | null;
    count: number;
    onClose: () => void;
    onDone?: () => void;
}

export function MoveToTopicDialog({ selection, count, onClose, onDone }: MoveToTopicDialogProps) {
    const [target, setTarget] = useState('');
    const topics = useTopics({ limit: 200 });
    const assign = useAssignTopic();

    const close = () => {
        setTarget('');
        onClose();
    };

    const commit = () => {
        if (!selection || !target) return;
        assign.mutate(
            { ...selection, target_story_id: target === UNCATEGORIZE ? '' : target },
            {
                onSuccess: () => {
                    onDone?.();
                    close();
                },
            }
        );
    };

    return (
        <Dialog open={Boolean(selection)} onOpenChange={(o) => !o && close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move to story</DialogTitle>
                    <DialogDescription>
                        Move {count.toLocaleString()} article{count === 1 ? '' : 's'} to another story.
                    </DialogDescription>
                </DialogHeader>

                <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a story…" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={UNCATEGORIZE}>Uncategorized</SelectItem>
                        {(topics.data?.data ?? []).map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        Cancel
                    </Button>
                    <Button onClick={commit} disabled={!target || assign.isPending}>
                        {assign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Move
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
