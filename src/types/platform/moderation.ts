export type ModerationStatus = 'open' | 'resolved' | 'dismissed';
export type ModerationTargetType = 'content' | 'comment';

export type ModerationReport = {
  id: string;
  target_type: ModerationTargetType;
  target_id: string;
  author_id?: string;
  author_suspended: boolean;
  reason: string;
  detail?: string;
  status: ModerationStatus;
  created_at: string;
};

export type ModerationReportPage = {
  data: ModerationReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type CommentPolicyReview = {
  id: string;
  content_id: string;
  text: string;
  reason: string;
  author_id?: string;
  created_at: string;
};

export type CommentPolicyReviewPage = {
  data: CommentPolicyReview[];
  total: number;
};
