export interface TopicCategory {
    slug: string;
    label_ar: string;
    label_en: string;
    sort_order: number;
    active: boolean;
}

export interface CatalogTopic {
    id: string;
    slug: string;
    label_ar: string;
    label_en: string;
    category_slug?: string;
    member_count: number;
    active: boolean;
    featured: boolean;
    created_from: string;
}

export interface TopicProposalEvidence {
    member_count?: number;
    sample_titles?: string[];
    source_tags?: string[];
    demand_serves?: number;
}

export interface TopicProposal {
    id: number;
    suggested_slug: string;
    suggested_label_ar?: string;
    suggested_label_en?: string;
    suggested_category?: string;
    evidence?: TopicProposalEvidence;
    status: string;
    merged_into?: string;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
}

export interface TopicCatalogResponse {
    data: CatalogTopic[];
    categories: TopicCategory[];
}

export interface TopicProposalsResponse {
    data: TopicProposal[];
}

export interface TopicCategoriesResponse {
    data: TopicCategory[];
    topic_counts: Record<string, number>;
}

export interface CatalogFilters {
    active?: boolean;
    featured?: boolean;
    category?: string;
    q?: string;
}

export interface TopicMappedItem {
    id: string;
    title: string;
    type: string;
    score: number;
}

export interface TopicMappedStory {
    id: string;
    label: string;
    score: number;
}

export interface TopicDrilldown {
    topic: CatalogTopic;
    mapped_items: TopicMappedItem[];
    mapped_stories: TopicMappedStory[];
    item_count: number;
    story_count: number;
}

export interface ApproveProposalPayload {
    slug?: string;
    label_ar?: string;
    label_en?: string;
    category_slug?: string;
    featured?: boolean;
}

export interface CategoryPayload {
    slug?: string;
    label_ar?: string;
    label_en?: string;
    sort_order?: number;
    active?: boolean;
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'all';

export interface PreferenceSettings {
    tenant_id: string;
    foryou_enabled: boolean;
    news_enabled: boolean;
    w_foryou: number;
    w_news: number;
    weight_complete: number;
    weight_bookmark: number;
    weight_share: number;
    weight_like: number;
    weight_comment: number;
    weight_view: number;
    decay_half_life_days: number;
    declared_prior: number;
    category_discount: number;
}
