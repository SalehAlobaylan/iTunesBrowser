import { cmsClient } from '@/lib/api/client';
import type {
    CreateFeedRequest,
    FeedsListResponse,
    RSSFeed,
    UpdateFeedRequest,
} from '@/types/platform/feed';

/** List saved feeds + the public base URL for building per-topic links. */
export async function listFeeds(): Promise<FeedsListResponse> {
    return cmsClient.get<FeedsListResponse>('/admin/feeds');
}

export async function createFeed(data: CreateFeedRequest): Promise<RSSFeed> {
    return cmsClient.post<RSSFeed>('/admin/feeds', data);
}

export async function updateFeed(id: string, data: UpdateFeedRequest): Promise<RSSFeed> {
    return cmsClient.put<RSSFeed>(`/admin/feeds/${id}`, data);
}

export async function deleteFeed(id: string): Promise<unknown> {
    return cmsClient.delete(`/admin/feeds/${id}`);
}
