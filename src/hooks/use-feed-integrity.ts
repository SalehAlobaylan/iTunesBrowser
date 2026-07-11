import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import {
    closeFeedIntegrityEpisode,
    getFeedIntegrityStatus,
    listFeedIntegrityEpisodes,
    listFeedIntegrityFindings,
    listFeedIntegrityRuns,
    pauseFeedIntegritySchedule,
    revokeFeedIntegritySuppression,
    runFeedIntegrity,
    updateFeedIntegrityPolicy,
    approveFeedIntegrityAutopilotAction,
    getFeedIntegrityAutopilotStatus,
    listFeedIntegrityAutopilotActions,
    pauseFeedIntegrityAutopilot,
    rejectFeedIntegrityAutopilotAction,
    runFeedIntegrityAutopilot,
    updateFeedIntegrityAutopilotPolicy,
} from '@/lib/api/cms/feed-integrity';
import type { FeedIntegrityPolicy, FeedIntegrityTier } from '@/types/platform/feed-integrity';

export const feedIntegrityKeys = {
    all: ['feed-integrity'] as const,
    status: () => [...feedIntegrityKeys.all, 'status'] as const,
    runs: () => [...feedIntegrityKeys.all, 'runs'] as const,
    findings: () => [...feedIntegrityKeys.all, 'findings'] as const,
    episodes: () => [...feedIntegrityKeys.all, 'episodes'] as const,
    autopilot: () => [...feedIntegrityKeys.all, 'autopilot'] as const,
    actions: () => [...feedIntegrityKeys.all, 'actions'] as const,
};

export function useFeedIntegrityStatus() {
    return useQuery({ queryKey: feedIntegrityKeys.status(), queryFn: getFeedIntegrityStatus, staleTime: 15_000, refetchInterval: 30_000 });
}
export function useFeedIntegrityRuns() { return useQuery({ queryKey: feedIntegrityKeys.runs(), queryFn: listFeedIntegrityRuns, staleTime: 15_000 }); }
export function useFeedIntegrityFindings() { return useQuery({ queryKey: feedIntegrityKeys.findings(), queryFn: listFeedIntegrityFindings, staleTime: 15_000 }); }
export function useFeedIntegrityEpisodes() { return useQuery({ queryKey: feedIntegrityKeys.episodes(), queryFn: listFeedIntegrityEpisodes, staleTime: 15_000 }); }
export function useFeedIntegrityAutopilotStatus() { return useQuery({ queryKey: feedIntegrityKeys.autopilot(), queryFn: getFeedIntegrityAutopilotStatus, staleTime: 10_000, refetchInterval: 30_000 }); }
export function useFeedIntegrityAutopilotActions() { return useQuery({ queryKey: feedIntegrityKeys.actions(), queryFn: listFeedIntegrityAutopilotActions, staleTime: 10_000, refetchInterval: 30_000 }); }

function invalidate(qc: ReturnType<typeof useQueryClient>) { return () => qc.invalidateQueries({ queryKey: feedIntegrityKeys.all }); }
export function useUpdateFeedIntegrityPolicy() { const qc=useQueryClient(); return useMutation({ mutationFn:(patch:Partial<FeedIntegrityPolicy>)=>updateFeedIntegrityPolicy(patch), onSuccess:()=>{invalidate(qc)();toast({title:'Feed Integrity settings saved',variant:'success'})} }); }
export function useRunFeedIntegrity() { const qc=useQueryClient(); return useMutation({ mutationFn:(tier:FeedIntegrityTier)=>runFeedIntegrity(tier), onSuccess:(run)=>{invalidate(qc)();toast({title:'Feed Integrity run complete',description:run.summary,variant:run.status==='failed'?'destructive':'success'})}, onError:(e:Error)=>toast({title:'Feed Integrity run failed',description:e.message,variant:'destructive'}) }); }
export function usePauseFeedIntegritySchedule() { const qc=useQueryClient(); return useMutation({mutationFn:pauseFeedIntegritySchedule,onSuccess:()=>invalidate(qc)()}); }
export function useCloseFeedIntegrityEpisode() { const qc=useQueryClient(); return useMutation({mutationFn:({id,reason}:{id:string;reason?:string})=>closeFeedIntegrityEpisode(id,reason),onSuccess:()=>invalidate(qc)()}); }
export function useRevokeFeedIntegritySuppression() { const qc=useQueryClient(); return useMutation({mutationFn:revokeFeedIntegritySuppression,onSuccess:()=>invalidate(qc)()}); }
export function useUpdateFeedIntegrityAutopilotPolicy() { const qc=useQueryClient(); return useMutation({mutationFn:(patch:Partial<FeedIntegrityPolicy>)=>updateFeedIntegrityAutopilotPolicy(patch),onSuccess:()=>{invalidate(qc)();toast({title:'Autopilot policy saved',variant:'success'})}}); }
export function useRunFeedIntegrityAutopilot() { const qc=useQueryClient(); return useMutation({mutationFn:runFeedIntegrityAutopilot,onSuccess:()=>{invalidate(qc)();toast({title:'Latest integrity run evaluated',variant:'success'})}}); }
export function usePauseFeedIntegrityAutopilot() { const qc=useQueryClient(); return useMutation({mutationFn:pauseFeedIntegrityAutopilot,onSuccess:()=>invalidate(qc)()}); }
export function useApproveFeedIntegrityAction() { const qc=useQueryClient(); return useMutation({mutationFn:approveFeedIntegrityAutopilotAction,onSuccess:()=>{invalidate(qc)();toast({title:'Action approved',variant:'success'})},onError:(e:Error)=>toast({title:'Approval blocked',description:e.message,variant:'destructive'})}); }
export function useRejectFeedIntegrityAction() { const qc=useQueryClient(); return useMutation({mutationFn:({id,reason}:{id:string;reason:string})=>rejectFeedIntegrityAutopilotAction(id,reason),onSuccess:()=>invalidate(qc)()}); }
