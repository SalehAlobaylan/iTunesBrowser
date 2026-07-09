import { cmsClient } from '@/lib/api/client';
import type {
    ApproveProposalPayload,
    CatalogFilters,
    CatalogTopic,
    CategoryPayload,
    PreferenceSettings,
    ProposalStatus,
    TopicCatalogResponse,
    TopicCategoriesResponse,
    TopicDrilldown,
    TopicProposalsResponse,
} from '@/types/platform/topics';

export const listTopicCatalog = (filters?: CatalogFilters) =>
    cmsClient.get<TopicCatalogResponse>('/admin/topics/catalog', filters);

export const getTopicDrilldown = (id: string) =>
    cmsClient.get<TopicDrilldown>('/admin/topics/catalog/' + id);

export const createCatalogTopic = (data: Partial<CatalogTopic>) =>
    cmsClient.post<{ data: CatalogTopic }>('/admin/topics/catalog', data);

export const updateCatalogTopic = (id: string, data: Partial<CatalogTopic>) =>
    cmsClient.put('/admin/topics/catalog/' + id, data);

export const deleteCatalogTopic = (id: string) =>
    cmsClient.delete<{ message: string }>('/admin/topics/catalog/' + id);

export const listTopicCategories = () =>
    cmsClient.get<TopicCategoriesResponse>('/admin/topics/categories');

export const createTopicCategory = (data: CategoryPayload) =>
    cmsClient.post('/admin/topics/categories', data);

export const updateTopicCategory = (slug: string, data: CategoryPayload) =>
    cmsClient.put('/admin/topics/categories/' + slug, data);

export const listTopicProposals = (status: ProposalStatus = 'pending') =>
    cmsClient.get<TopicProposalsResponse>('/admin/topics/proposals', { status });

export const approveTopicProposal = (id: number, data: ApproveProposalPayload = {}) =>
    cmsClient.post('/admin/topics/proposals/' + id + '/approve', data);

export const rejectTopicProposal = (id: number) =>
    cmsClient.post('/admin/topics/proposals/' + id + '/reject', {});

export const mergeTopicProposal = (id: number, into: string) =>
    cmsClient.post('/admin/topics/proposals/' + id + '/merge', { into });

export const mineTopics = () =>
    cmsClient.post<{ created: number }>('/admin/topics/mine', {});

export const remapTopics = () =>
    cmsClient.post<{ mapped_items: number; mapped_stories: number }>('/admin/topics/remap', {});

export const getPreferenceSettings = () =>
    cmsClient.get<{ data: PreferenceSettings }>('/admin/preferences/settings');

export const updatePreferenceSettings = (data: Partial<PreferenceSettings>) =>
    cmsClient.put<{ data: PreferenceSettings }>('/admin/preferences/settings', data);
