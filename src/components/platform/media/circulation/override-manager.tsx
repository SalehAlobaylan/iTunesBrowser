'use client';

import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/format';
import { useAllSources } from '@/hooks/use-sources';
import type { MediaCirculationOverride, MediaCirculationOverrideRequest } from '@/types/platform/media-circulation';

const OVERRIDE_TYPES: Array<{ value: string; label: string; hint: string }> = [
    { value: 'premium_source', label: 'Premium source', hint: 'Boost intake priority; never auto-pause' },
    { value: 'never_archive', label: 'Never archive', hint: 'Keep this content out of eviction' },
    { value: 'keep_latest_n_hot', label: 'Keep latest N hot', hint: 'Always protect the newest episodes' },
    { value: 'no_atomize', label: 'Do not atomize', hint: 'Block automated chaptering' },
    { value: 'editorial_hold', label: 'Editorial hold', hint: 'Freeze all automated actions' },
];

interface OverrideManagerProps {
    overrides: MediaCirculationOverride[];
    acting: boolean;
    onCreate: (data: MediaCirculationOverrideRequest) => void;
    onDelete: (id: string) => void;
}

export function OverrideManager({ overrides, acting, onCreate, onDelete }: OverrideManagerProps) {
    const [subjectKind, setSubjectKind] = useState('source');
    const [subjectID, setSubjectID] = useState('');
    const [overrideType, setOverrideType] = useState('premium_source');
    const [notes, setNotes] = useState('');

    const mediaSources = useAllSources({ category: 'media' });
    const sourceOptions = mediaSources.data ?? [];

    const selectedType = OVERRIDE_TYPES.find((t) => t.value === overrideType);
    const canSubmit = subjectID.trim().length > 0 && !acting;

    const submit = () => {
        if (!canSubmit) return;
        onCreate({
            subject_kind: subjectKind,
            subject_id: subjectID.trim(),
            override_type: overrideType,
            notes: notes.trim(),
        });
        setSubjectID('');
        setNotes('');
    };

    return (
        <section className="mt-8">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-news" />
                <h3 className="text-sm font-semibold">Human exceptions</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Standing rules the engine must respect before recommending anything — they outlive individual
                recommendation cycles.
            </p>

            <div className="mt-4 space-y-3 rounded-lg border border-border bg-background p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Rule</Label>
                        <Select value={overrideType} onValueChange={setOverrideType}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OVERRIDE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType && <p className="text-[11px] text-muted-foreground">{selectedType.hint}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Applies to</Label>
                        <Select
                            value={subjectKind}
                            onValueChange={(value) => {
                                setSubjectKind(value);
                                setSubjectID('');
                            }}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="source">A media source</SelectItem>
                                <SelectItem value="item">A single item</SelectItem>
                                <SelectItem value="family">An item family</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">{subjectKind === 'source' ? 'Source' : 'Item ID'}</Label>
                    {subjectKind === 'source' ? (
                        <Select value={subjectID} onValueChange={setSubjectID}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={mediaSources.isLoading ? 'Loading sources…' : 'Choose a media source'} />
                            </SelectTrigger>
                            <SelectContent>
                                {sourceOptions.map((source) => (
                                    <SelectItem key={source.id} value={source.id}>
                                        <span dir="auto">{source.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            value={subjectID}
                            onChange={(e) => setSubjectID(e.target.value)}
                            placeholder="Paste the content item ID"
                            className="h-9"
                        />
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Why (optional)</Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Shown in the recommendation's proof"
                        className="h-9"
                    />
                </div>

                <Button
                    type="button"
                    disabled={!canSubmit}
                    onClick={submit}
                    className="w-full bg-news text-news-foreground hover:bg-news/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add exception
                </Button>
            </div>

            <div className="mt-4 space-y-2">
                {overrides.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        No exceptions yet. The engine follows policy alone.
                    </p>
                ) : (
                    overrides.map((row) => (
                        <OverrideRow
                            key={row.id}
                            row={row}
                            sourceName={sourceOptions.find((s) => s.id === row.subject_id)?.name}
                            acting={acting}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

function OverrideRow({
    row,
    sourceName,
    acting,
    onDelete,
}: {
    row: MediaCirculationOverride;
    sourceName?: string;
    acting: boolean;
    onDelete: (id: string) => void;
}) {
    const label = OVERRIDE_TYPES.find((t) => t.value === row.override_type)?.label ?? row.override_type.replace(/_/g, ' ');
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn('border-news/40 bg-news/10 text-news')}>
                        {label}
                    </Badge>
                    <span className="text-xs capitalize text-muted-foreground">{row.subject_kind}</span>
                </div>
                <p className="mt-1.5 truncate text-sm font-medium" dir="auto">
                    {sourceName ?? row.subject_id}
                </p>
                {row.notes && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground" dir="auto">
                        {row.notes}
                    </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                    Added {formatRelativeTime(row.created_at)}
                    {row.set_by ? ` by ${row.set_by}` : ''}
                </p>
            </div>
            <Button
                size="sm"
                variant="ghost"
                disabled={acting}
                onClick={() => onDelete(row.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove exception</span>
            </Button>
        </div>
    );
}
