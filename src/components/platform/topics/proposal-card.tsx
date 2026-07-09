'use client';

import { Check, GitMerge, TrendingUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TopicProposal } from '@/types/platform/topics';

const STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'destructive' | 'outline' | 'warning'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
    merged: 'outline',
};

export function ProposalCard({
    proposal,
    onApprove,
    onReject,
    onMerge,
}: {
    proposal: TopicProposal;
    onApprove: (p: TopicProposal) => void;
    onReject: (p: TopicProposal) => void;
    onMerge: (p: TopicProposal) => void;
}) {
    const ev = proposal.evidence ?? {};
    const isPending = proposal.status === 'pending';
    const tags = Array.isArray(ev.source_tags) ? ev.source_tags.slice(0, 6) : [];
    const samples = Array.isArray(ev.sample_titles) ? ev.sample_titles.slice(0, 3) : [];

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{proposal.suggested_label_en || proposal.suggested_slug}</span>
                        <Badge variant={STATUS_VARIANT[proposal.status] ?? 'secondary'}>{proposal.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground" dir="rtl">
                        {proposal.suggested_label_ar || proposal.suggested_slug}
                        {proposal.suggested_category && (
                            <>
                                {' · '}
                                <span dir="ltr">{proposal.suggested_category}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {typeof ev.member_count === 'number' && (
                        <span className="tabular-nums">{ev.member_count} items</span>
                    )}
                    {typeof ev.demand_serves === 'number' && ev.demand_serves > 0 && (
                        <span className="flex items-center gap-1 tabular-nums">
                            <TrendingUp className="h-3 w-3" /> {ev.demand_serves}
                        </span>
                    )}
                </div>
            </div>

            {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                            {t}
                        </Badge>
                    ))}
                </div>
            )}

            {samples.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {samples.map((s, i) => (
                        <li key={i} className="truncate">
                            · {s}
                        </li>
                    ))}
                </ul>
            )}

            {isPending && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onApprove(proposal)}>
                        <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onMerge(proposal)}>
                        <GitMerge className="mr-1 h-4 w-4" /> Merge
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onReject(proposal)}>
                        <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                </div>
            )}
        </div>
    );
}
