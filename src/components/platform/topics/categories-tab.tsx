'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, FolderPlus, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTopicCategories, useUpdateTopicCategory } from '@/hooks/use-topics';
import type { TopicCategory } from '@/types/platform/topics';
import { CategoryDialog } from './category-dialog';
import { CategoryDistributionChart } from './category-distribution-chart';

export function CategoriesTab() {
    const categories = useTopicCategories();
    const update = useUpdateTopicCategory();
    const [editing, setEditing] = useState<TopicCategory | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const rows = categories.data?.data ?? [];
    const counts = categories.data?.topic_counts ?? {};

    const chartData = useMemo(
        () =>
            [...rows]
                .map((c) => ({ name: c.label_en || c.slug, count: counts[c.slug] ?? 0 }))
                .filter((d) => d.count > 0)
                .sort((a, b) => b.count - a.count),
        [rows, counts]
    );

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };
    const openEdit = (c: TopicCategory) => {
        setEditing(c);
        setDialogOpen(true);
    };

    const move = (c: TopicCategory, dir: -1 | 1) =>
        update.mutate({ slug: c.slug, data: { sort_order: c.sort_order + dir } });

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                    <div>
                        <CardTitle className="text-base">Categories</CardTitle>
                        <CardDescription>Parent groups for the topic vocabulary.</CardDescription>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <FolderPlus className="mr-2 h-4 w-4" /> New
                    </Button>
                </CardHeader>
                <CardContent>
                    {categories.isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-11 w-full" />
                            ))}
                        </div>
                    ) : categories.isError ? (
                        <div className="flex items-center gap-2 p-6 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" /> Failed to load categories.
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                            No categories yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Order</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Topics</TableHead>
                                        <TableHead className="text-center">Active</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((c) => (
                                        <TableRow key={c.slug}>
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    <span className="tabular-nums text-sm text-muted-foreground">{c.sort_order}</span>
                                                    <div className="flex flex-col">
                                                        <button
                                                            className="text-muted-foreground hover:text-foreground"
                                                            onClick={() => move(c, -1)}
                                                            aria-label="Move up"
                                                        >
                                                            <ChevronUp className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            className="text-muted-foreground hover:text-foreground"
                                                            onClick={() => move(c, 1)}
                                                            aria-label="Move down"
                                                        >
                                                            <ChevronDown className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{c.label_en}</div>
                                                <div className="text-xs text-muted-foreground" dir="rtl">
                                                    {c.label_ar} · <span dir="ltr" className="font-mono">{c.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary" className="tabular-nums">
                                                    {counts[c.slug] ?? 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={c.active}
                                                    onCheckedChange={(v) => update.mutate({ slug: c.slug, data: { active: v } })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit category">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Topics per category</CardTitle>
                    <CardDescription>Where the approved catalog is concentrated.</CardDescription>
                </CardHeader>
                <CardContent>
                    {categories.isLoading ? (
                        <Skeleton className="h-[220px] w-full" />
                    ) : (
                        <CategoryDistributionChart data={chartData} />
                    )}
                </CardContent>
            </Card>

            <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
        </div>
    );
}
