import { cmsClient } from '@/lib/api/client';
import type {
    AtomizationFilters,
	    MediaAtomizationChapter,
	    MediaAtomizationOverview,
	    MediaAtomizationParent,
	    MediaAtomizationPipeline,
	    MediaAtomizationRepairResult,
    MediaAtomizationSweepResult,
    MediaAtomizationRun,
} from '@/types/platform/media-atomization';

interface CmsEnvelope<T> {
    data: T;
    code: number;
    message: string;
}

const unwrap = async <T>(promise: Promise<CmsEnvelope<T>>): Promise<T> => {
    return (await promise).data;
};

const cleanParams = (filters?: AtomizationFilters & { limit?: number }) => {
    const params: Record<string, string | number> = {};
    Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            params[key] = value;
        }
    });
    return params;
};

export const getMediaAtomizationOverview = () =>
    unwrap(cmsClient.get<CmsEnvelope<MediaAtomizationOverview>>('/admin/media-atomization/overview'));

export const getMediaAtomizationPipeline = (filters?: AtomizationFilters & { limit?: number }) =>
    unwrap(
        cmsClient.get<CmsEnvelope<MediaAtomizationPipeline>>(
            '/admin/media-atomization/pipeline',
            cleanParams(filters)
        )
    );

export const listMediaAtomizationParents = (filters?: AtomizationFilters & { limit?: number }) =>
    unwrap(
        cmsClient.get<CmsEnvelope<{ items: MediaAtomizationParent[] }>>(
            '/admin/media-atomization/parents',
            cleanParams(filters)
        )
    ).then((d) => d.items);

export const listMediaAtomizationChapters = (filters?: AtomizationFilters & { limit?: number }) =>
    unwrap(
        cmsClient.get<CmsEnvelope<{ items: MediaAtomizationChapter[] }>>(
            '/admin/media-atomization/chapters',
            cleanParams(filters)
        )
    ).then((d) => d.items);

export const listMediaAtomizationRuns = (filters?: Pick<AtomizationFilters, 'status'> & { phase?: string; parent_id?: string; limit?: number }) =>
    unwrap(
        cmsClient.get<CmsEnvelope<{ items: MediaAtomizationRun[] }>>(
            '/admin/media-atomization/runs',
            cleanParams(filters)
        )
    ).then((d) => d.items);

export const approveAtomizedChapter = (chapterId: string) =>
    unwrap(
        cmsClient.post<CmsEnvelope<{ chapter: MediaAtomizationChapter }>>(
            `/admin/media-atomization/chapters/${chapterId}/approve`
        )
    );

export const rejectAtomizedChapter = (chapterId: string) =>
    unwrap(
        cmsClient.post<CmsEnvelope<{ chapter: MediaAtomizationChapter }>>(
            `/admin/media-atomization/chapters/${chapterId}/reject`
        )
    );

export const repairMediaAtomizationLeaks = () =>
    unwrap(
        cmsClient.post<CmsEnvelope<MediaAtomizationRepairResult>>(
            '/admin/media-atomization/repair-leaks'
        )
    );

export const runMediaAtomizationSweep = () =>
    cmsClient.post<MediaAtomizationSweepResult>(
        '/admin/media-atomization/sweep-now'
    );
