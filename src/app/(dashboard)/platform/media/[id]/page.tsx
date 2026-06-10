'use client';

import { use, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Clock3, Loader2, Save, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudioPlayer } from '@/components/platform/media/studio/player';
import { Timeline } from '@/components/platform/media/studio/timeline';
import { ChapterList } from '@/components/platform/media/studio/chapter-list';
import { TranscriptPanel } from '@/components/platform/media/studio/transcript-panel';
import { GenerateDialog } from '@/components/platform/media/studio/generate-dialog';
import { SourceLegend } from '@/components/platform/media/studio/source-legend';
import {
    useStudio,
    useGenerateChapters,
    useSaveChapters,
    useSaveTranscript,
} from '@/hooks/use-studio';
import {
    addChapterAt,
    deleteChapterAt,
    deriveEnds,
    moveBoundary,
    normalize,
    updateChapter,
} from '@/lib/studio/chapters';
import { peakStartsMs } from '@/lib/studio/heatmap';
import type {
    GenerateChaptersRequest,
    StudioChapter,
    StudioSegment,
} from '@/types/platform/studio';
import type {
    TranscriptQualityStatus,
    TranscriptionJobStatus,
} from '@/types/platform/content';

interface StudioPageProps {
    params: Promise<{ id: string }>;
}

const JOB_STATUS_LABELS: Record<TranscriptionJobStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    skipped: 'Skipped',
    succeeded: 'Succeeded',
    failed: 'Failed',
    writeback_failed: 'Writeback failed',
};
const JOB_STATUS_VARIANTS: Record<
    TranscriptionJobStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'
> = {
    queued: 'secondary',
    running: 'info',
    skipped: 'outline',
    succeeded: 'success',
    failed: 'destructive',
    writeback_failed: 'destructive',
};
const QUALITY_STATUS_LABELS: Record<TranscriptQualityStatus, string> = {
    ok: 'OK',
    needs_review: 'Needs review',
    auto_repair: 'Auto repair',
};
const QUALITY_STATUS_VARIANTS: Record<
    TranscriptQualityStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'
> = {
    ok: 'success',
    needs_review: 'warning',
    auto_repair: 'destructive',
};

