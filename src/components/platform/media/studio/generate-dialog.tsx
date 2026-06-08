'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { GenerateChaptersRequest, GenerateMode } from '@/types/platform/studio';

interface GenerateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (req: GenerateChaptersRequest) => void;
    isPending: boolean;
    hasChapters: boolean;
}

export function GenerateDialog({
    open,
    onOpenChange,
    onGenerate,
    isPending,
    hasChapters,
}: GenerateDialogProps) {
    const [mode, setMode] = useState<GenerateMode>('auto');
    const [count, setCount] = useState('5');
    const [durationMin, setDurationMin] = useState('10');
    const [minMin, setMinMin] = useState('');
    const [maxMin, setMaxMin] = useState('');
    const [withSummary, setWithSummary] = useState(true);

    const submit = () => {
        const req: GenerateChaptersRequest = { mode, with_summary: withSummary };
        if (mode === 'count') req.target_count = Math.max(1, Number(count) || 5);
        if (mode === 'duration') req.target_duration_sec = Math.max(60, (Number(durationMin) || 10) * 60);
        if (minMin) req.min_sec = Math.max(1, Number(minMin) * 60);
        if (maxMin) req.max_sec = Math.max(1, Number(maxMin) * 60);
        onGenerate(req);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate chapters</DialogTitle>
                    <DialogDescription>
                        AI segments the transcript into chapters. This produces a preview you can edit
                        before saving{hasChapters ? ' — it replaces the current working set' : ''}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Mode</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as GenerateMode)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto — natural, variable length</SelectItem>
                                <SelectItem value="count">Target number of chapters</SelectItem>
                                <SelectItem value="duration">Target chapter length</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === 'count' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="gc-count">Approx. number of chapters</Label>
                            <Input
                                id="gc-count"
                                type="number"
                                min="1"
                                value={count}
                                onChange={(e) => setCount(e.target.value)}
                                className="w-32"
                            />
                        </div>
                    )}

                    {mode === 'duration' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="gc-dur">Approx. minutes per chapter</Label>
                            <Input
                                id="gc-dur"
                                type="number"
                                min="1"
                                value={durationMin}
                                onChange={(e) => setDurationMin(e.target.value)}
                                className="w-32"
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="gc-min">Min length (min)</Label>
                            <Input
                                id="gc-min"
                                type="number"
                                min="0"
                                placeholder="—"
                                value={minMin}
                                onChange={(e) => setMinMin(e.target.value)}
                                className="w-28"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="gc-max">Max length (min)</Label>
                            <Input
                                id="gc-max"
                                type="number"
                                min="0"
                                placeholder="—"
                                value={maxMin}
                                onChange={(e) => setMaxMin(e.target.value)}
                                className="w-28"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2">
                        <Checkbox checked={withSummary} onCheckedChange={(v) => setWithSummary(v === true)} />
                        <span className="text-sm">Include a short summary per chapter</span>
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
