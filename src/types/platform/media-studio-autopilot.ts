// Media Studio Clearance Autopilot (stage 6) — cockpit types.
// See docs/media-studio-autopilot-plan.md.

export type StudioAutopilotMode = 'observe' | 'safe_auto';

export interface MediaStudioAutopilotPolicy {
    tenant_id: string;
    autopilot_enabled: boolean;
    autopilot_mode: StudioAutopilotMode;
    observe_proposals: boolean;
    interval_minutes: number;
    chain_debounce_minutes: number;
    max_clears_per_run: number;
    max_publishes_per_run: number;
    max_rejects_per_run: number;
    max_stt_per_run: number;
    max_proposals_per_run: number;
    aged_threshold_days: number;
    dirty_workbench_minutes: number;
    trust_min_decisions: number;
    trust_min_approve_pct: number;
    trust_max_reversal_pct: number;
    paused_until?: string | null;
    last_run_at?: string | null;
}

export interface StudioHealthSnapshot {
    review_queue_depth: number;
    aged_count: number;
    oldest_case_age_hours: number;
    by_code: Record<string, number>;
    transcript_auto_repair: number;
    headline: string;
}

export interface StudioReasonCodeTrust {
    code: string;
    decisions: number;
    approvals: number;
    rejections: number;
    approve_pct: number;
    reversal_pct: number;
    reversals: number;
    earned: boolean;
    locked_off: boolean;
}

export interface MediaStudioProposalInboxItem {
    action_id: string;
    chapter_id: string;
    content_item_id?: string | null;
    parent_id?: string | null;
    title: string;
    summary?: string | null;
    review_code?: string | null;
    review_reason?: string | null;
    proposal: 'publish' | 'reject';
    confidence: number;
    rationale: string;
    checked: {
        duration_ok: boolean;
        no_sponsor_overlap: boolean;
        coherent_start: boolean;
        coherent_end: boolean;
    };
    age_hours: number;
    aged: boolean;
    created_at: string;
    duration_sec?: number | null;
}

export interface MediaStudioRun {
    id: string;
    tenant_id: string;
    trigger: string;
    mode: string;
    status: string;
    started_at: string;
    finished_at?: string | null;
    summary?: string;
    health_before?: StudioHealthSnapshot;
    health_after?: StudioHealthSnapshot;
    created_by?: string;
    error?: string;
}

export interface MediaStudioAction {
    id: string;
    unit_type: string;
    chapter_id?: string | null;
    content_item_id?: string | null;
    recommendation_id?: string | null;
    verdict: string;
    tool_name: string;
    status: string;
    reason?: string;
    guardrail?: string;
    proposal?: unknown;
    proposal_model?: string;
    proposal_confidence?: number;
    human_outcome?: string;
    feed_impact: number;
    stt_impact: number;
    started_at: string;
}

export interface MediaStudioAutopilotStatus {
    policy: MediaStudioAutopilotPolicy;
    health: StudioHealthSnapshot;
    next_run_at?: string | null;
    trust: StudioReasonCodeTrust[];
    pending_proposals: number;
    lead: {
        circulation_autopilot_enabled: boolean;
        chain_idle: boolean;
    };
    last_run?: MediaStudioRun;
}

export interface MediaStudioRunDetail {
    run: MediaStudioRun;
    actions: MediaStudioAction[];
}

// ---- Insights (visualization rollups) ----

export interface StudioRunBuckets {
    rejected: number;
    published: number;
    held_approval: number;
    skipped: number;
    errored: number;
    proposals: number;
    stt: number;
}

export interface StudioRunHistoryEntry {
    id: string;
    started_at: string;
    trigger: string;
    mode: string;
    status: string;
    cases_before: number;
    cases_after: number;
    buckets: StudioRunBuckets;
}

export interface StudioLatestFlow {
    run_id: string;
    mode: string;
    trigger: string;
    cases_before: number;
    cases_after: number;
    rejected: number;
    published: number;
    held_approval: number;
    held_trust: number;
    held_editorial: number;
    held_multicode: number;
    held_upstream: number;
    skipped: number;
    errored: number;
    proposals: number;
    stt: number;
    observe: boolean;
}

export interface MediaStudioAutopilotInsights {
    run_history: StudioRunHistoryEntry[];
    guardrail_totals: Record<string, number>;
    outcome_totals: Record<string, number>;
    latest_flow: StudioLatestFlow | null;
}
