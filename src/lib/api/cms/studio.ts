import { cmsClient } from '@/lib/api/client';
import type {
    StudioData,
    StudioChapter,
    StudioSegment,
    GenerateChaptersRequest,
    TranscriptCompareResponse,
    StudioTranscript,
} from '@/types/platform/studio';

interface CmsEnvelope<T> {
    data: T;
    code: number;
    message: string;
}

const unwrap = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    return (await promise).data;
};

export const getStudio = (id: string) =>
    unwrap(cmsClient.get<CmsEnvelope<StudioData>>(`/admin/content/${id}/studio`));

/** Generate a PREVIEW (not persisted). The studio loads it into its working set. */
export const generateChapters = (id: string, req: GenerateChaptersRequest) =>
    unwrap(
        cmsClient.post<CmsEnvelope<{ chapters: StudioChapter[] }>>(
            `/admin/content/${id}/chapters/generate`,
            req
        )
    ).then((d) => d.chapters);

/** Bulk-replace the persisted chapter set with the working set. */
export const saveChapters = (id: string, chapters: StudioChapter[]) =>
    unwrap(
        cmsClient.put<CmsEnvelope<{ chapters: StudioChapter[] }>>(
            `/admin/content/${id}/chapters`,
            {
                chapters: chapters.map((c) => ({
                    title: c.title,
                    summary: c.summary ?? null,
                    start_ms: c.start_ms,
                    end_ms: c.end_ms,
                    source: c.source,
                    status: c.status,
                    confidence: c.confidence,
                    context_label: c.context_label ?? null,
                    boundary_reason: c.boundary_reason ?? null,
                    standalone_score: c.standalone_score,
                    contains_sponsor_intro: c.contains_sponsor_intro ?? false,
                    needs_review_reason: c.needs_review_reason ?? null,
                })),
            }
        )
    ).then((d) => d.chapters);

/** Light transcript edit: replace segments + recompute full_text server-side. */
export const saveTranscript = (id: string, segments: StudioSegment[]) =>
    unwrap(
        cmsClient.put<CmsEnvelope<{ full_text: string; segments: StudioSegment[] }>>(
            `/admin/content/${id}/transcript`,
            { segments }
        )
    );

export const approveTranscript = (id: string, reason?: string) =>
    unwrap(
        cmsClient.post<CmsEnvelope<{ transcript: StudioTranscript }>>(
            `/admin/content/${id}/transcript/approve`,
            { reason: reason ?? '' }
        )
    ).then((d) => d.transcript);

export const unapproveTranscript = (id: string) =>
    unwrap(
        cmsClient.delete<CmsEnvelope<{ transcript: StudioTranscript }>>(
            `/admin/content/${id}/transcript/approve`
        )
    ).then((d) => d.transcript);

export const compareTranscripts = (id: string) =>
    unwrap(
        cmsClient.get<CmsEnvelope<TranscriptCompareResponse>>(
            `/admin/content/${id}/transcripts/compare`
        )
    );
