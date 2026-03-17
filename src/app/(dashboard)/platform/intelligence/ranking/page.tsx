'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    WeightSliders,
    WeightRadarChart,
    AlgorithmFlow,
    WEIGHT_KEYS,
} from '@/components/platform/intelligence';
import { useRankingConfig, useUpdateRankingConfig } from '@/hooks/use-intelligence';
import type { RankingConfig } from '@/types/platform/intelligence';

export default function RankingConfigPage() {
    const { data: config, isLoading } = useRankingConfig();
    const updateConfig = useUpdateRankingConfig();
    const [form, setForm] = useState<Partial<RankingConfig>>({});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (config) {
            setForm(config);
            setHasChanges(false);
        }
    }, [config]);

    const updateField = <K extends keyof RankingConfig>(key: K, value: RankingConfig[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const updateWeights = (weights: Record<string, number>) => {
        setForm((prev) => ({ ...prev, ...weights }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateConfig.mutate(form as RankingConfig, {
            onSuccess: () => {
                toast({ title: 'Saved', description: 'Ranking configuration updated' });
                setHasChanges(false);
            },
            onError: (err) => {
                toast({
                    title: 'Save failed',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            },
        });
    };

    const weights: Record<string, number> = {};
    for (const k of WEIGHT_KEYS) {
        weights[k] = (form as Record<string, number>)[k] ?? 0;
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-[500px]" />
                    <Skeleton className="h-[500px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/platform/intelligence">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ranking Configuration</h1>
                        <p className="text-muted-foreground">
                            Tune the 7-signal ranking algorithm weights and parameters
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={!hasChanges || updateConfig.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateConfig.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Algorithm Flow Diagram */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Algorithm Pipeline</CardTitle>
                    <CardDescription>How the 7 signals flow through the ranking engine</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlgorithmFlow />
                </CardContent>
            </Card>

            {/* Main Config Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Weight Sliders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Signal Weights</CardTitle>
                        <CardDescription>
                            Adjust each signal's influence. Weights auto-normalize to sum = 1.0
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WeightSliders
                            weights={weights}
                            onChange={updateWeights}
                            disabled={updateConfig.isPending}
                        />
                    </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Weight Distribution</CardTitle>
                        <CardDescription>Visual representation of current weight balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WeightRadarChart weights={weights} />
                    </CardContent>
                </Card>
            </div>

            {/* Parameters Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Freshness Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Freshness Decay</CardTitle>
                        <CardDescription>Exponential decay half-life in hours</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Decay Hours</Label>
                            <Input
                                type="number"
                                min={1}
                                max={720}
                                value={form.freshness_decay_hours ?? 72}
                                onChange={(e) => updateField('freshness_decay_hours', parseInt(e.target.value) || 72)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Content loses ~50% freshness score after this many hours
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Velocity Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Velocity Window</CardTitle>
                        <CardDescription>Recent interaction rate measurement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Window Hours</Label>
                            <Input
                                type="number"
                                min={1}
                                max={168}
                                value={form.velocity_window_hours ?? 6}
                                onChange={(e) => updateField('velocity_window_hours', parseInt(e.target.value) || 6)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Time window for counting recent interactions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Trending Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Trending Detection</CardTitle>
                        <CardDescription>Spike detection threshold</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Threshold Multiplier</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                step={0.1}
                                value={form.trending_threshold_multiplier ?? 2.0}
                                onChange={(e) =>
                                    updateField('trending_threshold_multiplier', parseFloat(e.target.value) || 2.0)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Rate must exceed avg × this multiplier to be trending
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Settings */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Engagement Normalization */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Engagement Settings</CardTitle>
                        <CardDescription>How engagement metrics are normalized</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Normalization Method</Label>
                            <Select
                                value={form.engagement_normalization ?? 'log'}
                                onValueChange={(v) => updateField('engagement_normalization', v as 'log' | 'linear')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="log">Logarithmic</SelectItem>
                                    <SelectItem value="linear">Linear</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Log is recommended to prevent viral content from dominating
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recirculation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recirculation</CardTitle>
                        <CardDescription>Allow older high-performing content to resurface</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="recirculation"
                                checked={form.recirculation_enabled ?? false}
                                onCheckedChange={(checked) =>
                                    updateField('recirculation_enabled', checked as boolean)
                                }
                            />
                            <Label htmlFor="recirculation">Enable recirculation</Label>
                        </div>
                        {form.recirculation_enabled && (
                            <div className="space-y-1.5">
                                <Label>Max Age (days)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={form.recirculation_max_age_days ?? 30}
                                    onChange={(e) =>
                                        updateField('recirculation_max_age_days', parseInt(e.target.value) || 30)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Only recirculate content newer than this many days
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Toggle */}
            <Card className={form.is_active ? 'border-green-500/50' : 'border-muted'}>
                <CardContent className="flex items-center justify-between py-6">
                    <div>
                        <h3 className="font-semibold">
                            {form.is_active ? 'Ranking Algorithm is Active' : 'Ranking Algorithm is Inactive'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {form.is_active
                                ? 'Feeds use the 7-signal ranking engine. Toggle off to revert to chronological.'
                                : 'Feeds are currently chronological. Toggle on to enable ranked feeds.'}
                        </p>
                    </div>
                    <Button
                        variant={form.is_active ? 'destructive' : 'default'}
                        onClick={() => updateField('is_active', !form.is_active)}
                    >
                        {form.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
