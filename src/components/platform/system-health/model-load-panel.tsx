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
import type { ServiceHealth } from '@/types/platform/system-health';

export function ModelLoadPanel({ services }: { services: ServiceHealth[] }) {
    const enrichment = services.find((s) => s.name === 'enrichment');
    const models = enrichment?.models ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5" />
                    Enrichment Models
                </CardTitle>
                <CardDescription>
                    Loaded state reported by Enrichment /ready.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!enrichment || enrichment.status === 'unknown' ? (
                    <p className="text-sm text-muted-foreground">
                        Enrichment service not configured.
                    </p>
                ) : models.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No model status reported.
                    </p>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {models.map((m) => (
                            <div
                                key={m.name}
                                className="flex items-center justify-between rounded-md border p-3"
                            >
                                <span className="text-sm font-medium capitalize">{m.name}</span>
                                <Badge variant={m.loaded ? 'success' : 'warning'}>
                                    {m.loaded ? 'loaded' : 'not loaded'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
