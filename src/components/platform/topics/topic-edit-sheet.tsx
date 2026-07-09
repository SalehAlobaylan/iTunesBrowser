'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useDeleteCatalogTopic, useUpdateCatalogTopic } from '@/hooks/use-topics';
import type { CatalogTopic } from '@/types/platform/topics';
import { CategorySelect } from './category-select';
import { ConfirmDialog } from './confirm-dialog';
import { TopicDrilldown } from './topic-drilldown';

export function TopicEditSheet({
    topic,
    open,
    onOpenChange,
}: {
    topic: CatalogTopic | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const update = useUpdateCatalogTopic();
    const del = useDeleteCatalogTopic();
    const [form, setForm] = useState({ slug: '', label_en: '', label_ar: '', category_slug: '', featured: false, active: true });
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (topic) {
            setForm({
                slug: topic.slug,
                label_en: topic.label_en,
                label_ar: topic.label_ar,
                category_slug: topic.category_slug ?? '',
                featured: topic.featured,
                active: topic.active,
            });
        }
    }, [topic]);

    if (!topic) return null;

    const save = () => {
        update.mutate(
            { id: topic.id, data: form },
            { onSuccess: () => onOpenChange(false) }
        );
    };

    const applyActive = (next: boolean) => {
        if (!next && topic.active) {
            setConfirmDeactivate(true);
        } else {
            setForm({ ...form, active: next });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-5 sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                        Edit topic
                        <Badge variant={topic.created_from === 'manual' ? 'outline' : 'secondary'}>{topic.created_from}</Badge>
                    </SheetTitle>
                    <SheetDescription>
                        {topic.member_count} content items currently mapped to this topic.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Slug</Label>
                        <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">English label</Label>
                            <Input value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Arabic label</Label>
                            <Input dir="rtl" value={form.label_ar} onChange={(e) => setForm({ ...form, label_ar: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <CategorySelect value={form.category_slug} onChange={(v) => setForm({ ...form, category_slug: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex h-10 items-center justify-between rounded-md border px-3 text-sm">
                            Featured
                            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                        </label>
                        <label className="flex h-10 items-center justify-between rounded-md border px-3 text-sm">
                            Active
                            <Switch checked={form.active} onCheckedChange={applyActive} />
                        </label>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3">
                        <TopicDrilldown topicId={open ? topic.id : null} />
                    </div>
                </div>

                <SheetFooter className="mt-6 flex-row items-center justify-between gap-2 sm:justify-between">
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={update.isPending}>
                            Save changes
                        </Button>
                    </div>
                </SheetFooter>

                <ConfirmDialog
                    open={confirmDeactivate}
                    onOpenChange={setConfirmDeactivate}
                    title="Deactivate topic?"
                    destructive
                    confirmLabel="Deactivate"
                    description={
                        <>
                            Deactivating <strong>{topic.label_en}</strong> purges its {topic.member_count} content/story mappings so it
                            stops contributing to affinity. Stored user preferences are kept. Save afterward to apply.
                        </>
                    }
                    onConfirm={() => {
                        setForm({ ...form, active: false });
                        setConfirmDeactivate(false);
                    }}
                />

                <ConfirmDialog
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    title="Delete topic permanently?"
                    destructive
                    confirmLabel="Delete forever"
                    confirmPhrase={topic.slug}
                    pending={del.isPending}
                    description={
                        <>
                            This permanently removes <strong>{topic.label_en}</strong>, all its content/story mappings, and every user&apos;s
                            declared pick + learned affinity for it. This cannot be undone — prefer <em>deactivate</em> unless you are sure.
                        </>
                    }
                    onConfirm={() =>
                        del.mutate(topic.id, {
                            onSuccess: () => {
                                setConfirmDelete(false);
                                onOpenChange(false);
                            },
                        })
                    }
                />
            </SheetContent>
        </Sheet>
    );
}
