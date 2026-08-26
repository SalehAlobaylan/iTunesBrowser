import { cmsClient } from '@/lib/api/client';

export interface DeliveryPolicy {
    id: string;
    name: string;
    media_kind: 'audio' | 'video';
    primary_mode: 'audio' | 'progressive' | 'hls';
    rollout_state: 'shadow' | 'active' | 'disabled';
    allow_hls: boolean;
    generate_progressive_fallback: boolean;
    hls_min_variants: number;
    policy_digest: string;
    active: boolean;
    allow_passthrough?: boolean;
    allow_remux?: boolean;
    generate_audio_alternate?: boolean;
    max_delivery_height?: number;
    variants?: Array<{ rendition_type: string; quality_tier: string; priority: number; required: boolean; enabled: boolean }>;
}

export interface DeliveryInventoryItem {
    content_item_id: string;
    classification: string;
    media_url?: string;
    playback_url?: string;
    playback_type?: string;
}
export interface DeliveryRepairPreview {
    preview_digest: string;
    source_manifest_id: string;
    source_bytes: number;
    proposed_route: string;
    estimated_renditions: string[];
    requires_new_generation: boolean;
}
export interface DeliveryRepairStatus {
    repair: { id: string; state: string; stage: string; content_item_id: string; planned_effects?: unknown; terminal_proof?: unknown; created_at?: string; updated_at?: string };
    attempts: Array<{ id: string; state: string; attempt_number: number; terminal_proof?: unknown }>;
}

export const listDeliveryPolicies = () =>
    cmsClient.get<{ data: DeliveryPolicy[] }>('/admin/media/delivery/policies');
export const updateDeliveryPolicy = (id: string, input: Partial<DeliveryPolicy>) =>
    cmsClient.put<DeliveryPolicy>(`/admin/media/delivery/policies/${id}`, input);
export const createDeliveryPolicy = (input: Omit<DeliveryPolicy, 'id' | 'policy_digest' | 'active'>) =>
    cmsClient.post<DeliveryPolicy>('/admin/media/delivery/policies', input);
export const setDeliveryPolicyActive = (id: string, active: boolean) =>
    cmsClient.patch<void>(`/admin/media/delivery/policies/${id}/active`, { active });
export const getDeliveryInventory = () =>
    cmsClient.get<{ items: DeliveryInventoryItem[]; read_only: boolean }>('/admin/media/delivery/inventory');
export const previewDeliveryRoute = (contentId: string) =>
    cmsClient.get<{ route: string; requires_new_generation: boolean; policy: DeliveryPolicy; repair_preview?: DeliveryRepairPreview; repair_unavailable_reason?: string }>(`/admin/media/delivery/preview/${contentId}`);
export const requestDeliveryRepair = (contentItemId: string, previewDigest: string) =>
    cmsClient.post<{ repair: DeliveryRepairStatus['repair'] }>('/admin/media/delivery/repairs', { content_item_id: contentItemId, preview_digest: previewDigest });
export const getDeliveryRepair = (repairId: string) =>
    cmsClient.get<DeliveryRepairStatus>(`/admin/media/delivery/repairs/${repairId}`);
export const rollbackDeliveryGeneration = (generationId: string) =>
    cmsClient.post<void>(`/admin/media/delivery/generations/${generationId}/rollback`);
