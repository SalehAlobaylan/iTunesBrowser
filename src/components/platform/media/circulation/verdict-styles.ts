// Shared color mappings for Media Circulation verdicts/states. Returns Tailwind
// class strings applied to shadcn Badge (which has no success/warning variant).

export function headlineClass(headline: string): string {
    switch (headline) {
        case 'healthy':
            return 'bg-green-500/15 text-green-600 border-green-500/30';
        case 'watch':
        case 'feed_thin':
            return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
        case 'over_budget':
            return 'bg-red-500/15 text-red-600 border-red-500/30';
        case 'degraded':
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
        default:
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
    }
}

export function verdictClass(verdict: string): string {
    switch (verdict) {
        case 'protect':
        case 'pull_now':
        case 'deep_pull':
            return 'bg-green-500/15 text-green-600 border-green-500/30';
        case 'pull_limited':
        case 're_encode':
        case 'move_to_cold':
            return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
        case 'rank_down':
        case 'pause_source':
            return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
        case 'recoverable_delete':
            return 'bg-red-500/15 text-red-600 border-red-500/30';
        case 'needs_admin_review':
            return 'bg-purple-500/15 text-purple-600 border-purple-500/30';
        case 'skip_source':
        default:
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
    }
}

export function bucketStateClass(state: string): string {
    switch (state) {
        case 'thin':
            return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
        case 'ok':
            return 'bg-green-500/15 text-green-600 border-green-500/30';
        case 'saturated':
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
        default:
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
    }
}
