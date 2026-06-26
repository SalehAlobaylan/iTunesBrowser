'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCreateProfile, useUpdateProfile } from '@/hooks/use-discovery';
import type { DiscoveryProfile } from '@/types/platform/discovery';

const LANGS = [
    { v: 'ar', label: 'العربية' },
    { v: 'en', label: 'English' },
];

export function ProfileDialog({
    open,
    onClose,
    profile,
    category,
}: {
    open: boolean;
    onClose: () => void;
    profile?: DiscoveryProfile | null;
    // When set (e.g. 'media' for the For You hub), new interests are scoped to
    // that discovery category. Defaults to news.
    category?: 'news' | 'media';
}) {
    const create = useCreateProfile();
    const update = useUpdateProfile();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [draft, setDraft] = useState('');
    const [languages, setLanguages] = useState<string[]>(['ar']);
    const [maxPerRun, setMaxPerRun] = useState('15');

    useEffect(() => {
        if (open) {
            setName(profile?.name ?? '');
            setDescription(profile?.description ?? '');
            setKeywords(profile?.keywords ?? []);
            setLanguages(profile?.languages?.length ? profile.languages : ['ar']);
            setMaxPerRun(String(profile?.max_suggestions_per_run ?? 15));
            setDraft('');
        }
    }, [open, profile]);

    const addKeywords = (raw: string) => {
        const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length) setKeywords((k) => Array.from(new Set([...k, ...parts])));
        setDraft('');
    };
    const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeywords(draft);
        } else if (e.key === 'Backspace' && !draft && keywords.length) {
            setKeywords((k) => k.slice(0, -1));
        }
    };
    const removeKeyword = (kw: string) => setKeywords((k) => k.filter((x) => x !== kw));
    const toggleLang = (v: string) =>
        setLanguages((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]));

    const busy = create.isPending || update.isPending;
    const valid = name.trim().length > 0;

    const submit = async () => {
        const finalKeywords = draft.trim()
            ? Array.from(new Set([...keywords, ...draft.split(',').map((s) => s.trim()).filter(Boolean)]))
            : keywords;
        const payload = {
            name: name.trim(),
            description: description.trim(),
            keywords: finalKeywords,
            languages: languages.length ? languages : ['ar'],
            max_suggestions_per_run: Number(maxPerRun) || 15,
            // Preserve the existing profile's category on edit; otherwise apply the
            // hub default (media for For You, news otherwise).
            ...(profile?.category || category ? { category: profile?.category ?? category } : {}),
        };
        if (!payload.name) return;
        if (profile) {
            await update.mutateAsync({ id: profile.id, data: payload });
        } else {
            await create.mutateAsync(payload);
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{profile ? 'Edit interest' : 'New interest'}</DialogTitle>
                    <DialogDescription>
                        {(profile?.category ?? category) === 'media'
                            ? 'Wahb hunts for podcasts and YouTube channels matching this interest and ranks them for review.'
                            : 'Wahb hunts for news sources matching this interest and ranks them for review.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Saudi economy · اقتصاد سعودي" dir="auto" autoFocus />
                    </div>

                    {/* Keywords as chips */}
                    <div className="space-y-1.5">
                        <Label>Keywords</Label>
                        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-1 focus-within:ring-ring">
                            {keywords.map((kw) => (
                                <span key={kw} className="inline-flex items-center gap-1 rounded bg-news/10 px-2 py-0.5 text-xs text-news" dir="auto">
                                    {kw}
                                    <button type="button" onClick={() => removeKeyword(kw)} className="opacity-70 hover:opacity-100">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onDraftKey}
                                onBlur={() => draft.trim() && addKeywords(draft)}
                                placeholder={keywords.length ? 'Add another…' : 'Type a keyword and press Enter'}
                                dir="auto"
                                className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Add 3–6 specific terms — these drive discovery and relevance. Press Enter or comma to add.</p>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1.5">
                        <Label>Languages</Label>
                        <div className="flex gap-2">
                            {LANGS.map((l) => (
                                <button
                                    key={l.v}
                                    type="button"
                                    onClick={() => toggleLang(l.v)}
                                    className={cn(
                                        'rounded-md border px-3 py-1.5 text-sm transition-colors',
                                        languages.includes(l.v) ? 'border-news bg-news/5 text-foreground' : 'text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label>Description <span className="text-xs font-normal text-muted-foreground">— optional</span></Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A sentence describing what this interest covers. Sharpens relevance ranking."
                            dir="auto"
                            rows={2}
                        />
                    </div>

                    {/* Max per run */}
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="text-sm font-medium">Suggestions per run</p>
                            <p className="text-xs text-muted-foreground">How many candidates each discovery run scores.</p>
                        </div>
                        <Input type="number" min={1} value={maxPerRun} onChange={(e) => setMaxPerRun(e.target.value)} className="h-8 w-20" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button onClick={submit} disabled={busy || !valid}>
                        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {profile ? 'Save' : 'Create interest'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
