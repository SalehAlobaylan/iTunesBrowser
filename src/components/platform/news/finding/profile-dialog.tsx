'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateProfile, useUpdateProfile } from '@/hooks/use-discovery';
import type { DiscoveryProfile } from '@/types/platform/discovery';

export function ProfileDialog({
    open,
    onClose,
    profile,
}: {
    open: boolean;
    onClose: () => void;
    profile?: DiscoveryProfile | null;
}) {
    const create = useCreateProfile();
    const update = useUpdateProfile();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [keywords, setKeywords] = useState('');
    const [languages, setLanguages] = useState('ar, en');
    const [maxSuggestions, setMaxSuggestions] = useState('10');

    useEffect(() => {
        if (open) {
            setName(profile?.name ?? '');
            setDescription(profile?.description ?? '');
            setKeywords((profile?.keywords ?? []).join(', '));
            setLanguages((profile?.languages ?? ['ar', 'en']).join(', '));
            setMaxSuggestions(String(profile?.max_suggestions_per_run ?? 10));
        }
    }, [open, profile]);

    const busy = create.isPending || update.isPending;

    const submit = async () => {
        const payload = {
            name: name.trim(),
            description: description.trim(),
            keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
            languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
            max_suggestions_per_run: Number(maxSuggestions) || 10,
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{profile ? 'Edit interest profile' : 'New interest profile'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Saudi economy" />
                    </div>
                    <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What this interest covers — guides discovery."
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Keywords (comma-separated)</Label>
                        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="economy, inflation, budget" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Languages</Label>
                            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="ar, en" />
                        </div>
                        <div className="space-y-1">
                            <Label>Max per run</Label>
                            <Input type="number" value={maxSuggestions} onChange={(e) => setMaxSuggestions(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button onClick={submit} disabled={busy || !name.trim()}>{profile ? 'Save' : 'Create'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
