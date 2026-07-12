import { cmsClient } from '@/lib/api/client';

const BASE = '/admin/media/redundancy';
export type RedundancyPair = { id:string; item_a_id:string; item_b_id:string; confidence:number; verdict:string; tombstoned:boolean; reject_reason?:string };
export type RedundancyStatus = { policy:{enabled:boolean;collapse_enabled:boolean}; open_proposals:number; active_families:number; latest_run?:{summary?:string;status?:string} };
export const getRedundancyStatus=()=>cmsClient.get<RedundancyStatus>(`${BASE}/status`);
export const listRedundancyPairs=()=>cmsClient.get<{data:RedundancyPair[]}>(`${BASE}/pairs`);
export const runRedundancy=()=>cmsClient.post(`${BASE}/run`,{});
export const confirmRedundancyPair=(id:string)=>cmsClient.post(`${BASE}/pairs/${id}/confirm`,{});
export const rejectRedundancyPair=(id:string,reason:string)=>cmsClient.post(`${BASE}/pairs/${id}/reject`,{reason});
export const listRedundancyFamilies=()=>cmsClient.get<{data:Array<{id:string;status:string;canonical_content_item_id:string;last_confirmed_at:string}>}>(`${BASE}/families`);
export const listRedundancyRuns=()=>cmsClient.get<{data:Array<{id:string;trigger:string;status:string;summary:string;started_at:string}>}>(`${BASE}/runs`);
export const listRedundancyActions=()=>cmsClient.get<{data:Array<{id:string;action_kind:string;actor:string;outcome:string;reason?:string;created_at:string}>}>(`${BASE}/actions`);
export const updateRedundancyPolicy=(data:Partial<{enabled:boolean;collapse_enabled:boolean;sweep_interval_minutes:number}>)=>cmsClient.put(`${BASE}/policy`,data);
export const pauseRedundancy=(minutes:number)=>cmsClient.post(`${BASE}/pause`,{minutes});
