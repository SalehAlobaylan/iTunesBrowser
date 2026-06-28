'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Play, Trash2, Loader2, Radar, Check, X, Youtube, Podcast,
    Captions, Scissors, Network, Settings2, Radio, Eye, AudioLines, Upload,
    ChevronDown, TrendingDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import {
    useProfiles,
    useSuggestions,
    useNewsSources,
    useRunProfile,
    useDeleteProfile,
    useApproveSuggestion,
    useRejectSuggestion,
    useBulkApprove,
    useBulkReject,
    useDiscoveryConfig,
    useUpdateDiscoveryConfig,
    useBuildGraph,
    useImportYouTubeFeed,
    useImportYouTubeLinks,
} from '@/hooks/use-discovery';
import type { DiscoveryProfile, SourceSuggestion, DiscoveryConfig } from '@/types/platform/discovery';
import { ProfileDialog } from '@/components/platform/news/finding/profile-dialog';

const ALL = '__all__';

function formatSubscribers(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    return String(n);
}

function platformOf(type: string): { label: string; icon: typeof Youtube } {
    if (type === 'YOUTUBE') return { label: 'YouTube', icon: Youtube };
    return { label: 'Podcast', icon: Podcast };
}

function captionMeta(state?: string): { label: string; variant: 'success' | 'warning' | 'secondary' } | null {
    if (state === 'youtube_human') return { label: 'Captioned', variant: 'success' };
    if (state === 'youtube_auto') return { label: 'Auto-captions', variant: 'warning' };
    if (state === 'none') return { label: 'No transcript', variant: 'secondary' };
    return null;
}

