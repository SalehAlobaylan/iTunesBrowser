'use client';

import { useState } from 'react';
import { Loader2, Download, Send, Rss } from 'lucide-react';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateNews, useExtractNewsUrl, useImportFeed } from '@/hooks/use-news';

interface AddNewsSheetProps {
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

export function AddNewsSheet({ open, onClose }: AddNewsSheetProps) {
    const [form, setForm] = useState<ComposeForm>(EMPTY_FORM);
    const [url, setUrl] = useState('');

    const createNews = useCreateNews();
    const extract = useExtractNewsUrl();
    const importFeedMut = useImportFeed();

    const setField = (k: keyof ComposeForm, v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const resetAndClose = () => {
        setForm(EMPTY_FORM);
        setUrl('');
        onClose();
    };

    const canPublish = form.title.trim() !== '' && form.original_url.trim() !== '';

    const handleImportFeed = () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        importFeedMut.mutate(trimmed, { onSuccess: resetAndClose });
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
            },
        });
    };

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

    return (
        <Sheet open={open} onOpenChange={(o) => !o && resetAndClose()}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
                <SheetHeader className="border-b p-5">
                    <SheetTitle>Add news</SheetTitle>
                    <SheetDescription>
                        Paste a link to autofill, or write the story yourself. It goes
                        live in the feed immediately.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 p-5">
                    {/* URL autofill / feed import */}
                    <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
                        <Label htmlFor="autofill-url" className="text-xs text-muted-foreground">
                            Paste an article link to autofill, or a feed URL to import all its items
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="autofill-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/article  or  …/feed.xml"
                                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            />
                            <Button
                                variant="outline"
                                onClick={handleFetch}
                                disabled={!url.trim() || extract.isPending}
                                title="Autofill the form from one article"
                            >
                                {extract.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Autofill
                            </Button>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleImportFeed}
                            disabled={!url.trim() || importFeedMut.isPending}
                            title="Import every item from an RSS/Atom feed"
                        >
                            {importFeedMut.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Rss className="mr-2 h-4 w-4" />
                            )}
                            Import whole feed
                        </Button>
                    </div>

                    {/* Compose form */}
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
                </div>

                <SheetFooter className="border-t p-5">
                    <Button variant="outline" onClick={resetAndClose}>
                        Cancel
                    </Button>
                    <Button onClick={handlePublish} disabled={!canPublish || createNews.isPending}>
                        {createNews.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Publish to feed
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
