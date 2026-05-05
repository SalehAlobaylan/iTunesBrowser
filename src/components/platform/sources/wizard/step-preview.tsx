'use client';

import { Loader2, Play, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreviewSource } from '@/hooks/use-source-preview';
import { PreviewTable } from './preview-table';
import { buildApiConfig } from './types';
import type { WizardState } from './types';
import type { PreviewSourceResponse, SourceType } from '@/types/platform/source';

interface StepPreviewProps {
    state: WizardState;
    onResult: (result: PreviewSourceResponse | null) => void;
}

export function StepPreview({ state, onResult }: StepPreviewProps) {
    const preview = usePreviewSource();
    const result = state.previewResult;

    const canPreview = state.type !== null && state.type !== 'MANUAL' && state.feedUrl.trim() !== '';

    const runPreview = () => {
        if (!canPreview) return;
        preview.mutate(
            {
                sourceType: state.type as SourceType,
                url: state.feedUrl.trim(),
                settings: buildApiConfig(state),
                limit: 10,
            },
            {
                onSuccess: (data) => onResult(data),
            }
        );
    };

    if (state.type === 'MANUAL') {
        return (
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                Manual sources don&apos;t fetch — preview is skipped.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm">
                        Fetch a small sample from <code>{state.feedUrl || '—'}</code> without saving.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Confirms the URL works and shows what will actually be ingested.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={runPreview}
                    disabled={!canPreview || preview.isPending}
                >
                    {preview.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fetching…
                        </>
                    ) : (
                        <>
                            <Play className="mr-2 h-4 w-4" />
                            {result ? 'Re-run preview' : 'Preview sample items'}
                        </>
                    )}
                </Button>
            </div>

            {result && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="success">Fetched: {result.fetched}</Badge>
                        <Badge variant="secondary">Normalized: {result.normalized}</Badge>
                        <Badge variant="secondary">Skipped: {result.skipped}</Badge>
                        {result.errors > 0 && (
                            <Badge variant="destructive">Errors: {result.errors}</Badge>
                        )}
                        {result.message && (
                            <span className="text-xs text-muted-foreground">
                                {result.message}
                            </span>
                        )}
                    </div>
                    <PreviewTable items={result.items} />
                </div>
            )}

            {!result && !preview.isPending && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                    <div>
                        <p className="font-medium">Recommended: confirm what will be ingested.</p>
                        <p className="text-xs text-muted-foreground">
                            You can skip this step, but previewing catches bad URLs and overly
                            strict filters before the source is created.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
