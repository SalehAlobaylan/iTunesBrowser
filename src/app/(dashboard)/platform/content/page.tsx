'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Trash2, Zap } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useContent } from '@/hooks/use-content';
import { bulkDeleteContent, listSourceNames } from '@/lib/api/cms/content';
import { purgeQueues } from '@/lib/api/aggregation';
import {
    CONTENT_TYPE_LABELS,
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_VARIANTS,
} from '@/types/platform/content';
import type { ContentType, ContentStatus } from '@/types/platform/content';
import { toast } from '@/components/ui/toast';

export default function ContentPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
    const [purgeQueue, setPurgeQueue] = useState<string>('all');
    const [purgeStates, setPurgeStates] = useState<Record<string, boolean>>({
        waiting: true,
        delayed: true,
        active: true,
        completed: false,
        failed: true,
    });
    const [purgeResult, setPurgeResult] = useState<{ message: string; purged: Record<string, number> } | null>(null);
    const defaultCreatedBefore = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const [deleteFilters, setDeleteFilters] = useState({
        status: 'FAILED',
        source_name: '',
        created_before: defaultCreatedBefore,
        dryRun: true,
    });
    const [deleteResult, setDeleteResult] = useState<{ deleted_count: number; message: string } | null>(null);

    const limit = 10;
    const { data, isLoading, error, refetch } = useContent({
        page,
        limit,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as ContentStatus),
        type: typeFilter === 'all' ? undefined : (typeFilter as ContentType),
    });

    // Fetch all distinct source names from CMS for bulk-delete filter
    const [sourceNames, setSourceNames] = useState<string[]>([]);
    useEffect(() => {
        if (deleteDialogOpen) {
            listSourceNames().then(setSourceNames).catch(() => setSourceNames([]));
        }
    }, [deleteDialogOpen]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [isPurging, setIsPurging] = useState(false);

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await bulkDeleteContent({
                status: deleteFilters.status || undefined,
                source_name: deleteFilters.source_name || undefined,
                created_before: deleteFilters.created_before ? deleteFilters.created_before + 'Z' : undefined,
                dry_run: deleteFilters.dryRun,
            });
            
            setDeleteResult(result);
            if (!deleteFilters.dryRun) {
                toast({ title: 'Content deleted', description: `Deleted ${result.deleted_count} items` });
                refetch();
            }
        } catch (error) {
            toast({ 
                title: 'Delete failed', 
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePurgeQueues = async () => {
        const selectedStates = Object.entries(purgeStates)
            .filter(([, v]) => v)
            .map(([k]) => k);
        if (selectedStates.length === 0) return;

        setIsPurging(true);
        setPurgeResult(null);
        try {
            const result = await purgeQueues({
                queue: purgeQueue === 'all' ? undefined : purgeQueue,
                states: selectedStates,
            });
            setPurgeResult({ message: result.message, purged: result.purged });
            toast({
                title: 'Queues purged',
                description: result.message
            });
        } catch (error) {
            toast({
                title: 'Purge failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            });
        } finally {
            setIsPurging(false);
        }
    };

    const openDeleteDialog = (dryRun: boolean) => {
        setDeleteFilters({ ...deleteFilters, dryRun });
        setDeleteResult(null);
        setDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content</h1>
                <p className="text-muted-foreground">
                    Browse and manage ingested content items
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by title..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                        setStatusFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                        setTypeFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-2 mr-auto">
                    <Dialog open={purgeDialogOpen} onOpenChange={(open) => { setPurgeDialogOpen(open); if (!open) setPurgeResult(null); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Zap className="h-4 w-4 mr-2" />
                                Purge Queues
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Purge Queues</DialogTitle>
                                <DialogDescription>
                                    Remove jobs from aggregation queues. Active jobs will be force-stopped.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Queue</Label>
                                    <Select value={purgeQueue} onValueChange={setPurgeQueue}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select queue" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Queues</SelectItem>
                                            <SelectItem value="fetch-queue">Fetch (RSS/YouTube/X scraping)</SelectItem>
                                            <SelectItem value="normalize-queue">Normalize (content normalization)</SelectItem>
                                            <SelectItem value="media-queue">Media (FFmpeg transcode/thumbnails)</SelectItem>
                                            <SelectItem value="ai-queue">AI (transcription/embeddings)</SelectItem>
                                            <SelectItem value="aggregation-dlq">Dead Letter Queue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Job States to Purge</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'waiting', label: 'Waiting', desc: 'Queued, not started' },
                                            { key: 'delayed', label: 'Delayed', desc: 'Scheduled for later' },
                                            { key: 'active', label: 'Active', desc: 'Running now (FFmpeg, etc.)' },
                                            { key: 'failed', label: 'Failed', desc: 'Errored out' },
                                            { key: 'completed', label: 'Completed', desc: 'Already finished' },
                                        ].map(({ key, label, desc }) => (
                                            <div key={key} className="flex items-start gap-2">
                                                <Checkbox
                                                    id={`purge-${key}`}
                                                    checked={purgeStates[key]}
                                                    onCheckedChange={(checked) =>
                                                        setPurgeStates((prev) => ({ ...prev, [key]: checked as boolean }))
                                                    }
                                                />
                                                <div>
                                                    <Label htmlFor={`purge-${key}`} className="text-sm font-medium">{label}</Label>
                                                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {purgeStates.active && (
                                    <p className="text-xs text-amber-600">
                                        Workers will be paused to force-stop active jobs (e.g. FFmpeg transcodes), then resumed.
                                    </p>
                                )}
                                {purgeResult && (
                                    <div className="p-3 rounded-md bg-muted space-y-1">
                                        <p className="font-medium text-sm">{purgeResult.message}</p>
                                        {Object.entries(purgeResult.purged).map(([queue, count]) => (
                                            <p key={queue} className="text-xs text-muted-foreground">
                                                {queue}: {count} jobs removed
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setPurgeDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handlePurgeQueues} disabled={isPurging}>
                                    {isPurging ? 'Purging...' : 'Purge'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Bulk Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Delete Content</DialogTitle>
                                <DialogDescription>
                                    Delete multiple content items based on filters. This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={deleteFilters.status}
                                        onValueChange={(v) => setDeleteFilters({ ...deleteFilters, status: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FAILED">FAILED</SelectItem>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                            <SelectItem value="READY">READY</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Source (optional)</Label>
                                    <Select
                                        value={deleteFilters.source_name || 'all'}
                                        onValueChange={(v) => setDeleteFilters({ ...deleteFilters, source_name: v === 'all' ? '' : v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All sources" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All sources</SelectItem>
                                            {sourceNames.map(name => (
                                                <SelectItem key={name} value={name}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Created before</Label>
                                    <Input
                                        type="datetime-local"
                                        value={deleteFilters.created_before}
                                        onChange={(e) => setDeleteFilters({ ...deleteFilters, created_before: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="dryRun"
                                        checked={deleteFilters.dryRun}
                                        onCheckedChange={(checked) => setDeleteFilters({ ...deleteFilters, dryRun: checked as boolean })}
                                    />
                                    <Label htmlFor="dryRun">Preview only (don&apos;t delete)</Label>
                                </div>
                                {deleteResult && (
                                    <div className={`p-3 rounded-md ${deleteFilters.dryRun ? 'bg-muted' : 'bg-green-50'}`}>
                                        <p className="font-medium">{deleteResult.message}</p>
                                        <p className="text-2xl font-bold">{deleteResult.deleted_count} items</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : deleteFilters.dryRun ? 'Preview' : 'Delete'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-destructive py-8">
                                    Failed to load content. Please try again.
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No content found. Content will appear here once sources are ingested.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Link
                                            href={`/platform/content/${item.id}`}
                                            className="font-medium hover:underline line-clamp-1"
                                        >
                                            {item.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {CONTENT_TYPE_LABELS[item.type as ContentType]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={CONTENT_STATUS_VARIANTS[item.status as ContentStatus]}>
                                            {CONTENT_STATUS_LABELS[item.status as ContentStatus]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.source_name || '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.published_at
                                            ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true })
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {item.original_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    title="View Original"
                                                >
                                                    <a href={item.original_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/platform/content/${item.id}`}>View</Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(data.total_pages, 5) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <PaginationItem key={pageNum}>
                                    <PaginationLink
                                        onClick={() => setPage(pageNum)}
                                        isActive={pageNum === page}
                                        className="cursor-pointer"
                                    >
                                        {pageNum}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                                className={page >= data.total_pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
