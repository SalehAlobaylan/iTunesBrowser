import { useQuery } from '@tanstack/react-query';
import type { AiMetricsSnapshot } from '@/types/platform/ai-metrics';

async function fetchAiMetrics(): Promise<AiMetricsSnapshot> {
    const resp = await fetch('/api/ai-metrics', { cache: 'no-store' });
    if (!resp.ok) {
        throw new Error(`Failed to load AI metrics (HTTP ${resp.status})`);
    }
    return (await resp.json()) as AiMetricsSnapshot;
}

export const aiMetricsKeys = {
    all: ['ai-metrics'] as const,
};

export function useAiMetrics() {
    return useQuery({
        queryKey: aiMetricsKeys.all,
        queryFn: fetchAiMetrics,
        refetchInterval: 15_000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        staleTime: 10_000,
        retry: 1,
    });
}
