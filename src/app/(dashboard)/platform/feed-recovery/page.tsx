'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {useApproveFeedRecoveryPlan,useCancelFeedRecoveryRun,useCreateFeedRecoveryPlan,useExecuteFeedRecoveryRun,useFeedRecoveryPlan,useFeedRecoveryRuns,useRollbackFeedRecoveryRun} from '@/hooks/use-feed-recovery';
import type {FeedRecoveryLane,FeedRecoveryLevel} from '@/types/platform/feed-recovery';

const resumablePhases=['cancel_window','verification_wait','partial','failed','executing','reseeding','purging_news','reseeding_news','purging_media','reseeding_media'];

export default function FeedRecoveryPage(){
 const [lane,setLane]=useState<FeedRecoveryLane>('news');
 const [level,setLevel]=useState<FeedRecoveryLevel>('repair');
 const [noFullRollback,setNoFullRollback]=useState(false);
 const [planID,setPlanID]=useState('');
 const [password,setPassword]=useState('');
 const [phrase,setPhrase]=useState('');
 const create=useCreateFeedRecoveryPlan(); const plan=useFeedRecoveryPlan(planID); const approve=useApproveFeedRecoveryPlan(); const execute=useExecuteFeedRecoveryRun(); const cancel=useCancelFeedRecoveryRun(); const rollback=useRollbackFeedRecoveryRun(); const runs=useFeedRecoveryRuns(); const current=plan.data;
 const expectedPhrase=current?.level==='purge_reseed'?`PURGE ${current.lane.toUpperCase()} ${current.target_count} ITEMS ${current.manifest_hash.slice(0,12).toUpperCase()}${current.no_full_rollback?' NO FULL ROLLBACK':''}`:`APPROVE FEED RECOVERY ${current?.manifest_hash.slice(0,12).toUpperCase()||''}`;
 return <main className="space-y-6 p-4 md:p-8">
  <div><h1 className="text-2xl font-semibold">Feed Recovery</h1><p className="text-sm text-muted-foreground">Repair and Rotate are derived-state workflows. Low-Space Purge &amp; Reseed is admin-only, manifest-bound, checkpoint-preserving, and may show an expected-empty feed while reseeding.</p></div>
  <Card><CardHeader><CardTitle>Preflight</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2">{(['news','media','both'] as FeedRecoveryLane[]).map(x=><Button key={x} variant={lane===x?'default':'outline'} onClick={()=>setLane(x)}>{x}</Button>)}{(['repair','rotate','purge_reseed'] as FeedRecoveryLevel[]).map(x=><Button key={x} variant={level===x?'secondary':'outline'} onClick={()=>setLevel(x)}>{x.replace('_',' ')}</Button>)}</div>{level==='purge_reseed'&&<label className="flex items-center gap-2 text-sm"><Checkbox checked={noFullRollback} onCheckedChange={v=>setNoFullRollback(v===true)}/> I acknowledge that full rollback may be unavailable</label>}<p className="text-xs text-muted-foreground">Purge &amp; Reseed deletes only the frozen content manifest. Sources, schedules, credentials, and checkpoints are preserved. Both lanes execute sequentially.</p><Button disabled={create.isPending} onClick={async()=>{const p=await create.mutateAsync({lane,level,capacity_mode:level==='purge_reseed'?'low_space_reset':'safe_cutover',no_full_rollback:level==='purge_reseed'?noFullRollback:false});setPlanID(p.id)}}>Prepare recovery plan</Button></CardContent></Card>
  {current&&<Card><CardHeader><CardTitle>Plan <Badge>{current.state}</Badge></CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>Sources: {current.source_count} · frozen targets: {current.target_count} · proof {current.source_checksum.slice(0,12)}…</p><p>Manifest: {current.manifest_hash}</p><p>Confirmation: <code>{expectedPhrase}</code></p><Input type="password" placeholder="Admin password for fresh re-auth" value={password} onChange={e=>setPassword(e.target.value)}/><Input placeholder="Confirmation phrase" value={phrase} onChange={e=>setPhrase(e.target.value)}/><Button disabled={approve.isPending||!password||!phrase} onClick={()=>approve.mutate({plan:current,password,phrase})}>Approve</Button></CardContent></Card>}
  <Card><CardHeader><CardTitle>Recovery ledger</CardTitle></CardHeader><CardContent>{runs.data?.data?.length?<ul className="space-y-2">{runs.data.data.map(run=><li key={run.id} className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{run.phase}</Badge><Badge variant="outline">{run.lane}</Badge>{new Date(run.created_at).toLocaleString()}{run.verification_due_at&&<span className="text-xs text-muted-foreground">probe 2 due {new Date(run.verification_due_at).toLocaleString()}</span>}{run.rollback_deadline&&<span className="text-xs text-muted-foreground">rollback until {new Date(run.rollback_deadline).toLocaleString()}</span>}{run.error&&<span className="text-xs text-destructive">{run.error}</span>}{resumablePhases.includes(run.phase)&&<Button size="sm" onClick={()=>execute.mutate(run.id)} disabled={execute.isPending}>Continue</Button>}{['cancel_window','verification_wait'].includes(run.phase)&&<Button size="sm" variant="outline" onClick={()=>cancel.mutate(run.id)} disabled={cancel.isPending}>Cancel</Button>}{run.outcome==='succeeded'&&run.rollback_deadline&&new Date(run.rollback_deadline)>new Date()&&<Button size="sm" variant="outline" onClick={()=>rollback.mutate(run.id)} disabled={rollback.isPending}>Rollback</Button>}</li>)}</ul>:<p className="text-sm text-muted-foreground">No recovery runs recorded.</p>}</CardContent></Card>
 </main>
}
