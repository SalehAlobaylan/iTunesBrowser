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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateFeed, useUpdateFeed } from '@/hooks/use-feeds';
import { useTopics } from '@/hooks/use-news';
import { CONTENT_TYPE_LABELS } from '@/types/platform/content';
import type { RSSFeed } from '@/types/platform/feed';

const ALL = '__all__';

interface FeedFormDialogProps {
    open: boolean;
    feed: RSSFeed | null; // null = create
    onClose: () => void;
}

export function FeedFormDialog({ open, feed, onClose }: FeedFormDialogProps) {
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topicId, setTopicId] = useState<string>(ALL);
    const [type, setType] = useState<string>(ALL);
    const [limit, setLimit] = useState(50);

    const topics = useTopics({ limit: 200 });
    const create = useCreateFeed();
    const update = useUpdateFeed();
    const busy = create.isPending || update.isPending;

    useEffect(() => {
        if (!open) return;
        setName(feed?.name ?? '');
        setTitle(feed?.title ?? '');
        setDescription(feed?.description ?? '');
        setTopicId(feed?.topic_id ? feed.topic_id : ALL);
        setType(feed?.content_type ? feed.content_type : ALL);
        setLimit(feed?.item_limit ?? 50);
    }, [open, feed]);

    const submit = () => {
        const body = {
            name: name.trim(),
            title: title.trim(),
            description: description.trim(),
            topic_id: topicId === ALL ? null : topicId,
            content_type: type === ALL ? '' : type,
            item_limit: limit,
        };
        if (!body.name) return;
        if (feed) {
            update.mutate({ id: feed.id, data: body }, { onSuccess: onClose });
        } else {
            create.mutate(body, { onSuccess: onClose });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{feed ? 'Edit feed' : 'New feed'}</DialogTitle>
                    <DialogDescription>
                        Define a public RSS/Atom/JSON feed from your news.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="feed-name">Name *</Label>
                        <Input
                            id="feed-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Politics Daily"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="feed-title">Feed title</Label>
                        <Input
                            id="feed-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Defaults to the name"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="feed-desc">Description</Label>
                        <Textarea
                            id="feed-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Topic</Label>
                            <Select value={topicId} onValueChange={setTopicId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>All topics</SelectItem>
                                    {(topics.data?.data ?? []).map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Content type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>All types</SelectItem>
                                    {Object.entries(CONTENT_TYPE_LABELS).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="feed-limit">Item count</Label>
                        <Input
                            id="feed-limit"
                            type="number"
                            min={1}
                            max={200}
                            value={limit}
                            onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value))))}
                            className="w-28"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!name.trim() || busy}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {feed ? 'Save' : 'Create feed'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
