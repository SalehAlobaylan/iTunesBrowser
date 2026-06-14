'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Pencil, Trash2, Loader2, Radar, Check, X, Eye, Lightbulb, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRunSource, useDeleteSource } from '@/hooks/use-sources';
import { usePreviewSource } from '@/hooks/use-source-preview';
import { SourceRowActions } from '@/components/platform/sources/list/source-row-actions';
import { PreviewTable } from '@/components/platform/sources/wizard/preview-table';
import type { ContentSource } from '@/types/platform/source';
import {
    useProfiles,
    useNewsSources,
    useSuggestions,
    useRunProfile,
    useDeleteProfile,
    useCreateProfile,
    useSuggestProfiles,
    useApproveSuggestion,
    useRejectSuggestion,
    useBulkApprove,
    useBulkReject,
    discoveryKeys,
} from '@/hooks/use-discovery';
import type { DiscoveryProfile, NewsSource, SourceSuggestion } from '@/types/platform/discovery';
import { NewsSectionNav } from '@/components/platform/news/news-section-nav';
import { ProfileDialog } from './profile-dialog';

const ALL = '__all__';
// Cross-Arabic-news cosine has a high baseline, so on-topic relevance lands in
// the ~0.12–0.25 band; the "hide low" filter trims clearly off-topic candidates.
const LOW_RELEVANCE = 0.1;

function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function sourceHealth(s: NewsSource): { label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' } {
    if (!s.is_active) return { label: 'paused', variant: 'secondary' };
    if (!s.last_item_at) return { label: 'new', variant: 'outline' };
    const ageDays = (Date.now() - new Date(s.last_item_at).getTime()) / 86_400_000;
    if (ageDays <= 3) return { label: 'live', variant: 'success' };
    return { label: 'stale', variant: 'warning' };
}

function pctVariant(v: number): 'success' | 'warning' | 'secondary' {
    if (v >= 0.7) return 'success';
    if (v >= 0.5) return 'warning';
    return 'secondary';
}

