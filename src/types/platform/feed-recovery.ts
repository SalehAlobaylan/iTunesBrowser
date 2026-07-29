export type FeedRecoveryLane = 'news' | 'media' | 'both';
export type FeedRecoveryLevel = 'repair' | 'rotate' | 'purge_reseed';
export interface FeedRecoveryPlan { id:string; tenant_id:string; lane:FeedRecoveryLane; level:FeedRecoveryLevel; capacity_mode:'safe_cutover'|'low_space_reset'; state:string; plan_hash:string; manifest_hash:string; source_checksum:string; source_count:number; target_count:number; no_full_rollback:boolean; expires_at:string; evidence:Record<string,unknown>; }
export interface FeedRecoveryRun { id:string; phase:string; lane:string; correlation_id:string; not_before?:string; outcome?:string; error?:string; created_at:string; }
