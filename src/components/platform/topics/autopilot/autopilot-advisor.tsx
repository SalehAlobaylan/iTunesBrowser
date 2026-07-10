'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, GitMerge, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRejectTopicProposal, useTopicProposals } from '@/hooks/use-topics';
import type { TopicProposal } from '@/types/platform/topics';
import { ApproveDialog } from '../approve-dialog';
import { ConfirmDialog } from '../confirm-dialog';
import { MergeDialog } from '../merge-dialog';

// Inline ranked advisor queue — the cockpit's one-glance-one-click surface. Top
// pending proposals by autopilot confidence with Approve/Reject/Merge wired to
// the SAME dialogs and mutations the Proposals tab uses.

const VERDICT_TONE: Record<string, 'success' | 'info' | 'destructive' | 'secondary'> = {
    high_confidence: 'success',
    review: 'info',
    suggest_reject: 'destructive',
};

const TOP_N = 8;

export function AutopilotAdvisor({ onViewAll }: { onViewAll?: () => void }) {
    const proposals = useTopicProposals('pending');
    const reject = useRejectTopicProposal();
    const [approveTarget, setApproveTarget] = useState<TopicProposal | null>(null);
    const [mergeTarget, setMergeTarget] = useState<TopicProposal | null>(null);
    const [rejectTarget, setRejectTarget] = useState<TopicProposal | null>(null);

    const ranked = [...(proposals.data?.data ?? [])]
        .sort((a, b) => {
            const ca = a.confidence ?? -1;
            const cb = b.confidence ?? -1;
            if (ca !== cb) return cb - ca;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, TOP_N);
    const total = proposals.data?.data.length ?? 0;

    return (
        <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-base">Advisor queue</CardTitle>
                    <CardDescription>
                        Top {Math.min(TOP_N, total)} of {total} pending, ranked by confidence — approve is one glance, one click.
                    </CardDescription>
                </div>
                {total > TOP_N && onViewAll && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onViewAll}>
                        View all {total} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-1.5">
                {proposals.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                ) : proposals.isError ? (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                        <span className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" /> Proposal queue unavailable.
                        </span>
                        <Button variant="outline" size="sm" onClick={() => proposals.refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : ranked.length === 0 ? (
                    <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Queue is clear — nothing pending review.
                    </p>
                ) : (
                    ranked.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-medium">{p.suggested_label_en || p.suggested_slug}</span>
                                    {typeof p.confidence === 'number' && (
                                        <Badge variant={VERDICT_TONE[p.predicted_verdict ?? ''] ?? 'secondary'} className="text-[10px]">
                                            {(p.confidence * 100).toFixed(0)}%
                                        </Badge>
                                    )}
                                    {p.autopilot_flags?.duplicate && (
                                        <Badge variant="destructive" className="text-[10px]">
                                            dup{p.autopilot_flags.duplicate_of ? ` of ${p.autopilot_flags.duplicate_of}` : ''}
                                        </Badge>
                                    )}
                                    {p.autopilot_flags?.needs_label && (
                                        <Badge variant="warning" className="text-[10px]">
                                            needs label
                                        </Badge>
                                    )}
                                </div>
                                <div className="truncate text-xs text-muted-foreground" dir="rtl">
                                    {p.suggested_label_ar || p.suggested_slug}
                                </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    aria-label={`Approve ${p.suggested_label_en || p.suggested_slug}`}
                                    title="Approve proposal"
                                    onClick={() => setApproveTarget(p)}
                                >
                                    <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    aria-label={`Merge ${p.suggested_label_en || p.suggested_slug}`}
                                    title="Merge proposal"
                                    onClick={() => setMergeTarget(p)}
                                >
                                    <GitMerge className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                    aria-label={`Reject ${p.suggested_label_en || p.suggested_slug}`}
                                    title="Reject proposal"
                                    onClick={() => setRejectTarget(p)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            <ApproveDialog proposal={approveTarget} open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)} />
            <MergeDialog proposal={mergeTarget} open={!!mergeTarget} onOpenChange={(o) => !o && setMergeTarget(null)} />
            <ConfirmDialog
                open={!!rejectTarget}
                onOpenChange={(o) => !o && setRejectTarget(null)}
                title="Reject proposal?"
                destructive
                confirmLabel="Reject"
                pending={reject.isPending}
                description={
                    <>
                        Reject <strong>{rejectTarget?.suggested_label_en || rejectTarget?.suggested_slug}</strong>? It won&apos;t be
                        proposed again.
                    </>
                }
                onConfirm={() => rejectTarget && reject.mutate(rejectTarget.id, { onSuccess: () => setRejectTarget(null) })}
            />
        </Card>
    );
}
