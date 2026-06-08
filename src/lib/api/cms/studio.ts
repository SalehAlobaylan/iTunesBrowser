import { cmsClient } from '@/lib/api/client';
import type {
    StudioData,
    StudioChapter,
    StudioSegment,
    GenerateChaptersRequest,
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
                    source: c.source,
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
