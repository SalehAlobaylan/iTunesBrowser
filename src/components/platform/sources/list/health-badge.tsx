'use client';

import { Badge } from '@/components/ui/badge';
import { sourceHealth } from '@/lib/sources/health';
import type { ContentSource } from '@/types/platform/source';

interface HealthBadgeProps {
    source: ContentSource;
}

export function HealthBadge({ source }: HealthBadgeProps) {
    const health = sourceHealth(source);
    return <Badge variant={health.variant}>{health.label}</Badge>;
}
