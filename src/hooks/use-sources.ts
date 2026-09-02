import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
  runSource,
  getSourceStats,
} from '@/lib/api/cms/sources';
import type {
  ContentSource,
  ListSourcesParams,
  CreateSourceRequest,
  UpdateSourceRequest,
  SourceStatsParams,
  SourceCategory,
} from '@/types/platform/source';
import { toast } from '@/components/ui/toast';
import { CACHE_CONFIG } from '@/app/providers';
import { discoveryKeys } from '@/hooks/use-discovery';

// Query keys
export const sourceKeys = {
  all: ['sources'] as const,
  lists: () => [...sourceKeys.all, 'list'] as const,
  list: (params: ListSourcesParams) => [...sourceKeys.lists(), params] as const,
  details: () => [...sourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...sourceKeys.details(), id] as const,
  stats: (params: SourceStatsParams) => [...sourceKeys.all, 'stats', params] as const,
};

function invalidateSourceSurfaces(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: sourceKeys.all });
  queryClient.invalidateQueries({ queryKey: [...discoveryKeys.all, 'sources'] });
  queryClient.invalidateQueries({ queryKey: [...discoveryKeys.all, 'media-sources-context'] });
}

/**
 * Hook to load the ENTIRE source fleet client-side (all pages), powering the
 * Sources command center: the fleet grid, client-side health/category filtering,
 * cross-category bulk-select, and chart/table reconciliation. Admin fleets are
 * tens–low-hundreds of sources, so a bounded page-loop is fine.
 *
 * `options.paused` suspends the auto-refresh interval during bulk actions.
 */
export function useAllSources(
  options: { paused?: boolean; category?: SourceCategory } = {}
) {
  const { paused = false, category } = options;
  return useQuery({
    queryKey: [...sourceKeys.all, 'fleet', category ?? 'all'] as const,
    queryFn: async () => {
      const PAGE = 100;
      const first = await listSources({ page: 1, limit: PAGE, category });
      const pages = first.total_pages ?? 1;
      if (pages <= 1) return first.data;
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          listSources({ page: i + 2, limit: PAGE, category })
        )
      );
      return [first.data, ...rest.map((r) => r.data)].flat();
    },
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: paused ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch source monitoring aggregates for the Sources dashboard.
 * Optionally scoped by category (news | media).
 */
export function useSourceStats(params: SourceStatsParams = {}) {
  return useQuery({
    queryKey: sourceKeys.stats(params),
    queryFn: () => getSourceStats(params),
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch paginated list of sources.
 *
 * When `options.paused` is true the auto-refresh interval is suspended —
 * use this while a bulk action is running so a refetch doesn't race with selection state.
 */
export function useSources(
  params: ListSourcesParams = {},
  options: { paused?: boolean } = {}
) {
  const { paused = false } = options;
  return useQuery({
    queryKey: sourceKeys.list(params),
    queryFn: () => listSources(params),
    staleTime: CACHE_CONFIG.lists.staleTime,
    gcTime: CACHE_CONFIG.lists.gcTime,
    refetchInterval: paused ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch a single source by ID
 */
export function useSource(id: string) {
  return useQuery({
    queryKey: sourceKeys.detail(id),
    queryFn: () => getSource(id),
    enabled: !!id,
    staleTime: CACHE_CONFIG.details.staleTime,
    gcTime: CACHE_CONFIG.details.gcTime,
  });
}

/**
 * Hook to create a new source
 */
export function useCreateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSourceRequest) => createSource(data),
    onSuccess: () => {
      invalidateSourceSurfaces(queryClient);
      toast({
        title: 'Source created',
        description: 'The content source has been created successfully.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create source',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an existing source
 */
export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSourceRequest }) =>
      updateSource(id, data),
    onSuccess: (updatedSource: ContentSource) => {
      invalidateSourceSurfaces(queryClient);
      queryClient.setQueryData(
        sourceKeys.detail(updatedSource.id),
        updatedSource
      );
      toast({
        title: 'Source updated',
        description: 'The content source has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update source',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a source
 */
export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      invalidateSourceSurfaces(queryClient);
      toast({
        title: 'Source deleted',
        description: 'The content source has been deleted.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete source',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to trigger source ingestion
 */
export function useRunSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => runSource(id),
    onSuccess: (response, id) => {
      // Refresh source and run surfaces after CMS admits the durable request.
      queryClient.invalidateQueries({ queryKey: sourceKeys.detail(id) });
      invalidateSourceSurfaces(queryClient);
      toast({
        title: 'Ingestion queued',
        description:
          response.message || 'The source run is waiting for Aggregation dispatch.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to run ingestion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
