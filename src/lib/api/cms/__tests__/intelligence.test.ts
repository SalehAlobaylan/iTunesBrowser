import { normalizeEmbeddingStats } from '@/lib/api/cms/intelligence';
import type { EmbeddingStats } from '@/types/platform/intelligence';

describe('Intelligence API normalization', () => {
    it('normalizes a null embedding breakdown from an empty database', () => {
        const response = {
            total_ready: 0,
            with_embedding: 0,
            percentage: 0,
            by_type: null,
        } as unknown as EmbeddingStats;

        expect(normalizeEmbeddingStats(response).by_type).toEqual([]);
    });
});
