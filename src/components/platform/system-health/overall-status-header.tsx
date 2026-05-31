'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import { CopyDiagnostics } from './copy-diagnostics';
import type { SystemHealthSnapshot } from '@/types/platform/system-health';

interface Props {
    snapshot?: SystemHealthSnapshot;
    isFetching: boolean;
    onRefresh: () => void;
}

export function OverallStatusHeader({ snapshot, isFetching, onRefresh }: Props) {
    const total = snapshot?.services.length ?? 0;
    const healthy = snapshot?.services.filter((s) => s.status === 'healthy').length ?? 0;
    const critical = snapshot?.issues.filter((i) => i.severity === 'critical').length ?? 0;
    const warnings = snapshot?.issues.filter((i) => i.severity === 'warning').length ?? 0;

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    {snapshot ? <StatusBadge status={snapshot.overall} /> : null}
                    <div>
                        <p className="text-2xl font-bold tracking-tight">
                            {healthy} of {total} services healthy
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {critical} critical · {warnings} warning
                            {snapshot
                                ? ` · updated ${new Date(snapshot.timestamp).toLocaleTimeString()}`
                                : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CopyDiagnostics snapshot={snapshot} />
                    <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
