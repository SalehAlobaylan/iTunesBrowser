// Shared tone mappings for Media Circulation. Every hue encodes one meaning and
// is used consistently across chips, rules, and bars: emerald = bring in / keep,
// violet = transform (atomize), amber = reduce exposure, cyan = shrink bytes,
// red (news accent) = needs a human, slate = held / no action.

export function headlineClass(headline: string): string {
    switch (headline) {
        case 'healthy':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        case 'watch':
        case 'feed_thin':
            return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        case 'over_budget':
        case 'degraded':
            return 'bg-news/15 text-news border-news/40';
        default:
            return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
}

/** Lane → chip tone (borders/text on card surfaces). */
export function laneChipClass(lane: string): string {
    switch (lane) {
        case 'pull':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
        case 'atomize':
            return 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300';
        case 'downrank':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        case 'cool':
            return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';
        case 'review':
            return 'border-news/40 bg-news/10 text-news';
        case 'protect':
            return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300';
        case 'limit_skip':
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

/** Lane → solid color for the row's left rule and mini-bars. */
export function laneRuleClass(lane: string): string {
    switch (lane) {
        case 'pull':
            return 'bg-emerald-500';
        case 'atomize':
            return 'bg-violet-500';
        case 'downrank':
            return 'bg-amber-500';
        case 'cool':
            return 'bg-cyan-500';
        case 'review':
            return 'bg-news';
        case 'protect':
            return 'bg-green-600';
        default:
            return 'bg-slate-400';
    }
}

export function statusChipClass(status: string): string {
    switch (status) {
        case 'pending':
            return 'border-news/40 bg-news/10 text-news';
        case 'applied':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
        case 'dismissed':
            return 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300';
        case 'superseded':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

export function bucketBarClass(state: string): string {
    switch (state) {
        case 'thin':
            return 'bg-amber-400';
        case 'ok':
            return 'bg-emerald-500';
        case 'saturated':
            return 'bg-slate-500';
        default:
            return 'bg-slate-600';
    }
}

export function bucketStateClass(state: string): string {
    switch (state) {
        case 'thin':
            return 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-300';
        case 'ok':
            return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-300';
        case 'saturated':
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30 dark:text-slate-300';
        default:
            return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
    }
}
