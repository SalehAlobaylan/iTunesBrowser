'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRejectTopicProposal, useTopicProposals } from '@/hooks/use-topics';
import type { ProposalStatus, TopicProposal } from '@/types/platform/topics';
import { ApproveDialog } from './approve-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { MergeDialog } from './merge-dialog';
import { ProposalCard } from './proposal-card';

export function ProposalsTab() {
    const [status, setStatus] = useState<ProposalStatus>('pending');
    const proposals = useTopicProposals(status);
    const reject = useRejectTopicProposal();

    const [approveTarget, setApproveTarget] = useState<TopicProposal | null>(null);
    const [mergeTarget, setMergeTarget] = useState<TopicProposal | null>(null);
    const [rejectTarget, setRejectTarget] = useState<TopicProposal | null>(null);

    // Ranked queue (§13.3): highest autopilot confidence first so approve becomes
    // one glance + one click; unscored proposals fall back to recency order.
    const rows = [...(proposals.data?.data ?? [])].sort((a, b) => {
        const ca = a.confidence ?? -1;
        const cb = b.confidence ?? -1;
        if (ca !== cb) return cb - ca;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-base">Proposal queue</CardTitle>
                    <CardDescription>Mined topic candidates awaiting a human decision.</CardDescription>
                </div>
                <Select value={status} onValueChange={(v) => setStatus(v as ProposalStatus)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="merged">Merged</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="space-y-3">
                {proposals.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
                ) : proposals.isError ? (
                    <div className="flex items-center gap-2 p-8 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Failed to load proposals.
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No {status === 'all' ? '' : status} proposals.
                    </div>
                ) : (
                    rows.map((p) => (
                        <ProposalCard
                            key={p.id}
                            proposal={p}
                            onApprove={setApproveTarget}
                            onMerge={setMergeTarget}
                            onReject={setRejectTarget}
                        />
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
                onConfirm={() =>
                    rejectTarget &&
                    reject.mutate(rejectTarget.id, { onSuccess: () => setRejectTarget(null) })
                }
            />
        </Card>
    );
}
