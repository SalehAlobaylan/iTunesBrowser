'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Sparkles, Loader2, Video, Podcast, FileText, Zap } from 'lucide-react';
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
    useMissingCount,
    useTriggerEnrichment,
    useTriggerAllEnrichment,
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

const limit = 20;

// ── "Enrich all" button (owns its own live count) ───────────

interface EnrichAllButtonProps {
    label: string;
    /** `missing` query value used to count matching items (artifact or comma-list). */
    missingKey: string;
    /** Artifact types to trigger. */
    triggerTypes: string[];
    /** Content-type scope (e.g. "VIDEO,PODCAST"). */
    type: string;
    disabled: boolean;
    primary?: boolean;
    onTrigger: (types: string[]) => void;
}

function EnrichAllButton({
    label,
    missingKey,
    triggerTypes,
    type,
    disabled,
    primary,
    onTrigger,
}: EnrichAllButtonProps) {
    const { data: count = 0, isLoading } = useMissingCount(missingKey, type);

    const cls = primary
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : 'bg-primary/10 text-primary hover:bg-primary/20';

    return (
        <button
            onClick={() => onTrigger(triggerTypes)}
            disabled={disabled || count === 0}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${cls}`}
            title={count === 0 ? `No items missing ${label}` : `Enrich all ${count} missing ${label}`}
        >
            <Zap className="h-4 w-4" />
            <span>Enrich all {label}</span>
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-background/30 text-xs font-semibold">
                {isLoading ? '…' : count}
            </span>
        </button>
    );
}

// ── Props ────────────────────────────────────────────────────

interface MissingPanelProps {
    title: string;
    description: string;
    icon: ReactNode;
    /** Content types this panel scopes to, comma-joined for the CMS `type` query. */
    typeQuery: string;
    /** Type dropdown options (''=panel default, i.e. the full typeQuery set). */
    typeOptions: { value: string; label: string }[];
    /** Artifacts this panel manages — drives buttons, filters, badges, triggers. */
    artifacts: ArtifactSpec[];
    isServiceUp: boolean;
    /** A background bulk run is active anywhere → disable all triggers. */
    bulkRunning: boolean;
}

export function MissingPanel({
    title,
    description,
    icon,
    typeQuery,
    typeOptions,
    artifacts,
    isServiceUp,
    bulkRunning,
}: MissingPanelProps) {
    const allArtifacts = artifacts.map((a) => a.value).join(',');
    const [artifactFilter, setArtifactFilter] = useState<string>(''); // ''=all
    const [typeFilter, setTypeFilter] = useState<string>(''); // ''=panel default
    const [offset, setOffset] = useState(0);

    const triggerMutation = useTriggerEnrichment();
    const triggerAllMutation = useTriggerAllEnrichment();

    const effectiveType = typeFilter || typeQuery;
    const listMissing = artifactFilter || allArtifacts;

    const params: MissingEnrichmentsParams = useMemo(
        () => ({
            missing: listMissing,
            type: effectiveType,
            status: 'READY',
            limit,
            offset,
        }),
        [listMissing, effectiveType, offset]
    );

    const { data: missing, isLoading } = useMissingEnrichments(params);

    const items = missing?.items ?? [];
    const total = missing?.total ?? 0;
    const hasNext = offset + limit < total;
    const hasPrev = offset > 0;

    const triggersDisabled = !isServiceUp || bulkRunning;

    function resetView() {
        setOffset(0);
    }

    function handleEnrichAll(types: string[]) {
        triggerAllMutation.mutate({ types, type: effectiveType });
    }

    // Per-row: trigger only the artifacts actually missing on that row.
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
            <CardHeader className="gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {icon}
                            {title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>
                    {typeOptions.length > 1 && (
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                resetView();
                            }}
                            className="shrink-0 px-3 py-2 text-sm border rounded-md bg-background"
                        >
                            {typeOptions.map((t) => (
                                <option key={t.value || 'all'} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Bulk actions — one per artifact + a combined "everything" */}
                <div className="flex flex-wrap items-center gap-2">
                    {artifacts.map((a) => (
                        <EnrichAllButton
                            key={a.value}
                            label={a.label}
                            missingKey={a.value}
                            triggerTypes={[a.value]}
                            type={effectiveType}
                            disabled={triggersDisabled}
                            onTrigger={handleEnrichAll}
                        />
                    ))}
                    {artifacts.length > 1 && (
                        <EnrichAllButton
                            label="Missing"
                            missingKey={allArtifacts}
                            triggerTypes={artifacts.map((a) => a.value)}
                            type={effectiveType}
                            disabled={triggersDisabled}
                            primary
                            onTrigger={handleEnrichAll}
                        />
                    )}
                </div>

                {/* Table filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Show:</span>
                    <FilterChip
                        active={artifactFilter === ''}
                        onClick={() => {
                            setArtifactFilter('');
                            resetView();
                        }}
                    >
                        All ({total})
                    </FilterChip>
                    {artifacts.map((a) => (
                        <FilterChip
                            key={a.value}
                            active={artifactFilter === a.value}
                            onClick={() => {
                                setArtifactFilter(a.value);
                                resetView();
                            }}
                        >
                            {a.label}
                        </FilterChip>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p>Nothing missing here — fully enriched!</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="max-w-[220px] truncate font-medium">
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
                                                disabled={triggersDisabled}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

// ── Small filter chip ───────────────────────────────────────

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
            }`}
        >
            {children}
        </button>
    );
}
