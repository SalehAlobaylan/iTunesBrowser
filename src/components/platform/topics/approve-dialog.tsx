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
import { useApproveTopicProposal } from '@/hooks/use-topics';
import type { TopicProposal } from '@/types/platform/topics';
import { CategorySelect } from './category-select';

export function ApproveDialog({
    proposal,
    open,
    onOpenChange,
}: {
    proposal: TopicProposal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const approve = useApproveTopicProposal();
    const [form, setForm] = useState({ slug: '', label_en: '', label_ar: '', category_slug: '', featured: true });

    useEffect(() => {
        if (proposal) {
            setForm({
                slug: proposal.suggested_slug,
                label_en: proposal.suggested_label_en ?? '',
                label_ar: proposal.suggested_label_ar ?? '',
                category_slug: proposal.suggested_category ?? '',
                featured: true,
            });
        }
    }, [proposal]);

    if (!proposal) return null;

    const submit = () => {
        approve.mutate(
            {
                id: proposal.id,
                data: {
                    slug: form.slug,
                    label_en: form.label_en,
                    label_ar: form.label_ar,
                    category_slug: form.category_slug,
                    featured: form.featured,
                },
            },
            { onSuccess: () => onOpenChange(false) }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve proposal</DialogTitle>
                    <DialogDescription>
                        Review and edit before it becomes a canonical topic. It will be embedded and mapped against the corpus.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Slug</Label>
                        <Input value={form.slug} className="font-mono" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
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
                    <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        Featured in picker
                        <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={approve.isPending}>
                        Approve topic
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