export function FindingPage() {
    const qc = useQueryClient();
    const { data: profilesData, isLoading: profilesLoading } = useProfiles();
    const profiles = profilesData?.data ?? [];

    const [selected, setSelected] = useState<string>(ALL);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<DiscoveryProfile | null>(null);
    const [hideLow, setHideLow] = useState(false);
    const [previewTarget, setPreviewTarget] = useState<SourceSuggestion | null>(null);
    const [suggestOpen, setSuggestOpen] = useState(false);

    const profileId = selected === ALL ? undefined : selected;
    const selectedProfile = profiles.find((p) => p.id === selected) ?? null;

    const { data: sourcesData, isLoading: sourcesLoading } = useNewsSources(profileId);
    const { data: suggestionsData, isLoading: suggestionsLoading } = useSuggestions(profileId, 'PENDING');

    const sources = sourcesData?.data ?? [];
    const allSuggestions = suggestionsData?.data ?? [];

    // Treat unscored (null relevance — Enrichment was down) as visible.
    const suggestions = useMemo(
        () => (hideLow ? allSuggestions.filter((s) => (s.relevance_score ?? 1) >= LOW_RELEVANCE) : allSuggestions),
        [allSuggestions, hideLow]
    );

    const runProfile = useRunProfile();
    const deleteProfile = useDeleteProfile();
    const approve = useApproveSuggestion();
    const reject = useRejectSuggestion();
    const bulkApprove = useBulkApprove();
    const bulkReject = useBulkReject();

    const deleteSourceHook = useDeleteSource();
    const handleDeleteSource = (id: string, name: string) => {
        if (!confirm(`Remove source "${name}"?`)) return;
        deleteSourceHook.mutate(id, {
            onSuccess: () => qc.invalidateQueries({ queryKey: [...discoveryKeys.all, 'sources'] }),
        });
    };

    const pendingIds = useMemo(() => suggestions.map((s) => s.id), [suggestions]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="brand-overline text-news">News Center</span>
                    <h1 className="font-editorial text-3xl font-bold tracking-tight">Feeds Finding</h1>
                    <p className="text-muted-foreground">
                        Auto-discover news sources by interest, review suggestions, and manage your live feeds.
                    </p>
                </div>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    New profile
                </Button>
            </div>

            <NewsSectionNav />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
                {/* Profiles rail */}
                <aside className="space-y-1">
                    <button
                        type="button"
                        onClick={() => setSelected(ALL)}
                        className={cn(
                            'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm',
                            selected === ALL ? 'bg-accent font-medium' : 'hover:bg-muted'
                        )}
                    >
                        <span>All news sources</span>
                    </button>
                    {profilesLoading && <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>}
                    {profiles.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelected(p.id)}
                            className={cn(
                                'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm',
                                selected === p.id ? 'bg-accent font-medium' : 'hover:bg-muted'
                            )}
                        >
                            <span className="truncate">{p.name}</span>
                            {!p.enabled && <Badge variant="secondary" className="shrink-0">off</Badge>}
                        </button>
                    ))}
                    {!profilesLoading && profiles.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            No profiles yet. Create one to start discovering sources.
                        </p>
                    )}
                    <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={() => setSuggestOpen(true)}>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Suggest from topics
                    </Button>
                </aside>

                {/* Main column */}
                <div className="space-y-6">
                    {/* Profile actions */}
                    {selectedProfile && (
                        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
                            <div className="mr-auto">
                                <p className="font-medium">{selectedProfile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedProfile.keywords.length > 0 ? selectedProfile.keywords.join(', ') : 'No keywords'}
                                    {selectedProfile.last_run_at ? ` · last run ${formatDate(selectedProfile.last_run_at)}` : ''}
                                </p>
                            </div>
                            <Button onClick={() => runProfile.mutate(selectedProfile.id)} disabled={runProfile.isPending}>
                                {runProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Run discovery
                            </Button>
                            <Button variant="outline" onClick={() => { setEditing(selectedProfile); setDialogOpen(true); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (confirm(`Delete profile "${selectedProfile.name}"? Its active sources stay, just ungrouped.`)) {
                                        deleteProfile.mutate(selectedProfile.id);
                                        setSelected(ALL);
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}

                    {/* Suggestions */}
                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Radar className="h-4 w-4 text-news" />
                                Suggestions
                                {suggestions.length > 0 && <Badge variant="info">{suggestions.length}</Badge>}
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={hideLow ? 'default' : 'outline'}
                                    onClick={() => setHideLow((v) => !v)}
                                    title="Hide suggestions below 25% relevance"
                                >
                                    <Filter className="mr-1 h-3.5 w-3.5" />
                                    {hideLow ? 'Showing strong' : 'Hide low relevance'}
                                </Button>
                                {suggestions.length > 0 && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => bulkApprove.mutate(pendingIds)} disabled={bulkApprove.isPending}>
                                            Approve all
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => bulkReject.mutate(pendingIds)} disabled={bulkReject.isPending}>
                                            Reject all
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Relevance</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suggestionsLoading && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                                    )}
                                    {!suggestionsLoading && suggestions.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No pending suggestions. {selectedProfile ? 'Run discovery to find sources.' : ''}
                                        </TableCell></TableRow>
                                    )}
                                    {suggestions.map((s) => (
                                        <SuggestionRow
                                            key={s.id}
                                            suggestion={s}
                                            onApprove={() => approve.mutate(s.id)}
                                            onReject={() => reject.mutate({ id: s.id })}
                                            onPreview={() => setPreviewTarget(s)}
                                            busy={approve.isPending || reject.isPending}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>

                    {/* Active sources */}
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Active sources {sources.length > 0 && <span className="text-muted-foreground">({sources.length})</span>}</h2>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Items</TableHead>
                                        <TableHead className="text-right">Failed</TableHead>
                                        <TableHead>Last item</TableHead>
                                        <TableHead className="text-right">Engagement</TableHead>
                                        <TableHead>Health</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sourcesLoading && (
                                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                                    )}
                                    {!sourcesLoading && sources.length === 0 && (
                                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No active sources yet — approve a suggestion to add one.</TableCell></TableRow>
                                    )}
                                    {sources.map((s) => (
                                        <ActiveSourceRow
                                            key={s.id}
                                            source={s}
                                            onDelete={() => handleDeleteSource(s.id, s.name)}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </div>
            </div>

            <ProfileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} profile={editing} />
            {previewTarget && <PreviewDialog suggestion={previewTarget} onClose={() => setPreviewTarget(null)} />}
            {suggestOpen && <SuggestProfilesDialog onClose={() => setSuggestOpen(false)} />}
        </div>
    );
}

function ActiveSourceRow({ source, onDelete }: { source: NewsSource; onDelete: () => void }) {
    const run = useRunSource();
    const health = sourceHealth(source);
    const running = run.isPending && run.variables === source.id;
    return (
        <TableRow>
            <TableCell className="font-medium">{source.name}</TableCell>
            <TableCell><Badge variant="outline">{source.type}</Badge></TableCell>
            <TableCell><Badge variant={source.category === 'media' ? 'info' : 'outline'}>{source.category ?? 'news'}</Badge></TableCell>
            <TableCell className="text-right">{source.items_count}</TableCell>
            <TableCell className={cn('text-right', source.failed > 0 && 'text-destructive')}>{source.failed}</TableCell>
            <TableCell>{formatDate(source.last_item_at)}</TableCell>
            <TableCell className="text-right">{source.engagement}</TableCell>
            <TableCell><Badge variant={health.variant}>{health.label}</Badge></TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => run.mutate(source.id)} disabled={running}>
                        {running ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                        Run
                    </Button>
                    <SourceRowActions source={source as unknown as ContentSource} onDelete={onDelete} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function SuggestionRow({
    suggestion,
    onApprove,
    onReject,
    onPreview,
    busy,
}: {
    suggestion: SourceSuggestion;
    onApprove: () => void;
    onReject: () => void;
    onPreview: () => void;
    busy: boolean;
}) {
    const sample = suggestion.sample_items ?? [];
    const rel = suggestion.relevance_score;
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{suggestion.name}</div>
                <a href={suggestion.feed_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
                    {suggestion.feed_url}
                </a>
                {sample.length > 0 && (
                    <div className="mt-1 max-w-md truncate text-xs text-muted-foreground" title={sample.map((i) => i.title).join('\n')}>
                        {sample[0].title}
                        {sample.length > 1 ? ` · +${sample.length - 1} more` : ''}
                    </div>
                )}
            </TableCell>
            <TableCell><Badge variant="outline">{suggestion.type}</Badge></TableCell>
            <TableCell>
                {rel == null ? (
                    <span className="text-xs text-muted-foreground">—</span>
                ) : (
                    <Badge variant={pctVariant(rel)}>{Math.round(rel * 100)}%</Badge>
                )}
            </TableCell>
            <TableCell><Badge variant={pctVariant(suggestion.confidence)}>{Math.round(suggestion.confidence * 100)}%</Badge></TableCell>
            <TableCell>{suggestion.health?.items_count ?? '—'}</TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Preview items" onClick={onPreview}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Approve" onClick={onApprove} disabled={busy}>
                        <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Reject" onClick={onReject} disabled={busy}>
                        <X className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function PreviewDialog({ suggestion, onClose }: { suggestion: SourceSuggestion; onClose: () => void }) {
    const preview = usePreviewSource();
    useEffect(() => {
        preview.mutate({ sourceType: 'RSS', url: suggestion.feed_url });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suggestion.feed_url]);

    const items = preview.data?.items;
    const sample = suggestion.sample_items ?? [];

    return (
        <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Preview — {suggestion.name}</DialogTitle>
                </DialogHeader>
                {preview.isPending && <p className="py-6 text-center text-sm text-muted-foreground">Fetching recent items…</p>}
                {!preview.isPending && items && items.length > 0 && <PreviewTable items={items} />}
                {!preview.isPending && (!items || items.length === 0) && (
                    <div className="space-y-1">
                        {sample.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No items to preview.</p>}
                        {sample.map((it, i) => (
                            <div key={i} className="border-b py-1 text-sm last:border-0">{it.title}</div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SuggestProfilesDialog({ onClose }: { onClose: () => void }) {
    const suggest = useSuggestProfiles();
    const create = useCreateProfile();
    const [added, setAdded] = useState<Set<string>>(new Set());

    useEffect(() => {
        suggest.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const drafts = suggest.data?.data ?? [];

    return (
        <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Suggested profiles from topics</DialogTitle>
                </DialogHeader>
                {suggest.isPending && <p className="py-6 text-center text-sm text-muted-foreground">Reading your topics…</p>}
                {!suggest.isPending && drafts.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No new topic-based suggestions.</p>
                )}
                <div className="space-y-2">
                    {drafts.map((d) => (
                        <div key={d.name} className="flex items-center justify-between gap-3 rounded-md border p-2">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{d.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {d.keywords.join(', ') || '—'} · {d.article_count} articles
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={added.has(d.name) || create.isPending}
                                onClick={async () => {
                                    await create.mutateAsync({
                                        name: d.name,
                                        description: d.description,
                                        keywords: d.keywords,
                                        languages: ['ar', 'en'],
                                    });
                                    setAdded((p) => new Set(p).add(d.name));
                                }}
                            >
                                {added.has(d.name) ? 'Added' : 'Create'}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
