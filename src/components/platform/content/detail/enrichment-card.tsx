'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { NewsMetadata } from '@/types/platform/content';

interface EnrichmentCardProps {
    news: NewsMetadata;
}

function formatBoolean(value?: boolean): string {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'N/A';
}

export function EnrichmentCard({ news }: EnrichmentCardProps) {
    const [open, setOpen] = useState(true);

    return (
        <Card>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30"
            >
                <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">Enrichment</span>
                    <Badge variant={news.likelyNews ? 'success' : 'secondary'}>
                        {news.likelyNews ? 'Likely news' : 'Not news'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Score {news.score} · {news.confidence}
                    </span>
                </div>
                {open ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
            </button>
            {open && (
                <CardContent className="space-y-4 border-t pt-4">
                    {news.categoryHints && news.categoryHints.length > 0 && (
                        <div>
                            <div className="mb-2 text-sm text-muted-foreground">
                                Category hints
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {news.categoryHints.map((c) => (
                                    <Badge key={c} variant="outline">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {news.matchedKeywords && news.matchedKeywords.length > 0 && (
                        <div>
                            <div className="mb-2 text-sm text-muted-foreground">
                                Matched keywords
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {news.matchedKeywords.map((k) => (
                                    <Badge key={k} variant="secondary">
                                        {k}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {news.signals && (
                        <div className="space-y-1 text-sm">
                            <div className="text-muted-foreground">Signals</div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <SignalRow
                                    label="Breaking prefix"
                                    value={formatBoolean(news.signals.hasBreakingPrefix)}
                                />
                                <SignalRow
                                    label="Verified source"
                                    value={formatBoolean(news.signals.verifiedSource)}
                                />
                                <SignalRow
                                    label="Source looks news"
                                    value={formatBoolean(news.signals.sourceLooksNews)}
                                />
                                <SignalRow
                                    label="Has attribution"
                                    value={formatBoolean(news.signals.hasAttribution)}
                                />
                                <SignalRow
                                    label="Recency (hours)"
                                    value={
                                        typeof news.signals.recencyHours === 'number'
                                            ? String(news.signals.recencyHours)
                                            : 'N/A'
                                    }
                                />
                                {news.version && (
                                    <SignalRow label="Model version" value={news.version} />
                                )}
                            </dl>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

function SignalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}
