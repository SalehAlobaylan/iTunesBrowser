'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Sparkles, Loader2, Video, Podcast, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useMissingEnrichments,
    useTriggerEnrichment,
    useTriggerBatchEnrichment,
} from '@/hooks/use-enrichment';
import type {
    MissingEnrichmentsParams,
    MissingEnrichmentItem,
    EnrichmentArtifact,
} from '@/types/platform/enrichment';

// ── Artifact metadata ───────────────────────────────────────

interface ArtifactSpec {
    value: EnrichmentArtifact;
    label: string;
    badgeVariant: 'destructive' | 'secondary' | 'outline';
}

/** Is the given artifact missing for this item? */
function artifactMissing(item: MissingEnrichmentItem, artifact: EnrichmentArtifact): boolean {
    switch (artifact) {
        case 'transcript':
            return !item.has_transcript;
        case 'embedding':
            return !item.has_embedding;
        case 'sparse':
            return !item.has_sparse;
        case 'image':
            return !item.has_image_embedding;
        default:
            return false;
    }
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

// ── Props ────────────────────────────────────────────────────

interface MissingPanelProps {
    title: string;
    description: string;
    icon: ReactNode;
    /** Content types this panel scopes to, comma-joined for the CMS `type` query. */
    typeQuery: string;
    /** Type dropdown options (value passed to CMS `type`; '' would mean the panel default). */
    typeOptions: { value: string; label: string }[];
    /** Artifacts this panel manages — drives filter dropdown, badges, and triggers. */
    artifacts: ArtifactSpec[];
    isServiceUp: boolean;
}

const limit = 20;

export function MissingPanel({
    title,
    description,
    icon,
    typeQuery,
    typeOptions,
    artifacts,
    isServiceUp,
}: MissingPanelProps) {
    // Default missing filter = every artifact this panel manages (comma-joined).
    const allArtifacts = artifacts.map((a) => a.value).join(',');
    const [missingFilter, setMissingFilter] = useState<string>(allArtifacts);
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [offset, setOffset] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const triggerMutation = useTriggerEnrichment();
    const batchMutation = useTriggerBatchEnrichment();

    const params: MissingEnrichmentsParams = useMemo(
        () => ({
            missing: missingFilter || allArtifacts,
            // A specific type override narrows the panel scope; otherwise the
            // panel's full type set (e.g. VIDEO,PODCAST).
            type: typeFilter || typeQuery,
            status: 'READY',
            limit,
            offset,
        }),
        [missingFilter, typeFilter, offset, allArtifacts, typeQuery]
    );

    const { data: missing, isLoading } = useMissingEnrichments(params);

    const items = missing?.items ?? [];
    const total = missing?.total ?? 0;
    const hasNext = offset + limit < total;
    const hasPrev = offset > 0;

    // The artifacts currently in scope (single filter vs. "any").
    const activeArtifacts: EnrichmentArtifact[] = useMemo(() => {
        const picked = missingFilter
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean) as EnrichmentArtifact[];
        return picked.length > 0 ? picked : artifacts.map((a) => a.value);
    }, [missingFilter, artifacts]);

    // ── Selection helpers ────────────────────────────────────

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (items.length > 0 && selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map((i) => i.id)));
        }
    }

    function resetView() {
        setOffset(0);
        setSelectedIds(new Set());
    }

    // For batch: trigger every artifact currently in scope for the panel.
    function handleBatchEnrich() {
        const ids = Array.from(selectedIds).slice(0, 10);
        batchMutation.mutate(
            { ids, types: activeArtifacts },
            { onSuccess: () => setSelectedIds(new Set()) }
        );
    }

    // For a single row: trigger only the artifacts actually missing on it
    // (intersected with this panel's managed artifacts).
    function handleSingleEnrich(item: MissingEnrichmentItem) {
        const types = artifacts
            .map((a) => a.value)
            .filter((artifact) => artifactMissing(item, artifact));
        if (types.length > 0) {
            triggerMutation.mutate({ id: item.id, types });
        }
    }

    function missingBadges(item: MissingEnrichmentItem) {
        return artifacts
            .filter((a) => artifactMissing(item, a.value))
            .map((a) => (
                <Badge key={a.value} variant={a.badgeVariant} className="text-[10px]">
                    {a.label}
                </Badge>
            ));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {icon}
                            {title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBatchEnrich}
                            disabled={batchMutation.isPending || !isServiceUp}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {batchMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Enrich Selected ({Math.min(selectedIds.size, 10)})
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-3 mt-4">
                    <select
                        value={missingFilter}
                        onChange={(e) => {
                            setMissingFilter(e.target.value);
                            resetView();
                        }}
                        className="px-3 py-2 text-sm border rounded-md bg-background"
                    >
                        <option value={allArtifacts}>All Missing</option>
                        {artifacts.map((a) => (
                            <option key={a.value} value={a.value}>
                                Missing {a.label}
                            </option>
                        ))}
                    </select>
                    {typeOptions.length > 1 && (
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                resetView();
                            }}
                            className="px-3 py-2 text-sm border rounded-md bg-background"
                        >
                            {typeOptions.map((t) => (
                                <option key={t.value || 'all'} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <input
                                        type="checkbox"
                                        checked={
                                            items.length > 0 &&
                                            selectedIds.size === items.length
                                        }
                                        onChange={toggleSelectAll}
                                        className="rounded"
                                    />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="w-24">Type</TableHead>
                                <TableHead className="w-32">Source</TableHead>
                                <TableHead className="w-40">Missing</TableHead>
                                <TableHead className="w-28">Created</TableHead>
                                <TableHead className="w-24 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p>Nothing missing here — fully enriched!</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="rounded"
                                            />
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate font-medium">
                                            {item.title || 'Untitled'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {item.type === 'VIDEO' && (
                                                    <Video className="h-3 w-3 mr-1" />
                                                )}
                                                {item.type === 'PODCAST' && (
                                                    <Podcast className="h-3 w-3 mr-1" />
                                                )}
                                                {item.type === 'ARTICLE' && (
                                                    <FileText className="h-3 w-3 mr-1" />
                                                )}
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm truncate max-w-[120px]">
                                            {item.source_name || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {missingBadges(item)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(item.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() => handleSingleEnrich(item)}
                                                disabled={
                                                    triggerMutation.isPending || !isServiceUp
                                                }
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50 transition-colors"
                                            >
                                                {triggerMutation.isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-3 w-3" />
                                                )}
                                                Enrich
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {total > limit && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                                disabled={!hasPrev}
                                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setOffset((o) => o + limit)}
                                disabled={!hasNext}
                                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
