import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast';
import {
  listModerationReports,
  removeModerationComment,
  resolveModerationReport,
} from '@/lib/api/cms/moderation';
import type { ModerationStatus } from '@/types/platform/moderation';

export const moderationKeys = {
  all: ['moderation'] as const,
  queue: (status: ModerationStatus | 'all') =>
    [...moderationKeys.all, 'queue', status] as const,
};

export function useModerationQueue(status: ModerationStatus | 'all') {
  return useQuery({
    queryKey: moderationKeys.queue(status),
    queryFn: () => listModerationReports(status),
    refetchInterval: 30_000,
  });
}

export function useResolveModerationReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'resolved' | 'dismissed';
    }) => resolveModerationReport(id, status),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: moderationKeys.all });
      toast({ title: 'Report updated', variant: 'success' });
    },
    onError: (error: Error) =>
      toast({
        title: 'Could not update report',
        description: error.message,
        variant: 'destructive',
      }),
  });
}

export function useRemoveModerationComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: removeModerationComment,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: moderationKeys.all });
      toast({ title: 'Comment removed', variant: 'success' });
    },
    onError: (error: Error) =>
      toast({
        title: 'Could not remove comment',
        description: error.message,
        variant: 'destructive',
      }),
  });
}
