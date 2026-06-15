// Feeds Finding — auto source discovery types.

export interface DiscoveryProfile {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    languages: string[];
    enabled: boolean;
    max_suggestions_per_run: number;
    last_run_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProfileRequest {
    name: string;
    description?: string;
    keywords?: string[];
    languages?: string[];
    enabled?: boolean;
    max_suggestions_per_run?: number;
}

export type UpdateProfileRequest = Partial<CreateProfileRequest>;

export interface SuggestionSampleItem {
    title: string;
    url?: string;
    published_at?: string | null;
}

export interface SuggestionHealth {
    items_count?: number;
    last_item_at?: string | null;
    parse_ok?: boolean;
}

export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SuggestionEvidence {
    citation_count?: number;
    cocitation_count?: number;
    authority?: number;
    relevance?: number;
    composite?: number;
    trend?: string;
    via?: string[];
    subscribers?: number;
}

export interface SourceSuggestion {
    id: string;
    profile_id?: string;
    name: string;
    type: string;
    feed_url: string;
    site_url?: string;
    image_url?: string;
    language?: string;
    confidence: number;
    relevance_score?: number;
    health?: SuggestionHealth;
    sample_items?: SuggestionSampleItem[];
    evidence?: SuggestionEvidence;
    discovered_via?: string;
    status: SuggestionStatus;
    reject_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface SuggestedProfileDraft {
    name: string;
    keywords: string[];
    description: string;
    article_count: number;
}

export interface NewsSource {
    id: string;
    name: string;
    type: string;
    category?: 'news' | 'media';
    feed_url?: string;
    image_url?: string;
    is_active: boolean;
    fetch_interval_minutes: number;
    last_fetched_at?: string;
    created_at: string;
    updated_at: string;
    discovery_profile_id?: string;
    items_count: number;
    ready: number;
    failed: number;
    last_item_at?: string;
    engagement: number;
}

export interface DiscoveryConfig {
    automation_enabled: boolean;
    sweep_interval_hours: number;
    min_confidence: number;
    min_relevance: number;
    dup_threshold: number;
    dup_penalty: number;
    recency_window_days: number;
    max_candidates_per_profile: number;
    search_provider: 'auto' | 'tavily' | 'crawl';
    // Source Intelligence Graph
    intelligence_enabled: boolean;
    telegram_discovery_enabled: boolean;
    graph_build_interval_hours: number;
    promotion_threshold: number;
    weight_citation: number;
    weight_cocitation: number;
    weight_authority: number;
    weight_relevance: number;
    weight_health: number;
    weight_novelty: number;
    created_at?: string;
    updated_at?: string;
}

export interface NetworkAuthority {
    domain: string;
    authority: number;
    citation_count: number;
    cocitation_count: number;
    feed_valid: boolean;
    status: string;
}

export interface ListResponse<T> {
    data: T[];
    total?: number;
}

export interface SuggestionsResponse {
    data: SourceSuggestion[];
    total: number;
    page: number;
    limit: number;
}
