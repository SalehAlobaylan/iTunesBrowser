'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranscriptionConfig, useUpdateTranscriptionConfig } from '@/hooks/use-transcription';

/**
 * Auto-STT toggle + monthly budget cap, backed by the CMS transcription_config.
 * The budget guard is enforced server-side; this just edits the knobs.
 */
export function SttSettingsCard() {
    const { data: config, isLoading } = useTranscriptionConfig();
    const update = useUpdateTranscriptionConfig();

    const [autoStt, setAutoStt] = useState(false);
    const [budgetCap, setBudgetCap] = useState('0');

    useEffect(() => {
        if (config) {
            setAutoStt(config.auto_stt_enabled);
            setBudgetCap(String(config.monthly_budget_cap_usd ?? 0));
        }
    }, [config]);

    const dirty =
        !!config &&
        (autoStt !== config.auto_stt_enabled ||
            Number(budgetCap) !== config.monthly_budget_cap_usd);

    const save = () => {
        update.mutate({
            auto_stt_enabled: autoStt,
            monthly_budget_cap_usd: Number(budgetCap) || 0,
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle>Speech-to-Text</CardTitle>
                        <CardDescription>
                            When auto-STT is on, auto-generated captions and caption-less media are
                            upgraded automatically (within the budget cap). Off = manual only.
                        </CardDescription>
                    </div>
                    {config && (
                        <Badge variant="secondary" className="shrink-0">
                            Engine: {config.provider}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading || !config ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                ) : (
                    <div className="space-y-4">
                        <label className="flex items-center gap-3">
                            <Checkbox
                                checked={autoStt}
                                onCheckedChange={(v) => setAutoStt(v === true)}
                            />
                            <span className="text-sm">
                                Auto-run STT on auto-captions &amp; caption-less media
                            </span>
                        </label>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="budget-cap">Monthly budget cap (USD)</Label>
                                <Input
                                    id="budget-cap"
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-40"
                                    value={budgetCap}
                                    onChange={(e) => setBudgetCap(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">0 = no cap</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Spent this window</Label>
                                <p className="text-sm font-medium tabular-nums">
                                    ${config.monthly_spend_usd.toFixed(2)}
                                    {config.monthly_budget_cap_usd > 0 && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            / ${config.monthly_budget_cap_usd.toFixed(2)}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Button onClick={save} disabled={!dirty || update.isPending}>
                                {update.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
