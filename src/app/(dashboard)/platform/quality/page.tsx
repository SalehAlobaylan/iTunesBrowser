'use client';

import { useMemo, useState } from 'react';
import {
    Sliders,
    Plus,
    Trash2,
    Wrench,
    Loader2,
    PlayCircle,
    Snowflake,
    TrendingDown,
    Gauge,
    History,
    AlertTriangle,
    Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    formatSavingsBytes,
    useCreateQualityProfile,
    useCreateQualityRule,
    useDeleteQualityProfile,
    useDeleteQualityRule,
    useProbeItem,
    useQualityCandidates,
    useQualityHistory,
    useQualityProfiles,
    useQualityRules,
    useQualityStats,
    useTriggerReEncode,
    useUpdateQualityProfile,
    useUpdateQualityRule,
} from '@/hooks/use-quality';
import type {
    ProbeResult,
    QualityProfile,
    QualityProfileInput,
    QualityRule,
    QualityRuleInput,
} from '@/types/platform/quality';

export default function QualityPage() {
    const stats = useQualityStats();

    return (
        <div className="space-y-6 p-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sliders className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-2xl font-semibold">Quality Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Re-encode content to shrink storage and egress without deleting it.
                        </p>
                    </div>
                </div>
            </header>

            {/* Stats overview */}
            <StatsOverview />

            <Tabs defaultValue="candidates" className="w-full">
                <TabsList>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="profiles">Profiles</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="probe">Probe</TabsTrigger>
                    <TabsTrigger value="history">
                        History ({stats.data ? stats.data.total_reencoded : 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="candidates" className="mt-4">
                    <CandidatesTab />
                </TabsContent>
                <TabsContent value="profiles" className="mt-4">
                    <ProfilesTab />
                </TabsContent>
                <TabsContent value="rules" className="mt-4">
                    <RulesTab />
                </TabsContent>
                <TabsContent value="probe" className="mt-4">
                    <ProbeTab />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                    <HistoryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Overview
// ─────────────────────────────────────────────────────────────────────────────

function StatsOverview() {
    const { data, isLoading } = useQualityStats();
    if (isLoading || !data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
                icon={<TrendingDown className="h-5 w-5 text-emerald-400" />}
                label="Total bytes saved"
                value={formatSavingsBytes(data.total_bytes_saved)}
                hint={`${data.total_reencoded} item(s) re-encoded`}
            />
            <StatCard
                icon={<Zap className="h-5 w-5 text-yellow-400" />}
                label="Estimated egress saved"
                value={formatSavingsBytes(data.estimated_egress_saved_bytes)}
                hint="savings × view_count, lifetime"
            />
            <StatCard
                icon={<Gauge className="h-5 w-5 text-blue-400" />}
                label="Items at a profile"
                value={data.items_at_non_default_profile.toLocaleString()}
                hint={
                    data.last_reencode_at
                        ? `Last re-encode: ${new Date(data.last_reencode_at).toLocaleString()}`
                        : 'No re-encodes yet'
                }
            />
        </div>
    );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-semibold">{value}</p>
                        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
                    </div>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidates tab
// ─────────────────────────────────────────────────────────────────────────────

function CandidatesTab() {
    const profiles = useQualityProfiles();
    const rules = useQualityRules();
    const triggerReEncode = useTriggerReEncode();

    const [profileId, setProfileId] = useState<number | undefined>();
    const [ruleId, setRuleId] = useState<number | undefined>();
    const [minAge, setMinAge] = useState<string>('');
    const [maxViews, setMaxViews] = useState<string>('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);

    const params = useMemo(
        () => ({
            rule_id: ruleId,
            profile_id: ruleId === undefined ? profileId : undefined,
            min_age_days: minAge ? parseInt(minAge, 10) : undefined,
            max_view_count: maxViews ? parseInt(maxViews, 10) : undefined,
            limit: 200,
        }),
        [ruleId, profileId, minAge, maxViews]
    );

    const candidates = useQualityCandidates(params, {
        enabled: ruleId !== undefined || profileId !== undefined,
    });

    const items = useMemo(() => candidates.data?.data ?? [], [candidates.data]);
    const allSelected = items.length > 0 && selected.size === items.length;
    const selectedSavings = useMemo(
        () =>
            items
                .filter((i) => selected.has(i.id))
                .reduce((s, i) => s + i.projected_savings_bytes, 0),
        [items, selected]
    );

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(items.map((i) => i.id)));
    }

    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleDryRun() {
        triggerReEncode.mutate({
            ids: Array.from(selected),
            profile_id: profileId,
            rule_id: ruleId,
            dry_run: true,
        });
    }

    function handleSubmit() {
        triggerReEncode.mutate(
            {
                ids: Array.from(selected),
                profile_id: profileId,
                rule_id: ruleId,
                dry_run: false,
            },
            {
                onSuccess: () => {
                    setSelected(new Set());
                    setConfirmOpen(false);
                    candidates.refetch();
                },
            }
        );
    }

    const targetSelected = ruleId !== undefined || profileId !== undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Re-encode candidates</CardTitle>
                <CardDescription>
                    Pick a target profile (or a saved rule) to see which items would shrink and by
                    how much. Then dry-run, or queue the re-encode.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                        <Label>Target rule</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={ruleId ?? ''}
                            onChange={(e) =>
                                setRuleId(e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                        >
                            <option value="">— none —</option>
                            {(rules.data?.data ?? []).map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>or Target profile</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={profileId ?? ''}
                            onChange={(e) => {
                                setProfileId(e.target.value ? parseInt(e.target.value, 10) : undefined);
                                setRuleId(undefined);
                            }}
                            disabled={ruleId !== undefined}
                        >
                            <option value="">— none —</option>
                            {(profiles.data?.data ?? []).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Min age (days)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Max view count</Label>
                        <Input
                            type="number"
                            min="0"
                            value={maxViews}
                            onChange={(e) => setMaxViews(e.target.value)}
                        />
                    </div>
                </div>

                {targetSelected && candidates.data && (
                    <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-muted/30 p-3 text-sm">
                        <span className="font-medium">
                            {candidates.data.total} candidate(s)
                        </span>
                        <span className="text-muted-foreground">
                            Total projected savings:{' '}
                            <strong className="text-emerald-400">
                                {formatSavingsBytes(candidates.data.total_savings_bytes)}
                            </strong>
                        </span>
                        <span className="ml-auto flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleDryRun}
                                disabled={selected.size === 0 || triggerReEncode.isPending}
                            >
                                Dry run ({selected.size})
                            </Button>
                            <Button
                                onClick={() => setConfirmOpen(true)}
                                disabled={selected.size === 0 || triggerReEncode.isPending}
                            >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Re-encode ({formatSavingsBytes(selectedSavings)})
                            </Button>
                        </span>
                    </div>
                )}

                {!targetSelected ? (
                    <div className="flex items-center gap-2 rounded border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        Pick a rule or profile above to load candidates.
                    </div>
                ) : candidates.isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8">
                                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                                <TableHead className="text-right">Current</TableHead>
                                <TableHead className="text-right">Bitrate</TableHead>
                                <TableHead className="text-right">Projected</TableHead>
                                <TableHead className="text-right">Savings</TableHead>
                                <TableHead>Tier</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        No candidates match this target.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.has(c.id)}
                                                onCheckedChange={() => toggleOne(c.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={c.title}>
                                            {c.title || c.id}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{c.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{c.view_count}</TableCell>
                                        <TableCell className="text-right">
                                            {formatSavingsBytes(c.file_size_bytes)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {c.current_bitrate_kbps ? `${c.current_bitrate_kbps} kbps` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatSavingsBytes(c.projected_size_bytes)}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-400">
                                            -{formatSavingsBytes(c.projected_savings_bytes)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {c.storage_tier === 'cold' ? (
                                                <Badge variant="secondary">
                                                    <Snowflake className="mr-1 h-3 w-3" /> cold
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">primary</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm re-encode</DialogTitle>
                        <DialogDescription>
                            About to enqueue {selected.size} re-encode job(s). Estimated savings:{' '}
                            <strong>{formatSavingsBytes(selectedSavings)}</strong>. The current
                            URLs stay live until the new versioned key uploads, then they swap
                            atomically. Old versions are deleted after a 5-minute grace period.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={triggerReEncode.isPending}>
                            {triggerReEncode.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Re-encode
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profiles tab
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_PROFILE: QualityProfileInput = {
    scope: 'global',
    name: '',
    description: '',
    video_codec: 'h264',
    max_height: 720,
    target_bitrate_kbps: 0,
    crf: 23,
    preset: 'fast',
    audio_codec: 'aac',
    audio_bitrate_kbps: 128,
    is_default: false,
    is_active: true,
};

function ProfilesTab() {
    const { data, isLoading } = useQualityProfiles();
    const create = useCreateQualityProfile();
    const update = useUpdateQualityProfile();
    const remove = useDeleteQualityProfile();

    const [editing, setEditing] = useState<QualityProfile | null>(null);
    const [showForm, setShowForm] = useState(false);

    if (isLoading || !data) return <Skeleton className="h-32 w-full" />;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Quality profiles</CardTitle>
                        <CardDescription>
                            Named encode recipes. The profile flagged <strong>default</strong> is
                            applied at first ingest.
                        </CardDescription>
                    </div>
                    <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New profile
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Codec</TableHead>
                                <TableHead className="text-right">Max H</TableHead>
                                <TableHead className="text-right">Bitrate / CRF</TableHead>
                                <TableHead className="text-right">Audio</TableHead>
                                <TableHead>Flags</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs text-muted-foreground">{p.description}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{p.video_codec}</Badge></TableCell>
                                    <TableCell className="text-right">{p.max_height || '—'}</TableCell>
                                    <TableCell className="text-right">
                                        {p.target_bitrate_kbps > 0
                                            ? `${p.target_bitrate_kbps} kbps`
                                            : `CRF ${p.crf}`}
                                    </TableCell>
                                    <TableCell className="text-right text-xs">
                                        {p.audio_codec} / {p.audio_bitrate_kbps}k
                                    </TableCell>
                                    <TableCell className="space-x-1">
                                        {p.is_default && <Badge variant="success">default</Badge>}
                                        {!p.is_active && <Badge variant="secondary">inactive</Badge>}
                                    </TableCell>
                                    <TableCell className="space-x-2 text-right">
                                        <Button size="sm" variant="outline" onClick={() => { setEditing(p); setShowForm(true); }}>
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                if (confirm(`Delete profile "${p.name}"? Rules referencing it must be detached first.`)) {
                                                    remove.mutate(p.id);
                                                }
                                            }}
                                            disabled={remove.isPending}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {showForm && (
                <ProfileForm
                    initial={editing ?? EMPTY_PROFILE}
                    onCancel={() => { setShowForm(false); setEditing(null); }}
                    saving={create.isPending || update.isPending}
                    onSave={(input) => {
                        if (editing) {
                            update.mutate({ id: editing.id, input }, { onSuccess: () => { setShowForm(false); setEditing(null); } });
                        } else {
                            create.mutate(input, { onSuccess: () => setShowForm(false) });
                        }
                    }}
                />
            )}
        </div>
    );
}

function ProfileForm({
    initial,
    onSave,
    onCancel,
    saving,
}: {
    initial: QualityProfileInput | QualityProfile;
    onSave: (input: QualityProfileInput) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [name, setName] = useState(initial.name);
    const [description, setDescription] = useState(initial.description);
    const [videoCodec, setVideoCodec] = useState(initial.video_codec);
    const [maxHeight, setMaxHeight] = useState(String(initial.max_height));
    const [bitrate, setBitrate] = useState(String(initial.target_bitrate_kbps));
    const [crf, setCrf] = useState(String(initial.crf));
    const [preset, setPreset] = useState(initial.preset);
    const [audioCodec, setAudioCodec] = useState(initial.audio_codec);
    const [audioBitrate, setAudioBitrate] = useState(String(initial.audio_bitrate_kbps));
    const [isDefault, setIsDefault] = useState(initial.is_default ?? false);
    const [isActive, setIsActive] = useState(initial.is_active ?? true);

    const useBitrateMode = parseInt(bitrate, 10) > 0;

    const ffmpegPreview = useMemo(() => {
        const opts = [
            `-c:v ${videoCodec === 'h265' ? 'libx265' : videoCodec === 'av1' ? 'libaom-av1' : 'libx264'}`,
            `-preset ${preset}`,
        ];
        if (videoCodec === 'h264') opts.push('-profile:v baseline', '-level 3.0');
        if (useBitrateMode) {
            opts.push(`-b:v ${bitrate}k`);
        } else {
            opts.push(`-crf ${crf}`);
        }
        if (parseInt(maxHeight, 10) > 0) {
            opts.push(`-vf scale=-2:'min(${maxHeight},ih)'`);
        }
        opts.push(`-c:a ${audioCodec === 'opus' ? 'libopus' : 'aac'}`);
        opts.push(`-b:a ${audioBitrate}k`);
        return opts.join(' ');
    }, [videoCodec, preset, useBitrateMode, bitrate, crf, maxHeight, audioCodec, audioBitrate]);

    function submit() {
        onSave({
            scope: 'global',
            name,
            description,
            video_codec: videoCodec,
            max_height: parseInt(maxHeight, 10) || 0,
            target_bitrate_kbps: parseInt(bitrate, 10) || 0,
            crf: parseInt(crf, 10) || 23,
            preset,
            audio_codec: audioCodec,
            audio_bitrate_kbps: parseInt(audioBitrate, 10) || 128,
            is_default: isDefault,
            is_active: isActive,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{('id' in initial && initial.id) ? `Edit profile: ${initial.name}` : 'New profile'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mobile-720p" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What this profile is for"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                        <Label>Video codec</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={videoCodec}
                            onChange={(e) => setVideoCodec(e.target.value as 'h264' | 'h265' | 'av1')}
                        >
                            <option value="h264">H.264 (baseline)</option>
                            <option value="h265">H.265 (HEVC)</option>
                            <option value="av1">AV1</option>
                        </select>
                    </div>
                    <div>
                        <Label>Max height (px)</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={maxHeight}
                            onChange={(e) => setMaxHeight(e.target.value)}
                        >
                            <option value="0">no cap</option>
                            <option value="2160">2160 (4K)</option>
                            <option value="1080">1080</option>
                            <option value="720">720</option>
                            <option value="480">480</option>
                            <option value="360">360</option>
                        </select>
                    </div>
                    <div>
                        <Label>Preset</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value)}
                        >
                            <option value="ultrafast">ultrafast</option>
                            <option value="superfast">superfast</option>
                            <option value="veryfast">veryfast</option>
                            <option value="faster">faster</option>
                            <option value="fast">fast</option>
                            <option value="medium">medium</option>
                            <option value="slow">slow</option>
                        </select>
                    </div>
                    <div>
                        <Label>Audio codec</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={audioCodec}
                            onChange={(e) => setAudioCodec(e.target.value as 'aac' | 'opus')}
                        >
                            <option value="aac">AAC</option>
                            <option value="opus">Opus</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                        <Label>Target bitrate (kbps)</Label>
                        <Input
                            type="number"
                            value={bitrate}
                            onChange={(e) => setBitrate(e.target.value)}
                            placeholder="0 = use CRF"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Set &gt; 0 for predictable file sizes; leave 0 for CRF mode.
                        </p>
                    </div>
                    <div>
                        <Label>CRF (0-51)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="51"
                            value={crf}
                            onChange={(e) => setCrf(e.target.value)}
                            disabled={useBitrateMode}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            18 = visually lossless, 28 = aggressive.
                        </p>
                    </div>
                    <div>
                        <Label>Audio bitrate (kbps)</Label>
                        <Input
                            type="number"
                            value={audioBitrate}
                            onChange={(e) => setAudioBitrate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
                        Default at ingest
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
                        Active
                    </label>
                </div>

                <div className="rounded border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">FFmpeg preview</p>
                    <code className="mt-1 block text-xs text-emerald-300">{ffmpegPreview}</code>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={saving || !name.trim()}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules tab
// ─────────────────────────────────────────────────────────────────────────────

function RulesTab() {
    const { data, isLoading } = useQualityRules();
    const profiles = useQualityProfiles();
    const create = useCreateQualityRule();
    const update = useUpdateQualityRule();
    const remove = useDeleteQualityRule();

    const [editing, setEditing] = useState<QualityRule | null>(null);
    const [showForm, setShowForm] = useState(false);

    if (isLoading || !data) return <Skeleton className="h-32 w-full" />;

    function profileName(id: number): string {
        return profiles.data?.data.find((p) => p.id === id)?.name ?? `#${id}`;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Quality rules</CardTitle>
                        <CardDescription>
                            Schedule re-encodes against age / view-count thresholds. Rules with
                            lower priority run first.
                        </CardDescription>
                    </div>
                    <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New rule
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead className="text-right">Interval</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No rules yet — click &ldquo;New rule&rdquo; to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <div className="font-medium">{r.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                priority {r.priority}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            age &gt; {r.min_age_days}d
                                            {r.max_view_count != null && `, views ≤ ${r.max_view_count}`}
                                            {r.content_type && `, type=${r.content_type}`}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{profileName(r.target_profile_id)}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {r.sweep_interval_minutes}m
                                        </TableCell>
                                        <TableCell>
                                            {r.enabled ? (
                                                <Badge variant="success">enabled</Badge>
                                            ) : (
                                                <Badge variant="secondary">off</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Button size="sm" variant="outline" onClick={() => { setEditing(r); setShowForm(true); }}>
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (confirm(`Delete rule "${r.name}"?`)) {
                                                        remove.mutate(r.id);
                                                    }
                                                }}
                                                disabled={remove.isPending}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {showForm && (
                <RuleForm
                    initial={editing}
                    profiles={profiles.data?.data ?? []}
                    onCancel={() => { setShowForm(false); setEditing(null); }}
                    saving={create.isPending || update.isPending}
                    onSave={(input) => {
                        if (editing) {
                            update.mutate({ id: editing.id, input }, { onSuccess: () => { setShowForm(false); setEditing(null); } });
                        } else {
                            create.mutate(input, { onSuccess: () => setShowForm(false) });
                        }
                    }}
                />
            )}
        </div>
    );
}

function RuleForm({
    initial,
    profiles,
    onSave,
    onCancel,
    saving,
}: {
    initial: QualityRule | null;
    profiles: QualityProfile[];
    onSave: (input: QualityRuleInput) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [enabled, setEnabled] = useState(initial?.enabled ?? false);
    const [priority, setPriority] = useState(String(initial?.priority ?? 100));
    const [minAgeDays, setMinAgeDays] = useState(String(initial?.min_age_days ?? 7));
    const [maxViewCount, setMaxViewCount] = useState(
        initial?.max_view_count != null ? String(initial.max_view_count) : ''
    );
    const [contentType, setContentType] = useState(initial?.content_type ?? '');
    const [targetProfileId, setTargetProfileId] = useState(
        String(initial?.target_profile_id ?? profiles[0]?.id ?? '')
    );
    const [sweepInterval, setSweepInterval] = useState(String(initial?.sweep_interval_minutes ?? 1440));

    function submit() {
        const input: QualityRuleInput = {
            scope: 'global',
            name,
            enabled,
            priority: parseInt(priority, 10) || 100,
            min_age_days: parseInt(minAgeDays, 10) || 0,
            max_view_count: maxViewCount ? parseInt(maxViewCount, 10) : null,
            content_type: contentType || '',
            target_profile_id: parseInt(targetProfileId, 10),
            sweep_interval_minutes: parseInt(sweepInterval, 10) || 1440,
        };
        onSave(input);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initial ? `Edit rule: ${initial.name}` : 'New rule'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                        <Checkbox checked={enabled} onCheckedChange={(v) => setEnabled(v === true)} />
                        Enabled
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                        <Label>Min age (days)</Label>
                        <Input type="number" min="0" value={minAgeDays} onChange={(e) => setMinAgeDays(e.target.value)} />
                    </div>
                    <div>
                        <Label>Max view count</Label>
                        <Input
                            type="number"
                            min="0"
                            value={maxViewCount}
                            onChange={(e) => setMaxViewCount(e.target.value)}
                            placeholder="any"
                        />
                    </div>
                    <div>
                        <Label>Content type</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                        >
                            <option value="">any</option>
                            <option value="VIDEO">VIDEO</option>
                            <option value="PODCAST">PODCAST</option>
                        </select>
                    </div>
                    <div>
                        <Label>Priority</Label>
                        <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <Label>Target profile</Label>
                        <select
                            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            value={targetProfileId}
                            onChange={(e) => setTargetProfileId(e.target.value)}
                        >
                            {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Sweep interval (minutes)</Label>
                        <Input
                            type="number"
                            min="5"
                            value={sweepInterval}
                            onChange={(e) => setSweepInterval(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Default 1440 (daily).</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={saving || !name.trim() || !targetProfileId}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Probe tab
// ─────────────────────────────────────────────────────────────────────────────

function ProbeTab() {
    const probe = useProbeItem();
    const [id, setId] = useState('');
    const [result, setResult] = useState<ProbeResult | null>(null);

    function run() {
        if (!id.trim()) return;
        probe.mutate(id.trim(), {
            onSuccess: (r) => setResult(r),
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Probe a content item</CardTitle>
                <CardDescription>
                    Live ffprobe of the primary artifact + projected sizes for every active profile.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label>Content ID (UUID)</Label>
                        <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="..." />
                    </div>
                    <Button onClick={run} disabled={!id.trim() || probe.isPending}>
                        {probe.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Probe
                    </Button>
                </div>

                {result && (
                    <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <KV label="Duration" value={result.duration_sec ? `${result.duration_sec}s` : '—'} />
                            <KV label="Size" value={formatSavingsBytes(result.file_size_bytes)} />
                            <KV
                                label="Resolution"
                                value={result.width && result.height ? `${result.width}×${result.height}` : '—'}
                            />
                            <KV label="Bitrate" value={result.bitrate_kbps ? `${result.bitrate_kbps} kbps` : '—'} />
                            <KV label="Video codec" value={result.video_codec ?? '—'} />
                            <KV label="Audio codec" value={result.audio_codec ?? '—'} />
                            <KV label="Tier" value={result.storage_tier ?? 'primary'} />
                            <KV
                                label="Current profile"
                                value={result.current_quality_profile_id ? `#${result.current_quality_profile_id}` : '—'}
                            />
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium">Per-profile projection</p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profile</TableHead>
                                        <TableHead className="text-right">Projected size</TableHead>
                                        <TableHead className="text-right">Savings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.projections.map((p) => (
                                        <TableRow key={p.profile_id}>
                                            <TableCell>
                                                <Badge variant="outline">{p.profile_name}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatSavingsBytes(p.projected_size_bytes)}
                                            </TableCell>
                                            <TableCell className="text-right text-emerald-400">
                                                -{formatSavingsBytes(p.projected_savings_bytes)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function KV({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded border border-border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// History tab
// ─────────────────────────────────────────────────────────────────────────────

function HistoryTab() {
    const { data, isLoading } = useQualityHistory();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <History className="mr-2 inline h-4 w-4" />
                    Re-encode history
                </CardTitle>
                <CardDescription>Every re-encode event — manual, rule-driven, or on-ingest.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading || !data ? (
                    <Skeleton className="h-32 w-full" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>When</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead className="text-right">Original</TableHead>
                                <TableHead className="text-right">New</TableHead>
                                <TableHead className="text-right">Saved</TableHead>
                                <TableHead className="text-right">Took</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                        No re-encodes yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.data.map((h) => {
                                    const pct = h.original_size_bytes > 0 ? (h.savings_bytes / h.original_size_bytes) * 100 : 0;
                                    return (
                                        <TableRow key={h.id}>
                                            <TableCell className="text-xs">
                                                {new Date(h.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-xs" title={h.content_item_id}>
                                                {h.content_item_id.slice(0, 8)}…
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={h.trigger === 'manual' ? 'default' : 'secondary'}>
                                                    {h.trigger}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatSavingsBytes(h.original_size_bytes)}</TableCell>
                                            <TableCell className="text-right">{formatSavingsBytes(h.new_size_bytes)}</TableCell>
                                            <TableCell className="text-right text-emerald-400">
                                                -{formatSavingsBytes(h.savings_bytes)}{' '}
                                                <span className="text-xs text-muted-foreground">
                                                    ({pct.toFixed(0)}%)
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {(h.duration_ms / 1000).toFixed(1)}s
                                            </TableCell>
                                            <TableCell>
                                                {h.error ? (
                                                    <Badge variant="destructive" title={h.error}>
                                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                                        error
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success">ok</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
