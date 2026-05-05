import { useMutation } from '@tanstack/react-query';
import { previewSource, discoverFeeds } from '@/lib/api/cms/sources';
import type {
    PreviewSourceRequest,
    PreviewSourceResponse,
    DiscoverFeedsRequest,
    DiscoverFeedsResponse,
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
