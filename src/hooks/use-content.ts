import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listContent,
  getContent,
  getMediaSizeStats,
  updateContentStatus,
  getStatusCounts,
  deleteContentByIds,
  bulkSetContentStatus,
  type BulkSetStatusRequest,
} from '@/lib/api/cms/content';
import type {
  ContentItem,
  ListContentParams,
  MediaSizeStats,
  ContentStatus,
} from '@/types/platform/content';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';

// Query keys
export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (params: ListContentParams) =>
    [...contentKeys.lists(), params] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  statusCounts: () => [...contentKeys.all, 'status-counts'] as const,
  mediaSizeStats: (params: ListContentParams) =>
    [...contentKeys.all, 'media-size-stats', params] as const,
};

/**
 * Hook to fetch paginated list of content. Pass `{ paused: true }` to
 * suspend the auto-refresh interval (e.g. while a bulk action is running).
 */
export function useContent(
  params: ListContentParams = {},
  options: { paused?: boolean } = {}
) {
  const { paused = false } = options;
  return useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => listContent(params),
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: paused ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Per-status totals across the tenant.
 */
export function useStatusCounts(options: { paused?: boolean } = {}) {
  const { paused = false } = options;
  return useQuery({
    queryKey: contentKeys.statusCounts(),
    queryFn: () => getStatusCounts(),
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: paused ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useMediaSizeStats(
  params: ListContentParams = {},
  options: { paused?: boolean } = {}
) {
  const { paused = false } = options;
  return useQuery<MediaSizeStats>({
    queryKey: contentKeys.mediaSizeStats(params),
    queryFn: () => getMediaSizeStats(params),
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: paused ? false : 60_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch a single content item by ID
 */
export function useContentItem(id: string) {
  return useQuery({
    queryKey: contentKeys.detail(id),
    queryFn: () => getContent(id),
    enabled: !!id,
    staleTime: CACHE_CONFIG.details.staleTime,
    gcTime: CACHE_CONFIG.details.gcTime,
  });
}

/**
 * Hook to update content status (e.g., archive)
 */
export function useUpdateContentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      updateContentStatus(id, { status }),
    onSuccess: (updatedItem: ContentItem) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      queryClient.setQueryData(contentKeys.detail(updatedItem.id), updatedItem);
      toast({
        title: 'Status updated',
        description: `Content status changed to ${updatedItem.status}.`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a list of content items in one call (uses the extended bulk-delete).
 */
export function useDeleteContentByIds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteContentByIds(ids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentKeys.statusCounts() });
      toast({
        title: 'Content deleted',
        description: response.message || `Deleted ${response.deleted_count} items.`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Move all items matching a `from_status` (and optional source) to `to_status`.
 * Used by the Tools menu — distinct from per-row PATCH.
 */
export function useBulkSetContentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: BulkSetStatusRequest) => bulkSetContentStatus(req),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentKeys.statusCounts() });
      toast({
        title: 'Status updated',
        description: response.message || `${response.updated_count} items updated.`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
