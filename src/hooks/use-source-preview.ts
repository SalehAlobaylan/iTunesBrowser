import { useMutation } from '@tanstack/react-query';
import { previewSource, discoverFeeds, searchPodcasts, resolveYoutube } from '@/lib/api/cms/sources';
import type {
    PreviewSourceRequest,
    PreviewSourceResponse,
    DiscoverFeedsRequest,
    DiscoverFeedsResponse,
    PodcastSearchResponse,
    YoutubeResolved,
} from '@/types/platform/source';
import { toast } from '@/components/ui/toast';

/**
 * Fetch a small sample from a source without persisting it.
 * User-triggered (button click) — mutation, not query.
 */
export function usePreviewSource() {
    return useMutation<PreviewSourceResponse, Error, PreviewSourceRequest>({
        mutationFn: (req) => previewSource(req),
        onError: (error) => {
            toast({
                title: 'Preview failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Discover candidate feed URLs from a website URL.
 */
export function useDiscoverFeeds() {
    return useMutation<DiscoverFeedsResponse, Error, DiscoverFeedsRequest>({
        mutationFn: (req) => discoverFeeds(req),
        onError: (error) => {
            toast({
                title: 'Discover failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Search iTunes for podcasts by name. User-triggered — mutation.
 */
export function useSearchPodcasts() {
    return useMutation<PodcastSearchResponse, Error, string>({
        mutationFn: (term) => searchPodcasts(term),
        onError: (error) => {
            toast({
                title: 'Podcast search failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Resolve a YouTube channel URL/@handle to channel metadata. User-triggered.
 */
export function useResolveYoutube() {
    return useMutation<YoutubeResolved, Error, string>({
        mutationFn: (url) => resolveYoutube(url),
        onError: (error) => {
            toast({
                title: 'Channel resolve failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
