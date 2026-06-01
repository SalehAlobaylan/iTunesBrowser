'use client';

import { useMemo, useState } from 'react';
import { Loader2, Download, Send, Play, Search } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useCreateNews,
    useExtractNewsUrl,
    usePendingArticles,
    useSetNewsStatus,
} from '@/hooks/use-news';
import { useSources, useRunSource } from '@/hooks/use-sources';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';

interface AddNewsDialogProps {
    open: boolean;
    onClose: () => void;
}

interface ComposeForm {
    title: string;
    original_url: string;
    excerpt: string;
    body_text: string;
    source_name: string;
    author: string;
    thumbnail_url: string;
    published_at: string;
}

const EMPTY_FORM: ComposeForm = {
    title: '',
    original_url: '',
    excerpt: '',
    body_text: '',
    source_name: '',
    author: '',
    thumbnail_url: '',
    published_at: '',
};

export function AddNewsDialog({ open, onClose }: AddNewsDialogProps) {
    const [tab, setTab] = useState('compose');
    const [form, setForm] = useState<ComposeForm>(EMPTY_FORM);
    const [url, setUrl] = useState('');
    const [queueSelected, setQueueSelected] = useState<Set<string>>(new Set());
    const [sourceSearch, setSourceSearch] = useState('');

    const createNews = useCreateNews();
    const extract = useExtractNewsUrl();
    const promote = useSetNewsStatus();
    const runSource = useRunSource();

    const pending = usePendingArticles(
        { limit: 50 },
        { enabled: open && tab === 'promote' }
    );
    const sources = useSources(
        { limit: 100 },
        { paused: !(open && tab === 'source') }
    );

    const setField = (k: keyof ComposeForm, v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const resetAndClose = () => {
        setForm(EMPTY_FORM);
        setUrl('');
        setQueueSelected(new Set());
        setTab('compose');
        onClose();
    };

    const canPublish = form.title.trim() !== '' && form.original_url.trim() !== '';

    const handlePublish = () => {
        if (!canPublish) return;
        createNews.mutate(
            {
                title: form.title.trim(),
                original_url: form.original_url.trim(),
                excerpt: form.excerpt || undefined,
                body_text: form.body_text || undefined,
                source_name: form.source_name || undefined,
                author: form.author || undefined,
                thumbnail_url: form.thumbnail_url || undefined,
                published_at: form.published_at || undefined,
            },
            { onSuccess: resetAndClose }
        );
    };

    const handleFetch = () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        extract.mutate(trimmed, {
            onSuccess: (res) => {
                setForm({
                    title: res.title ?? '',
                    original_url: trimmed,
                    excerpt: res.excerpt ?? '',
                    body_text: res.text ?? '',
                    source_name: res.site_name ?? '',
                    author: res.author ?? '',
                    thumbnail_url: res.image_url ?? '',
                    published_at: res.published_at ?? '',
                });
                setTab('compose');
            },
        });
    };

    const handlePromote = () => {
        const ids = [...queueSelected];
        if (ids.length === 0) return;
        promote.mutate(
            { ids, toStatus: 'READY' },
            {
                onSuccess: () => {
                    setQueueSelected(new Set());
                    resetAndClose();
                },
            }
        );
    };

    const toggleQueue = (id: string) =>
        setQueueSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const filteredSources = useMemo(() => {
        const list = sources.data?.data ?? [];
        const q = sourceSearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter((s) => s.name.toLowerCase().includes(q));
    }, [sources.data, sourceSearch]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add news</DialogTitle>
                    <DialogDescription>
                        Compose a story, pull one from a URL, publish from the queue, or
                        pull a fresh batch from a source.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={setTab} className="mt-2">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="compose">Compose</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                        <TabsTrigger value="promote">Promote queue</TabsTrigger>
                        <TabsTrigger value="source">Run source</TabsTrigger>
                    </TabsList>

                    {/* Compose */}
                    <TabsContent value="compose" className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="news-title">Title *</Label>
                            <Input
                                id="news-title"
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                placeholder="Headline"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="news-url">Source link *</Label>
                            <Input
                                id="news-url"
                                value={form.original_url}
                                onChange={(e) => setField('original_url', e.target.value)}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="news-excerpt">Excerpt</Label>
                            <Textarea
                                id="news-excerpt"
                                value={form.excerpt}
                                onChange={(e) => setField('excerpt', e.target.value)}
                                rows={2}
                                placeholder="Short summary shown on the slide"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="news-body">Body</Label>
                            <Textarea
                                id="news-body"
                                value={form.body_text}
                                onChange={(e) => setField('body_text', e.target.value)}
                                rows={4}
                                placeholder="Full article text (used for related-item matching)"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="news-source">Source name</Label>
                                <Input
                                    id="news-source"
                                    value={form.source_name}
                                    onChange={(e) => setField('source_name', e.target.value)}
                                    placeholder="Manual"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="news-author">Author</Label>
                                <Input
                                    id="news-author"
                                    value={form.author}
                                    onChange={(e) => setField('author', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="news-thumb">Image URL</Label>
                            <Input
                                id="news-thumb"
                                value={form.thumbnail_url}
                                onChange={(e) => setField('thumbnail_url', e.target.value)}
                                placeholder="https://…/image.jpg"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={resetAndClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePublish}
                                disabled={!canPublish || createNews.isPending}
                            >
                                {createNews.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Publish to feed
                            </Button>
                        </div>
                    </TabsContent>

                    {/* From URL */}
                    <TabsContent value="url" className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Paste an article link. We&apos;ll read the page and prefill the
                            compose form for you to review before publishing.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/breaking-story"
                                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            />
                            <Button
                                onClick={handleFetch}
                                disabled={!url.trim() || extract.isPending}
                            >
                                {extract.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Fetch
                            </Button>
                        </div>
                        {extract.isPending && (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        )}
                    </TabsContent>

                    {/* Promote queue */}
                    <TabsContent value="promote" className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Ingested articles waiting to go live. Select and publish.
                        </p>
                        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-1">
                            {pending.isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))
                            ) : (pending.data?.data.length ?? 0) === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No pending articles in the queue.
                                </p>
                            ) : (
                                pending.data?.data.map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            checked={queueSelected.has(item.id)}
                                            onCheckedChange={() => toggleQueue(item.id)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-1 text-sm font-medium">
                                                {item.title || 'Untitled'}
                                            </p>
                                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                                {item.source_name || 'Unknown source'}
                                            </p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetAndClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePromote}
                                disabled={queueSelected.size === 0 || promote.isPending}
                            >
                                {promote.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Publish {queueSelected.size > 0 ? queueSelected.size : ''}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Run source */}
                    <TabsContent value="source" className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Trigger a configured source to pull a fresh batch. New items
                            land in the promote queue.
                        </p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={sourceSearch}
                                onChange={(e) => setSourceSearch(e.target.value)}
                                placeholder="Search sources…"
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-1">
                            {sources.isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))
                            ) : filteredSources.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No sources found.
                                </p>
                            ) : (
                                filteredSources.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-3 rounded px-2 py-2 hover:bg-muted/50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-1 text-sm font-medium">
                                                {s.name}
                                            </p>
                                            <Badge variant="secondary" className="mt-0.5">
                                                {SOURCE_TYPE_LABELS[s.type] ?? s.type}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={runSource.isPending}
                                            onClick={() => runSource.mutate(s.id)}
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Run
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
