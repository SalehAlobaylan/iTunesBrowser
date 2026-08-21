'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { databaseMigrationAPI, type MigrationAction, type MigrationProgram, type MigrationStatus } from '@/lib/api/database-migrations';

type ViewState={status:MigrationStatus|null;actions:MigrationAction[];programs:MigrationProgram[];error:string;loading:boolean};

export default function DatabaseMigrationsPage(){
  const [view,setView]=useState<ViewState>({status:null,actions:[],programs:[],error:'',loading:true});
  useEffect(()=>{let active=true;Promise.all([databaseMigrationAPI.status(),databaseMigrationAPI.actions(),databaseMigrationAPI.programs()]).then(([status,actions,programs])=>{if(active)setView({status,actions:actions.items,programs:programs.items,error:'',loading:false})}).catch(reason=>{if(active)setView(previous=>({...previous,error:reason instanceof Error?reason.message:'Unable to load migration controls',loading:false}))});return()=>{active=false}},[]);
  const unknowns=view.actions.filter(action=>action.class!=='read_only'&&!action.enabled).length;
  return <div className="space-y-6" data-testid="database-migration-cockpit">
    <div><h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight"><Database className="h-7 w-7"/>Database Migration Control</h1><p className="text-muted-foreground">Independent evidence, immutable history, and release-gated actions. Infrastructure arguments and credentials are never accepted here.</p></div>
    {view.error?<Card className="border-destructive/40"><CardContent className="flex gap-2 p-4 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0"/>{view.error}</CardContent></Card>:null}
    <div className="grid gap-4 md:grid-cols-3"><Summary title="Control store" value={view.loading?'Loading':view.status?.control_store_ready?'Ready':'Unavailable'} healthy={view.status?.control_store_ready===true}/><Summary title="Execution posture" value={view.status?.execution_enabled?'Enabled':'Observe only'} healthy={!view.status?.execution_enabled}/><Summary title="Release-gated actions" value={String(unknowns)} healthy={unknowns>0}/></div>
    <Card><CardHeader><CardTitle>Programs</CardTitle></CardHeader><CardContent>{view.programs.length===0?<p className="text-sm text-muted-foreground">No recorded migration program. Analysis must use registered aliases and writes only to the independent control store.</p>:<div className="space-y-3">{view.programs.map(program=><div key={program.id} className="grid gap-1 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto]"><div><p className="font-medium">{program.source_alias} → {program.target_alias}</p><p className="text-muted-foreground">{program.environment} · {program.id}</p><p className="mt-1 text-xs text-muted-foreground">{program.units.length} physical unit{program.units.length===1?'':'s'} · epochs {program.units.map(unit=>`${unit.source_epoch}→${unit.target_epoch}`).join(', ')||'unknown'}</p></div><div className="font-mono text-xs">{program.state}</div></div>)}</div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Action registry</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{view.actions.map(action=><div key={action.key} className="rounded-md border p-3 text-sm"><div className="flex items-start justify-between gap-3"><p className="font-mono text-xs font-semibold">{action.key}</p>{action.enabled?<CheckCircle2 className="h-4 w-4 text-emerald-500"/>:<LockKeyhole className="h-4 w-4 text-muted-foreground"/>}</div><p className="mt-2 text-muted-foreground">{action.class} · {action.execution_owner}</p><p className="text-muted-foreground">Verifier: {action.verification_owner}</p></div>)}</CardContent></Card>
  </div>;
}

function Summary({title,value,healthy}:{title:string;value:string;healthy:boolean}){return <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className={healthy?'text-xl font-semibold text-emerald-600':'text-xl font-semibold'}>{value}</p></CardContent></Card>}
