'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateTopicCategory, useUpdateTopicCategory } from '@/hooks/use-topics';
import type { TopicCategory } from '@/types/platform/topics';

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** null = create mode */
    category: TopicCategory | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
    const isEdit = !!category;
    const create = useCreateTopicCategory();
    const update = useUpdateTopicCategory();
    const [form, setForm] = useState({ slug: '', label_en: '', label_ar: '', sort_order: 0, active: true });

    useEffect(() => {
        if (open) {
            setForm(
                category
                    ? {
                          slug: category.slug,
                          label_en: category.label_en,
                          label_ar: category.label_ar,
                          sort_order: category.sort_order,
                          active: category.active,
                      }
                    : { slug: '', label_en: '', label_ar: '', sort_order: 0, active: true }
            );
        }
    }, [open, category]);

    const pending = create.isPending || update.isPending;

    const submit = () => {
        if (isEdit) {
            update.mutate(
                { slug: category!.slug, data: { label_en: form.label_en, label_ar: form.label_ar, sort_order: form.sort_order, active: form.active } },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            create.mutate(
                { slug: form.slug, label_en: form.label_en, label_ar: form.label_ar, sort_order: form.sort_order, active: form.active },
                { onSuccess: () => onOpenChange(false) }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
                    <DialogDescription>Parent groups for the topic vocabulary (bilingual).</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Slug</Label>
                        <Input
                            value={form.slug}
                            disabled={isEdit}
                            placeholder="e.g. economy"
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        />
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
                    <div className="grid grid-cols-2 items-end gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Sort order</Label>
                            <Input
                                type="number"
                                value={form.sort_order}
                                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <label className="flex h-10 items-center justify-between rounded-md border px-3 text-sm">
                            Active
                            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={pending || (!isEdit && !form.slug.trim())}>
                        {isEdit ? 'Save' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
