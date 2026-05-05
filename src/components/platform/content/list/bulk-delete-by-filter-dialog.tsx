'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { bulkDeleteContent, listSourceNames } from '@/lib/api/cms/content';
import { useQueryClient } from '@tanstack/react-query';
import { contentKeys } from '@/hooks/use-content';

interface BulkDeleteByFilterDialogProps {
    open: boolean;
    onClose: () => void;
}

export function BulkDeleteByFilterDialog({ open, onClose }: BulkDeleteByFilterDialogProps) {
    const queryClient = useQueryClient();
    const [sourceNames, setSourceNames] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        status: 'FAILED',
        source_name: '',
        created_before: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        dryRun: true,
    });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ deleted_count: number; message: string } | null>(null);

    useEffect(() => {
        if (open) {
            listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
            setResult(null);
        }
    }, [open]);

    const submit = async () => {
        setBusy(true);
        try {
            const res = await bulkDeleteContent({
                status: filters.status || undefined,
                source_name: filters.source_name || undefined,
                created_before: filters.created_before
                    ? `${filters.created_before}Z`
                    : undefined,
                dry_run: filters.dryRun,
            });
            setResult(res);
            if (!filters.dryRun) {
                toast({
                    title: 'Content deleted',
                    description: `Deleted ${res.deleted_count} items`,
                    variant: 'success',
                });
                queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
                queryClient.invalidateQueries({ queryKey: contentKeys.statusCounts() });
            }
        } catch (err) {
            toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk delete by filter</DialogTitle>
                    <DialogDescription>
                        Sweep large amounts of content matching a filter. For deleting a
                        small list of specific rows, use row selection instead.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status}
                            onValueChange={(v) => setFilters({ ...filters, status: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FAILED">FAILED</SelectItem>
                                <SelectItem value="PENDING">PENDING</SelectItem>
                                <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                <SelectItem value="READY">READY</SelectItem>
                                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Source (optional)</Label>
                        <Select
                            value={filters.source_name || 'all'}
                            onValueChange={(v) =>
                                setFilters({
                                    ...filters,
                                    source_name: v === 'all' ? '' : v,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                {sourceNames.map((n) => (
                                    <SelectItem key={n} value={n}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Created before</Label>
                        <Input
                            type="datetime-local"
                            value={filters.created_before}
                            onChange={(e) =>
                                setFilters({ ...filters, created_before: e.target.value })
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={filters.dryRun}
                            onCheckedChange={(c) =>
                                setFilters({ ...filters, dryRun: Boolean(c) })
                            }
                        />
                        Preview only (don&apos;t delete)
                    </label>
                    {result && (
                        <div
                            className={`rounded-md p-3 ${
                                filters.dryRun ? 'bg-muted' : 'bg-emerald-500/10'
                            }`}
                        >
                            <p className="text-sm font-medium">{result.message}</p>
                            <p className="text-2xl font-bold">{result.deleted_count} items</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={busy}>
                        Close
                    </Button>
                    <Button variant="destructive" onClick={submit} disabled={busy}>
                        {busy ? 'Working…' : filters.dryRun ? 'Preview' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
