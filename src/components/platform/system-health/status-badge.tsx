'use client';

import { Badge } from '@/components/ui/badge';
import type { ServiceStatus } from '@/types/platform/system-health';

export function statusVariant(
    status: ServiceStatus
): 'success' | 'warning' | 'destructive' | 'secondary' {
    if (status === 'healthy') return 'success';
    if (status === 'degraded') return 'warning';
    if (status === 'unhealthy') return 'destructive';
    return 'secondary';
}

export function StatusBadge({ status }: { status: ServiceStatus }) {
    return (
        <Badge variant={statusVariant(status)} className="capitalize">
            {status}
        </Badge>
    );
}
