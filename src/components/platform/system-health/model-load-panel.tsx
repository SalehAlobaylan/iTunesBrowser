'use client';

import { Sparkles } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceHealth, ServiceName } from '@/types/platform/system-health';

// Services that load ML models and report them via /ready. Enrichment owns the
// text embedder + reranker; Media owns Whisper + CLIP. Both surface here so the
// panel reflects the full AI stack, not just Enrichment.
const MODEL_SERVICES: ServiceName[] = ['enrichment', 'media'];

export function ModelLoadPanel({ services }: { services: ServiceHealth[] }) {
    const aiServices = MODEL_SERVICES.map((name) =>
        services.find((s) => s.name === name)
    ).filter((s): s is ServiceHealth => Boolean(s));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5" />
                    AI Models
                </CardTitle>
                <CardDescription>
                    Loaded state reported by each AI service&apos;s /ready.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {aiServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No AI services configured.</p>
                ) : (
                    aiServices.map((svc) => (
                        <div key={svc.name} className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {svc.displayName}
                            </p>
                            {svc.status === 'unknown' ? (
                                <p className="text-sm text-muted-foreground">
                                    {svc.displayName} not configured.
                                </p>
                            ) : !svc.models || svc.models.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No model status reported.
                                </p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {svc.models.map((m) => (
                                        <div
                                            key={m.name}
                                            className="flex items-center justify-between gap-2 rounded-md border p-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium capitalize">
                                                    {m.name}
                                                </p>
                                                {m.detail ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {m.detail}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <Badge variant={m.loaded ? 'success' : 'warning'}>
                                                {m.loaded ? 'loaded' : 'not loaded'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
