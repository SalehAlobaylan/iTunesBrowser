import type { SourceHealth } from '@/types/platform/source';

// Shared health vocabulary for all source management surfaces (fleet table,
// fleet grid, media gallery). Mirrors the derivation in lib/sources/health.ts
// and the CMS GetSourceStats endpoint.
export const HEALTH_ORDER: SourceHealth[] = ['healthy', 'stale', 'never_run', 'disabled'];

export const HEALTH_LABELS: Record<SourceHealth, string> = {
    healthy: 'Healthy',
    stale: 'Stale',
    never_run: 'Never run',
    disabled: 'Disabled',
};

// Solid background per health (tiles, ribbon segments, rings).
export const HEALTH_BG: Record<SourceHealth, string> = {
    healthy: 'bg-success',
    stale: 'bg-destructive',
    never_run: 'bg-warning',
    disabled: 'bg-muted-foreground/40',
};

// Text tone per health (legends, counts).
export const HEALTH_TEXT: Record<SourceHealth, string> = {
    healthy: 'text-success',
    stale: 'text-destructive',
    never_run: 'text-warning',
    disabled: 'text-muted-foreground',
};

// Ring/border tone per health (card artwork rings).
export const HEALTH_RING: Record<SourceHealth, string> = {
    healthy: 'ring-success',
    stale: 'ring-destructive',
    never_run: 'ring-warning',
    disabled: 'ring-muted-foreground/40',
};