function formatDateShort(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MediaStudioPage({ params }: StudioPageProps) {
    const { id } = use(params);
    const { data, isLoading } = useStudio(id);

    const mediaRef = useRef<HTMLVideoElement | null>(null);
    const initedRef = useRef<string | null>(null);

    const [chapters, setChapters] = useState<StudioChapter[]>([]);
    const [segments, setSegments] = useState<StudioSegment[]>([]);
    const [durationMs, setDurationMs] = useState(0);
    const [currentMs, setCurrentMs] = useState(0);
    const [chaptersDirty, setChaptersDirty] = useState(false);
    const [transcriptDirty, setTranscriptDirty] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);

    const generate = useGenerateChapters(id);
    const saveChaptersMut = useSaveChapters(id);
    const saveTranscriptMut = useSaveTranscript(id);

    // Init working state once per item (refetches after save won't clobber edits).
    useEffect(() => {
        if (data && initedRef.current !== id) {
            initedRef.current = id;
            const dur = (data.content.duration_sec ?? 0) * 1000;
            setDurationMs(dur);
            setChapters(data.chapters);
            setSegments(data.transcript?.segments ?? []);
        }
    }, [data, id]);

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!chaptersDirty && !transcriptDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [chaptersDirty, transcriptDirty]);

    const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => {
        if (!chaptersDirty && !transcriptDirty) return;
        if (!window.confirm('Leave Media Studio and discard unsaved changes?')) {
            event.preventDefault();
        }
    };

    const seek = (ms: number) => {
        if (mediaRef.current) mediaRef.current.currentTime = ms / 1000;
        setCurrentMs(ms);
    };

    const onDurationMs = (ms: number) => {
        if (ms > 0) {
            setDurationMs(ms);
            setChapters((prev) => deriveEnds(prev, ms));
        }
    };

    // Chapter edit handlers (client working set).
    const editChapters = (next: StudioChapter[]) => {
        setChapters(next);
        setChaptersDirty(true);
    };
    const handleAddAtPlayhead = () => editChapters(addChapterAt(chapters, currentMs, durationMs));
    const handleAddAtPeaks = () => {
        const peaks = peakStartsMs(data?.content.heatmap ?? [], durationMs, 5);
        let next = chapters;
        for (const ms of peaks) next = addChapterAt(next, ms, durationMs, 'Highlight');
        editChapters(next);
    };
    const handleDelete = (i: number) => editChapters(deleteChapterAt(chapters, i, durationMs));
    const handleUpdate = (i: number, patch: Partial<Pick<StudioChapter, 'title' | 'summary'>>) =>
        editChapters(updateChapter(chapters, i, patch));
    const handleMoveBoundary = (i: number, ms: number) =>
        editChapters(moveBoundary(chapters, i, ms, durationMs));

    const handleGenerate = async (req: GenerateChaptersRequest) => {
        try {
            const preview = await generate.mutateAsync(req);
            setChapters(normalize(preview, durationMs));
            setChaptersDirty(true);
            setGenerateOpen(false);
        } catch {
            // Error toast surfaced by the hook's onError.
        }
    };

    const handleSaveChapters = async () => {
        try {
            const saved = await saveChaptersMut.mutateAsync(chapters);
            setChapters(saved);
            setChaptersDirty(false);
        } catch {
            // Error toast surfaced by the hook's onError.
        }
    };

    const handleEditSegment = (index: number, text: string) => {
        setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, text } : s)));
        setTranscriptDirty(true);
    };

    const handleSaveTranscript = async () => {
        try {
            await saveTranscriptMut.mutateAsync(segments);
            setTranscriptDirty(false);
        } catch {
            // Error toast surfaced by the hook's onError.
        }
    };

    if (isLoading || !data) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    const { content, transcript } = data;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        href="/platform/media"
                        onClick={confirmLeave}
                        className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Media
                    </Link>
                    <h1 className="truncate text-2xl font-semibold" title={content.title}>
                        {content.title || '(untitled)'}
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{content.type}</Badge>
                        <Badge variant="outline">{content.status}</Badge>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setGenerateOpen(true)} disabled={!transcript}>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        {chapters.length > 0 ? 'Regenerate chapters' : 'Generate chapters'}
                    </Button>
                    <Button onClick={handleSaveChapters} disabled={!chaptersDirty || saveChaptersMut.isPending}>
                        {saveChaptersMut.isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-1.5 h-4 w-4" />
                        )}
                        Save chapters
                    </Button>
                </div>
            </div>

            {/* Player */}
            <StudioPlayer
                src={content.media_url}
                poster={content.thumbnail_url}
                mediaRef={mediaRef}
                onTimeMs={setCurrentMs}
                onDurationMs={onDurationMs}
            />

            {!transcript ? (
                <div className="rounded-md border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No transcript yet. Generate one from the Media tab (Enrich with STT) before creating
                    chapters.
                </div>
            ) : (
                <>
                    <div className="grid gap-3 lg:grid-cols-3">
                        <div className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold">Transcript quality</h2>
                                {data.transcript_quality ? (
                                    <Badge variant={QUALITY_STATUS_VARIANTS[data.transcript_quality.status]}>
                                        {QUALITY_STATUS_LABELS[data.transcript_quality.status]} · {Math.round(data.transcript_quality.score * 100)}%
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Not scored</Badge>
                                )}
                            </div>
                            {data.transcript_quality?.issue_codes?.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {data.transcript_quality.issue_codes.map((issue) => (
                                        <Badge key={issue} variant="outline" title={issue}>
                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                            {issue.replaceAll('_', ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No transcript quality issues recorded.</p>
                            )}
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold">Latest STT job</h2>
                                {data.latest_transcription_job ? (
                                    <Badge variant={JOB_STATUS_VARIANTS[data.latest_transcription_job.status]}>
                                        {JOB_STATUS_LABELS[data.latest_transcription_job.status]}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">No jobs</Badge>
                                )}
                            </div>
                            {data.latest_transcription_job ? (
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>
                                        {data.latest_transcription_job.provider || 'Provider pending'}
                                        {data.latest_transcription_job.model ? ` · ${data.latest_transcription_job.model}` : ''}
                                    </p>
                                    <p>
                                        <Clock3 className="mr-1 inline h-3 w-3" />
                                        {formatDateShort(
                                            data.latest_transcription_job.completed_at ||
                                            data.latest_transcription_job.started_at ||
                                            data.latest_transcription_job.created_at
                                        )}
                                    </p>
                                    {(data.latest_transcription_job.error_message || data.latest_transcription_job.skip_reason) && (
                                        <p className="line-clamp-2">
                                            {data.latest_transcription_job.error_message || data.latest_transcription_job.skip_reason}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No transcription job has been recorded for this item.</p>
                            )}
                        </div>
                        <div className="rounded-md border p-3">
                            <h2 className="mb-2 text-sm font-semibold">Studio audit</h2>
                            {data.transcript_audit?.last_action ? (
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>{data.transcript_audit.last_action.replace('media_studio.', '').replaceAll('_', ' ')}</p>
                                    <p>{formatDateShort(data.transcript_audit.last_at)}</p>
                                    {data.transcript_audit.user_email && <p>{data.transcript_audit.user_email}</p>}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No Studio edit audit event yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <Timeline
                        chapters={chapters}
                        durationMs={durationMs}
                        currentMs={currentMs}
                        onSeek={seek}
                        onMoveBoundary={handleMoveBoundary}
                        heatmap={content.heatmap}
                        sponsorSegments={content.sponsor_segments}
                    />

                    {/* Source legend — what each chapter color/source means */}
                    <SourceLegend />
                    {chaptersDirty && (
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            Unsaved changes — click “Save chapters” to persist.
                        </p>
                    )}

                    {/* Chapters + transcript */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChapterList
                            chapters={chapters}
                            onSeek={seek}
                            onAddAtPlayhead={handleAddAtPlayhead}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddAtPeaks={content.heatmap?.length ? handleAddAtPeaks : undefined}
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Transcript</h3>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        title={transcriptDirty ? 'Save transcript before regenerating chapters' : 'Regenerate chapters from the current transcript'}
                                        onClick={() => setGenerateOpen(true)}
                                        disabled={transcriptDirty || !transcript}
                                    >
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                        Regenerate chapters
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSaveTranscript}
                                        disabled={!transcriptDirty || saveTranscriptMut.isPending}
                                    >
                                        {saveTranscriptMut.isPending && (
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        )}
                                        Save transcript
                                    </Button>
                                </div>
                            </div>
                            <TranscriptPanel
                                segments={segments}
                                currentMs={currentMs}
                                onSeek={seek}
                                onEditSegment={handleEditSegment}
                            />
                        </div>
                    </div>
                </>
            )}

            <GenerateDialog
                open={generateOpen}
                onOpenChange={setGenerateOpen}
                onGenerate={handleGenerate}
                isPending={generate.isPending}
                hasChapters={chapters.length > 0}
            />
        </div>
    );
}
