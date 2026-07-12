import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { ackOpsAttention, clearOpsAttention, getOpsAttention, getOpsBriefing, getOpsStatus, listOpsCommands, markOpsBriefingSeen, pauseOpsFleet, pauseOpsMember, resumeOpsCommand, snoozeOpsAttention } from '@/lib/api/cms/operations';

const keys = { all: ['operations-command-center'] as const, status: () => [...keys.all, 'status'] as const, attention: () => [...keys.all, 'attention'] as const, briefing: () => [...keys.all, 'briefing'] as const, commands: () => [...keys.all, 'commands'] as const };
const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: keys.all });

export function useOpsStatus() { return useQuery({ queryKey: keys.status(), queryFn: getOpsStatus, staleTime: 15_000, refetchInterval: 30_000 }); }
export function useOpsAttention() { return useQuery({ queryKey: keys.attention(), queryFn: getOpsAttention, staleTime: 15_000, refetchInterval: 30_000 }); }
export function useOpsBriefing() { return useQuery({ queryKey: keys.briefing(), queryFn: getOpsBriefing, staleTime: 30_000 }); }
export function useOpsCommands() { return useQuery({ queryKey: keys.commands(), queryFn: listOpsCommands, staleTime: 15_000 }); }
export function useAckOpsAttention() { const qc = useQueryClient(); return useMutation({ mutationFn: ackOpsAttention, onSuccess: () => invalidate(qc) }); }
export function useSnoozeOpsAttention() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ key, minutes }: { key: string; minutes: number }) => snoozeOpsAttention(key, minutes), onSuccess: () => invalidate(qc) }); }
export function useClearOpsAttention() { const qc = useQueryClient(); return useMutation({ mutationFn: clearOpsAttention, onSuccess: () => invalidate(qc) }); }
export function useMarkOpsBriefingSeen() { const qc = useQueryClient(); return useMutation({ mutationFn: markOpsBriefingSeen, onSuccess: () => invalidate(qc) }); }
export function usePauseOpsFleet() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ reason, minutes }: { reason: string; minutes: number }) => pauseOpsFleet(reason, minutes, crypto.randomUUID()), onSuccess: () => { invalidate(qc); toast({ title: 'Fleet pause applied', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Fleet pause blocked', description: error.message, variant: 'destructive' }) }); }
export function usePauseOpsMember() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ member, lane, reason, minutes }: { member: string; lane: string; reason: string; minutes: number }) => pauseOpsMember(member, lane, reason, minutes, crypto.randomUUID()), onSuccess: () => invalidate(qc) }); }
export function useResumeOpsCommand() { const qc = useQueryClient(); return useMutation({ mutationFn: (sourceCommandID: string) => resumeOpsCommand(sourceCommandID, crypto.randomUUID()), onSuccess: () => { invalidate(qc); toast({ title: 'Fleet resume applied', variant: 'success' }); }, onError: (error: Error) => toast({ title: 'Fleet resume blocked', description: error.message, variant: 'destructive' }) }); }
