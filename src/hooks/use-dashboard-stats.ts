import { useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/app/providers';
import { listSources } from '@/lib/api/cms/sources';
import { listContent } from '@/lib/api/cms/content';
import { listCustomers } from '@/lib/api/crm/customers';
import { listDeals } from '@/lib/api/crm/deals';

export interface DashboardStats {
    totalSources: number;
    totalContentItems: number;
    totalCustomers: number;
    openDeals: number;
}

const OPEN_DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation'] as const;

const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async (): Promise<DashboardStats> => {
            const [sources, content, customers, leadDeals, qualifiedDeals, proposalDeals, negotiationDeals] = await Promise.all([
                listSources({ page: 1, limit: 1 }),
                listContent({ page: 1, limit: 1 }),
                listCustomers({ page: 1, limit: 1 }),
                listDeals({ page: 1, limit: 1, stage: OPEN_DEAL_STAGES[0] }),
                listDeals({ page: 1, limit: 1, stage: OPEN_DEAL_STAGES[1] }),
                listDeals({ page: 1, limit: 1, stage: OPEN_DEAL_STAGES[2] }),
                listDeals({ page: 1, limit: 1, stage: OPEN_DEAL_STAGES[3] }),
            ]);

            return {
                totalSources: sources.total,
                totalContentItems: content.total,
                totalCustomers: customers.total,
                openDeals:
                    leadDeals.total +
                    qualifiedDeals.total +
                    proposalDeals.total +
                    negotiationDeals.total,
            };
        },
        staleTime: CACHE_CONFIG.lists.staleTime,
        gcTime: CACHE_CONFIG.lists.gcTime,
    });
}
