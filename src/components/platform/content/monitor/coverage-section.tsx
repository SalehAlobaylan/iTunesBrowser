'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useEmbeddingStats } from '@/hooks/use-intelligence';
import { EmbeddingCoverageStats } from '@/components/platform/intelligence/embedding-coverage-stats';
import { formatNumber } from '@/lib/utils/format';
import { CAPTION_STATE_LABELS } from '@/types/platform/content';
import type { CaptionState } from '@/types/platform/content';

const CAPTION_ORDER: CaptionState[] = ['stt_done', 'youtube_human', 'youtube_auto', 'none'];
const CAPTION_BAR_CLASS: Record<CaptionState, string> = {
    stt_done: 'bg-success',
    youtube_human: 'bg-info',
    youtube_auto: 'bg-warning',
    none: 'bg-muted-foreground/40',
};

interface CoverageSectionProps {
    mode: 'embedding' | 'caption';
    byCaptionState?: Record<string, number>;
}

export function CoverageSection({ mode, byCaptionState }: CoverageSectionProps) {
    return mode === 'embedding' ? (
        <EmbeddingCoverage />
    ) : (
        <CaptionCoverage byCaptionState={byCaptionState ?? {}} />
    );
}

// Text-embedding coverage — reuses the tenant-wide enrichment stats + the
// existing intelligence coverage component.
function EmbeddingCoverage() {
    const { data, isLoading } = useEmbeddingStats();
    if (isLoading && !data) return <Skeleton className="h-28 w-full" />;
    if (!data) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Text embeddings</span>
                <span className="font-mono tabular-nums">
                    {formatNumber(data.with_embedding)} / {formatNumber(data.total_ready)} ready (
                    {Math.round(data.percentage)}%)
                </span>
            </div>
            <EmbeddingCoverageStats data={data.by_type ?? []} />
        </div>
    );
}

// Caption/transcript coverage for media, from the stats endpoint's by_caption_state.
function CaptionCoverage({ byCaptionState }: { byCaptionState: Record<string, number> }) {
    const total = CAPTION_ORDER.reduce((sum, k) => sum + (byCaptionState[k] ?? 0), 0);
    if (total === 0) {
        return <p className="text-sm text-muted-foreground">No media items yet.</p>;
    }
    return (
        <div className="space-y-2">
            {CAPTION_ORDER.map((state) => {
                const count = byCaptionState[state] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                    <div key={state} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>{CAPTION_STATE_LABELS[state]}</span>
                            <span className="tabular-nums text-muted-foreground">
                                {formatNumber(count)} ({pct}%)
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full ${CAPTION_BAR_CLASS[state]}`} style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
