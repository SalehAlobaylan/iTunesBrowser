import { cmsClient } from '@/lib/api/client';
import type { StorageOperationsResponse } from '@/types/platform/storage-ops';

export async function getStorageOperations(days = 30): Promise<StorageOperationsResponse> {
    return cmsClient.get<StorageOperationsResponse>('/admin/storage/operations', { days });
}
