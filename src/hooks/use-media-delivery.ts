import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { createDeliveryPolicy, getDeliveryInventory, listDeliveryPolicies, previewDeliveryRoute, requestDeliveryRepair, getDeliveryRepair, rollbackDeliveryGeneration, setDeliveryPolicyActive, updateDeliveryPolicy, type DeliveryPolicy } from '@/lib/api/cms/media-delivery';

const key = ['media-delivery'] as const;
export function useDeliveryPolicies() { return useQuery({ queryKey: [...key, 'policies'], queryFn: listDeliveryPolicies }); }
export function useDeliveryInventory() { return useQuery({ queryKey: [...key, 'inventory'], queryFn: getDeliveryInventory }); }
export function useDeliveryRoutePreview(contentId: string) { return useQuery({ queryKey: [...key, 'preview', contentId], queryFn: () => previewDeliveryRoute(contentId), enabled: Boolean(contentId) }); }
export function useDeliveryRepairStatus(repairId: string) { return useQuery({ queryKey: [...key, 'repair', repairId], queryFn: () => getDeliveryRepair(repairId), enabled: Boolean(repairId), refetchInterval: 5_000 }); }
export function useRequestDeliveryRepair() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ contentItemId, previewDigest }: { contentItemId: string; previewDigest: string }) => requestDeliveryRepair(contentItemId, previewDigest), onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Delivery repair queued', description: 'CMS will fence and execute a new rendition generation.', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Delivery repair rejected', description: error.message, variant: 'destructive' }) });
}
export function useRollbackDeliveryGeneration() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: rollbackDeliveryGeneration, onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Previous generation reactivated', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Generation rollback rejected', description: error.message, variant: 'destructive' }) });
}
export function useSetDeliveryPolicyActive() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => setDeliveryPolicyActive(id, active), onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Delivery policy updated', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Delivery policy update failed', description: error.message, variant: 'destructive' }) });
}
export function useCreateDeliveryPolicy() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: createDeliveryPolicy, onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Delivery policy created', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Delivery policy creation failed', description: error.message, variant: 'destructive' }) });
}
export function useUpdateDeliveryPolicy() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<DeliveryPolicy> }) => updateDeliveryPolicy(id, input), onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast({ title: 'Delivery policy saved', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Delivery policy update failed', description: error.message, variant: 'destructive' }) });
}
