import { cmsClient } from '@/lib/api/client';
import type {
  ModerationReport,
  ModerationReportPage,
  ModerationStatus,
  CommentPolicyReviewPage,
} from '@/types/platform/moderation';

export function listModerationReports(
  status: ModerationStatus | 'all' = 'open'
): Promise<ModerationReportPage> {
  return cmsClient.get<ModerationReportPage>(
    '/admin/moderation/reports',
    status === 'all' ? undefined : { status }
  );
}

export function listCommentPolicyReviews(): Promise<CommentPolicyReviewPage> {
  return cmsClient.get<CommentPolicyReviewPage>(
    '/admin/moderation/comments/review'
  );
}

export function resolveCommentPolicyReview(
  id: string,
  status: 'allow' | 'removed'
): Promise<{ message: string }> {
  return cmsClient.post<{ message: string }>(
    `/admin/moderation/comments/${id}/review`,
    { status }
  );
}

export function resolveModerationReport(
  id: string,
  status: Exclude<ModerationStatus, 'open'>
): Promise<{ data: ModerationReport }> {
  return cmsClient.post<{ data: ModerationReport }>(
    `/admin/moderation/reports/${id}/resolve`,
    { status }
  );
}

export function removeModerationComment(
  id: string
): Promise<{ message: string }> {
  return cmsClient.delete<{ message: string }>(
    `/admin/moderation/comments/${id}`
  );
}
