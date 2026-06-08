'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';

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
import type {
    GenerateChaptersRequest,
    StudioChapter,
    StudioSegment,
} from '@/types/platform/studio';

interface StudioPageProps {
    params: Promise<{ id: string }>;
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
                        <Sparkles className="mr-1.5 h-4 w-4" /> Generate chapters
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
                    {/* Timeline */}
                    <Timeline
                        chapters={chapters}
                        durationMs={durationMs}
                        currentMs={currentMs}
                        onSeek={seek}
                        onMoveBoundary={handleMoveBoundary}
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
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Transcript</h3>
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
