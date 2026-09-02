'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMediaAcquisitionConfig, useUpdateMediaAcquisitionConfig } from '@/hooks/use-media-acquisition';
import type { MediaAcquisitionMode } from '@/types/platform/source';

export function MediaAcquisitionSettingsCard() {
    const config = useMediaAcquisitionConfig();
    const update = useUpdateMediaAcquisitionConfig();
    const mode = config.data?.default_mode;
    const [podsLimit, setPodsLimit] = useState('10');

    useEffect(() => {
        if (config.data?.pods_source_run_item_limit) {
            setPodsLimit(String(config.data.pods_source_run_item_limit));
        }
    }, [config.data?.pods_source_run_item_limit]);

    const setMode = (next: MediaAcquisitionMode) => {
        if (next !== mode) update.mutate({ default_mode: next });
    };
    const savePodsLimit = () => {
        const value = Number(podsLimit);
        if (Number.isInteger(value) && value >= 1 && value <= 50 && value !== config.data?.pods_source_run_item_limit) {
            update.mutate({ pods_source_run_item_limit: value });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Media acquisition</CardTitle>
                        <CardDescription>
                            Discovery always saves metadata for preview. Automatic downloads and processes new media; manual waits for an operator action. Sources can override this default.
                        </CardDescription>
                    </div>
                    {mode && <Badge variant={mode === 'automatic' ? 'success' : 'secondary'}>{mode}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {config.isLoading ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span>
                ) : (
                    <>
                        <Button size="sm" variant={mode === 'automatic' ? 'default' : 'outline'} disabled={update.isPending} onClick={() => setMode('automatic')}>Automatic</Button>
                        <Button size="sm" variant={mode === 'manual' ? 'default' : 'outline'} disabled={update.isPending} onClick={() => setMode('manual')}>Manual approval</Button>
                    </>
                )}
                <div className="flex flex-wrap items-end gap-2 border-t pt-3">
                    <label className="grid gap-1 text-sm font-medium" htmlFor="pods-source-run-item-limit">
                        Max Pods previews per source run
                        <Input
                            id="pods-source-run-item-limit"
                            type="number"
                            min={1}
                            max={50}
                            value={podsLimit}
                            disabled={config.isLoading || update.isPending}
                            onChange={(event) => setPodsLimit(event.target.value)}
                            className="w-28"
                        />
                    </label>
                    <Button size="sm" variant="outline" disabled={config.isLoading || update.isPending || !Number.isInteger(Number(podsLimit)) || Number(podsLimit) < 1 || Number(podsLimit) > 50} onClick={savePodsLimit}>
                        Save limit
                    </Button>
                    <p className="max-w-md pb-1 text-xs text-muted-foreground">New Pods source runs save at most this many metadata previews. Default: 10. It does not alter active runs.</p>
                </div>
            </CardContent>
        </Card>
    );
}