function MediaSuggestionCard({ suggestion, onApprove, onReject, busy }: {
    suggestion: SourceSuggestion;
    onApprove: () => void;
    onReject: () => void;
    busy: boolean;
}) {
    const { label: platform, icon: Icon } = platformOf(suggestion.type);
    const ev = suggestion.evidence;
    const name = suggestion.health?.bio || suggestion.name;
    const caption = captionMeta(ev?.caption_state);
    const subs = ev?.subscribers ?? suggestion.health?.subscribers ?? 0;
    const sample = suggestion.sample_items ?? [];
    // Audio-first detection (YouTube). Podcasts are audio by nature → no badge.
    const audioFirst = suggestion.type === 'YOUTUBE' ? suggestion.health?.audio_first : undefined;
    const category = suggestion.health?.category;

    return (
        <Card className="flex flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                    {suggestion.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={suggestion.image_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate font-semibold" dir="auto">{name}</span>
                            <Badge variant="outline" className="shrink-0 gap-1">
                                <Icon className="h-3 w-3" /> {platform}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                            {subs > 0 && <span className="rounded bg-muted px-1.5 py-0.5">{formatSubscribers(subs)} subscribers</span>}
                            {suggestion.health?.is_podcast && (
                                <span className="inline-flex items-center gap-1 rounded bg-gold/10 px-1.5 py-0.5 text-gold">
                                    <Podcast className="h-3 w-3" /> Podcast{suggestion.health?.episode_count ? ` · ${suggestion.health.episode_count} ep` : ''}
                                </span>
                            )}
                            {audioFirst === false && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600">
                                    <Eye className="h-3 w-3" /> Visual{category ? ` · ${category}` : ''}
                                </span>
                            )}
                            {audioFirst === true && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600">
                                    <AudioLines className="h-3 w-3" /> Audio-first
                                </span>
                            )}
                            {ev?.cocitation_count ? (
                                <span className="inline-flex items-center gap-1 rounded bg-gold/10 px-1.5 py-0.5 text-gold">
                                    <Network className="h-3 w-3" /> Linked by {ev.cocitation_count} you follow
                                </span>
                            ) : null}
                            {caption && (
                                <span className={cn(
                                    'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                                    caption.variant === 'success' && 'bg-emerald-500/10 text-emerald-600',
                                    caption.variant === 'warning' && 'bg-amber-500/10 text-amber-600',
                                    caption.variant === 'secondary' && 'bg-muted',
                                )}>
                                    <Captions className="h-3 w-3" /> {caption.label}
                                </span>
                            )}
                            {ev?.needs_chaptering && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600">
                                    <Scissors className="h-3 w-3" /> Needs trimming
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent titles — what this source actually produces */}
                {sample.length > 0 && (
                    <ul className="space-y-1">
                        {sample.slice(0, 3).map((it, i) => (
                            <li key={i} className="truncate text-sm text-muted-foreground" dir="auto" title={it.title}>· {it.title}</li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={onApprove} disabled={busy}>
                        <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <a href={suggestion.feed_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">Open</Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={onReject} disabled={busy} title="Dismiss">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function MediaSettings({ config }: { config: DiscoveryConfig }) {
    const update = useUpdateDiscoveryConfig();
    const set = (patch: Partial<DiscoveryConfig>) => update.mutate({ ...config, ...patch });
    const rows: { key: keyof DiscoveryConfig; label: string; hint: string }[] = [
        { key: 'intelligence_enabled', label: 'Source graph', hint: 'Master switch for relation-based discovery' },
        { key: 'youtube_discovery_enabled', label: 'YouTube (InnerTube)', hint: 'Watch-next channel graph — no API quota' },
        { key: 'podcast_discovery_enabled', label: 'Podcasts (iTunes/RSS)', hint: 'Topical adjacency + show-notes' },
        { key: 'youtube_related_enabled', label: 'YouTube featured', hint: 'Owner-curated featured channels (probe first)' },
        { key: 'apple_related_enabled', label: 'Apple “also subscribed”', hint: 'Co-listen graph (probe first)' },
        { key: 'automation_enabled', label: 'Scheduled sweeps', hint: 'Run discovery automatically on a cadence' },
    ];
    return (
        <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                {rows.map((r) => (
                    <label key={r.key} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.hint}</p>
                        </div>
                        <Switch
                            checked={Boolean(config[r.key])}
                            onCheckedChange={(v) => set({ [r.key]: v } as Partial<DiscoveryConfig>)}
                        />
                    </label>
                ))}
                {/* Storage guard — cap how much a newly-approved source pulls. */}
                <label className="flex items-center justify-between gap-3 rounded-md border p-3 sm:col-span-2">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">Episodes pulled on approve</p>
                        <p className="text-xs text-muted-foreground">
                            When you approve a source, only the N most-recent episodes/videos are
                            ingested — protects storage from deep back-catalogs. 0 = pull everything.
                        </p>
                    </div>
                    <Input
                        type="number"
                        min={0}
                        defaultValue={config.media_initial_max_episodes ?? 5}
                        onBlur={(e) => {
                            const v = Math.max(0, Math.floor(Number(e.target.value)));
                            if (v !== config.media_initial_max_episodes) set({ media_initial_max_episodes: v });
                        }}
                        className="h-9 w-20"
                    />
                </label>
            </CardContent>
        </Card>
    );
}

function ClearItem({ icon: Icon, label, ids, onPick, destructive }: {
    icon: typeof Eye;
    label: string;
    ids: string[];
    onPick: (ids: string[]) => void;
    destructive?: boolean;
}) {
    return (
        <DropdownMenuItem
            disabled={ids.length === 0}
            onClick={() => onPick(ids)}
            className={cn('gap-2', destructive && 'text-destructive focus:text-destructive')}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className="ml-auto text-xs text-muted-foreground">{ids.length}</span>
        </DropdownMenuItem>
    );
}

function YouTubeImportPanel({ profiles, defaultProfileId, onDone }: {
    profiles: DiscoveryProfile[];
    defaultProfileId: string;
    onDone: () => void;
}) {
    // Links is the primary path (two taps off the Share button); JSON paste is the
    // advanced fallback (the personalized home-feed dump) kept for power users.
    const [mode, setMode] = useState<'links' | 'json'>('links');
    const [links, setLinks] = useState('');
    const [raw, setRaw] = useState('');
    const [profileId, setProfileId] = useState(defaultProfileId);
    const importLinks = useImportYouTubeLinks();
    const importFeed = useImportYouTubeFeed();
    const pending = importLinks.isPending || importFeed.isPending;

    const submitLinks = () => {
        const inputs = links.split('\n').map((s) => s.trim()).filter(Boolean);
        if (inputs.length === 0) return;
        importLinks.mutate(
            { inputs, profileId: profileId || undefined },
            { onSuccess: () => { setLinks(''); onDone(); } },
        );
    };

    const submitJson = () => {
        const text = raw.trim();
        if (!text) return;
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            toast({ title: 'Invalid JSON', description: 'Paste the full youtubei/v1 response body (valid JSON).', variant: 'destructive' });
            return;
        }
        importFeed.mutate(
            { raw: parsed, profileId: profileId || undefined },
            { onSuccess: () => { setRaw(''); onDone(); } },
        );
    };

    return (
        <Card>
            <CardContent className="space-y-3 py-4">
                <div className="flex items-start gap-2">
                    <Youtube className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Import channels from YouTube</p>
                        <p className="text-xs text-muted-foreground">
                            Paste YouTube links — a channel <span dir="ltr">@handle</span>, a channel URL, or any
                            video/share link (one per line). We resolve each to its channel via guest InnerTube, enrich
                            it, and queue it below for review. No credentials are stored.
                        </p>
                    </div>
                </div>

                {mode === 'links' ? (
                    <textarea
                        value={links}
                        onChange={(e) => setLinks(e.target.value)}
                        placeholder={'@thmanyahPodcasts\nhttps://www.youtube.com/@MicsPodc\nhttps://youtu.be/YowLeR_piTw'}
                        spellCheck={false}
                        dir="ltr"
                        className="h-32 w-full resize-y rounded-md border bg-muted/30 p-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                ) : (
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        placeholder="Paste the raw youtubei/v1 JSON response here…"
                        spellCheck={false}
                        dir="ltr"
                        className="h-40 w-full resize-y rounded-md border bg-muted/30 p-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Attach to interest
                        <select
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            className="h-8 rounded-md border bg-background px-2 text-xs"
                        >
                            <option value="">— none —</option>
                            {profiles.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'links' ? 'json' : 'links')}
                            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                            {mode === 'links' ? 'Advanced: paste JSON' : 'Back to links'}
                        </button>
                        {mode === 'links' ? (
                            <Button size="sm" disabled={!links.trim() || pending} onClick={submitLinks}>
                                {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                                Import
                            </Button>
                        ) : (
                            <Button size="sm" disabled={!raw.trim() || pending} onClick={submitJson}>
                                {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                                Import
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function MediaFindingPage() {
    const { data: profilesData } = useProfiles();
    const { data: config } = useDiscoveryConfig();
    const { data: suggestionsData, isLoading } = useSuggestions(undefined, 'PENDING', 'media');
    // The active roster this hub feeds — approved media sources (the same rows the
    // Media Sources page manages), grouped by the interest they were found for.
    const { data: activeSources } = useNewsSources(undefined, 'media');

    const [activeProfile, setActiveProfile] = useState<string>(ALL);
    const [showProfile, setShowProfile] = useState(false);
    const [editProfile, setEditProfile] = useState<DiscoveryProfile | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showImport, setShowImport] = useState(false);

    const buildGraph = useBuildGraph();
    const runProfile = useRunProfile();
    const deleteProfile = useDeleteProfile();
    const approve = useApproveSuggestion();
    const reject = useRejectSuggestion();
    const bulkApprove = useBulkApprove();
    const bulkReject = useBulkReject();

    // Media-only profiles + suggestions (the spine is shared; isolate by category).
    const mediaProfiles = useMemo(
        () => (profilesData?.data ?? []).filter((p: DiscoveryProfile) => p.category === 'media'),
        [profilesData],
    );
    const mediaProfileIds = useMemo(() => new Set(mediaProfiles.map((p) => p.id)), [mediaProfiles]);

    const suggestions = useMemo(() => {
        const all = (suggestionsData?.data ?? []) as SourceSuggestion[];
        return all.filter((s) =>
            s.category === 'media' || (s.profile_id ? mediaProfileIds.has(s.profile_id) : false),
        );
    }, [suggestionsData, mediaProfileIds]);

    const visible = useMemo(
        () => (activeProfile === ALL ? suggestions : suggestions.filter((s) => s.profile_id === activeProfile)),
        [suggestions, activeProfile],
    );

    // Hand-imported channels (pasted links / JSON) are kept in their own section so
    // they don't get lost among the auto-discovered results — these are the ones the
    // admin deliberately seeded and most wants to find again.
    const isImported = (s: SourceSuggestion) => s.discovered_via === 'youtube-import';
    const imported = useMemo(() => visible.filter(isImported), [visible]);
    const discovered = useMemo(() => visible.filter((s) => !isImported(s)), [visible]);

    // One-click "clear" filters for the review queue (bulk-reject the matches).
    // "Weak" is relative to the current view's best score (with a small floor) so
    // it adapts to each topic's score distribution instead of a fixed cutoff.
    const clearGroups = useMemo(() => {
        const scoreOf = (s: SourceSuggestion) => s.relevance_score ?? s.confidence ?? 0;
        const maxScore = visible.reduce((m, s) => Math.max(m, scoreOf(s)), 0);
        const weakCutoff = Math.max(0.15, maxScore * 0.5);
        const ids = (pred: (s: SourceSuggestion) => boolean) => visible.filter(pred).map((s) => s.id);
        return {
            weak: ids((s) => scoreOf(s) < weakCutoff),
            visual: ids((s) => s.health?.audio_first === false),
            nonPodcast: ids((s) => !(s.type === 'PODCAST' || s.health?.is_podcast)),
            noTranscript: ids((s) => s.evidence?.caption_state === 'none'),
            needsTrim: ids((s) => Boolean(s.evidence?.needs_chaptering)),
            imported: ids(isImported),
            discovered: ids((s) => !isImported(s)),
            all: visible.map((s) => s.id),
        };
    }, [visible]);

    const clearWhere = (ids: string[]) => {
        if (ids.length && !bulkReject.isPending) bulkReject.mutate(ids);
    };

    // Active media source counts per interest (the roster the hub has built).
    const activeByProfile = useMemo(() => {
        const m = new Map<string, number>();
        for (const s of activeSources?.data ?? []) {
            if (s.discovery_profile_id) m.set(s.discovery_profile_id, (m.get(s.discovery_profile_id) ?? 0) + 1);
        }
        return m;
    }, [activeSources]);
    const totalActive = activeSources?.data?.length ?? 0;

    const busy = approve.isPending || reject.isPending;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <span className="brand-overline text-gold">For You</span>
                    <h1 className="text-2xl font-bold">Media Finding</h1>
                    <p className="text-sm text-muted-foreground">
                        Auto-discovered podcasts &amp; YouTube channels, ranked for your roster.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={ROUTES.PLATFORM.MEDIA_SOURCES}>
                        <Button variant="outline" title="Manage the approved roster">
                            <Radio className="mr-1 h-4 w-4" /> Media Sources{totalActive ? ` · ${totalActive}` : ''}
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={() => setShowImport((s) => !s)}>
                        <Upload className="mr-1 h-4 w-4" /> Import from YouTube
                    </Button>
                    <Button variant="outline" onClick={() => setShowSettings((s) => !s)}>
                        <Settings2 className="mr-1 h-4 w-4" /> Settings
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => buildGraph.mutate()}
                        disabled={buildGraph.isPending}
                    >
                        {buildGraph.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Radar className="mr-1 h-4 w-4" />}
                        Build graph
                    </Button>
                    <Button onClick={() => { setEditProfile(null); setShowProfile(true); }}>
                        <Plus className="mr-1 h-4 w-4" /> New interest
                    </Button>
                </div>
            </div>

            {showSettings && config && <MediaSettings config={config} />}
            {showImport && (
                <YouTubeImportPanel
                    profiles={mediaProfiles}
                    defaultProfileId={activeProfile === ALL ? (mediaProfiles[0]?.id ?? '') : activeProfile}
                    onDone={() => setShowImport(false)}
                />
            )}

            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                {/* Interests rail */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveProfile(ALL)}
                        className={cn(
                            'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm',
                            activeProfile === ALL ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                        )}
                    >
                        <span>All interests</span>
                        <Badge variant="secondary">{suggestions.length}</Badge>
                    </button>
                    {mediaProfiles.map((p) => {
                        const count = suggestions.filter((s) => s.profile_id === p.id).length;
                        const active = activeByProfile.get(p.id) ?? 0;
                        const running = runProfile.isPending && runProfile.variables === p.id;
                        return (
                            <div
                                key={p.id}
                                className={cn(
                                    'group flex items-center justify-between rounded-md px-3 py-2 text-sm',
                                    activeProfile === p.id ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                                )}
                            >
                                <button onClick={() => setActiveProfile(p.id)} className="min-w-0 flex-1 truncate text-left" dir="auto">
                                    {p.name}
                                    {active > 0 && <span className="ml-1.5 text-xs font-normal text-gold">· {active} live</span>}
                                </button>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => runProfile.mutate(p.id)}
                                        disabled={running}
                                        title="Run discovery"
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => { setEditProfile(p); setShowProfile(true); }}
                                        title="Edit"
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => deleteProfile.mutate(p.id)}
                                        title="Delete"
                                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                    <Badge variant="secondary">{count}</Badge>
                                </div>
                            </div>
                        );
                    })}
                    {mediaProfiles.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                            No media interests yet — create one to start discovery.
                        </p>
                    )}
                </div>

                {/* Review grid */}
                <div className="space-y-3">
                    {visible.length > 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{visible.length} pending</p>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" disabled={bulkReject.isPending}>
                                            {bulkReject.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                            Clear <ChevronDown className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-60">
                                        <DropdownMenuLabel>Clear from this view</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <ClearItem icon={TrendingDown} label="Weak (low relevance)" ids={clearGroups.weak} onPick={clearWhere} />
                                        <ClearItem icon={Eye} label="Visual (not audio-first)" ids={clearGroups.visual} onPick={clearWhere} />
                                        <ClearItem icon={Podcast} label="Non-podcasts" ids={clearGroups.nonPodcast} onPick={clearWhere} />
                                        <ClearItem icon={Captions} label="No transcript" ids={clearGroups.noTranscript} onPick={clearWhere} />
                                        <ClearItem icon={Scissors} label="Needs trimming" ids={clearGroups.needsTrim} onPick={clearWhere} />
                                        <ClearItem icon={Youtube} label="Imported from YouTube" ids={clearGroups.imported} onPick={clearWhere} />
                                        <ClearItem icon={Radar} label="Auto-discovered (not imported)" ids={clearGroups.discovered} onPick={clearWhere} />
                                        <DropdownMenuSeparator />
                                        <ClearItem icon={X} label="Clear all shown" ids={clearGroups.all} onPick={clearWhere} destructive />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={bulkApprove.isPending}
                                    onClick={() => bulkApprove.mutate(visible.map((s) => s.id))}
                                >
                                    <Check className="mr-1 h-4 w-4" /> Approve all
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
                        </div>
                    ) : visible.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                                <Radar className="h-8 w-8 text-muted-foreground" />
                                <p className="font-medium">No suggestions yet</p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Create a media interest and run discovery, or build the source graph to surface
                                    channels related to your approved roster.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-5">
                            {imported.length > 0 && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Youtube className="h-4 w-4 text-gold" />
                                        <h3 className="text-sm font-semibold">Imported from YouTube</h3>
                                        <Badge variant="secondary">{imported.length}</Badge>
                                        <span className="text-xs text-muted-foreground">channels you pasted in</span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {imported.map((s) => (
                                            <MediaSuggestionCard
                                                key={s.id}
                                                suggestion={s}
                                                busy={busy}
                                                onApprove={() => approve.mutate(s.id)}
                                                onReject={() => reject.mutate({ id: s.id })}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                            {discovered.length > 0 && (
                                <section className="space-y-2">
                                    {imported.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Radar className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold">Auto-discovered</h3>
                                            <Badge variant="secondary">{discovered.length}</Badge>
                                        </div>
                                    )}
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {discovered.map((s) => (
                                            <MediaSuggestionCard
                                                key={s.id}
                                                suggestion={s}
                                                busy={busy}
                                                onApprove={() => approve.mutate(s.id)}
                                                onReject={() => reject.mutate({ id: s.id })}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ProfileDialog
                open={showProfile}
                onClose={() => setShowProfile(false)}
                profile={editProfile}
                category="media"
            />
        </div>
    );
}
