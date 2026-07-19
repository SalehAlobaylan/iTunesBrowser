export type ModerationStatus = 'open' | 'resolved' | 'dismissed';
export type ModerationTargetType = 'content' | 'comment';

export type ModerationReport = {
  id: string;
  target_type: ModerationTargetType;
  target_id: string;
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
