'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTopicCatalog, useTopicCategories } from '@/hooks/use-topics';
import type { CatalogFilters, CatalogTopic } from '@/types/platform/topics';
import { CatalogTable } from './catalog-table';
import { CreateTopicDialog } from './create-topic-dialog';
import { TopicEditSheet } from './topic-edit-sheet';

const ALL = '__all__';
type StateFilter = 'all' | 'active' | 'inactive';
type FeatureFilter = 'all' | 'featured';

export function CatalogTab() {
    const categories = useTopicCategories();
    const [rawQuery, setRawQuery] = useState('');
    const [category, setCategory] = useState<string>(ALL);
    const [state, setState] = useState<StateFilter>('all');
    const [feature, setFeature] = useState<FeatureFilter>('all');
    const [selected, setSelected] = useState<CatalogTopic | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const query = useDebouncedValue(rawQuery, 300);

    const filters = useMemo<CatalogFilters>(() => {
        const f: CatalogFilters = {};
        if (query.trim()) f.q = query.trim();
        if (category !== ALL) f.category = category;
        if (state === 'active') f.active = true;
        if (state === 'inactive') f.active = false;
        if (feature === 'featured') f.featured = true;
        return f;
    }, [query, category, state, feature]);

    const catalog = useTopicCatalog(filters);
    const topics = catalog.data?.data ?? [];

    const openTopic = (t: CatalogTopic) => {
        setSelected(t);
        setSheetOpen(true);
    };

    return (
        <Card>
            <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">Approved catalog</CardTitle>
                    <CreateTopicDialog
                        trigger={
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" /> New topic
                            </Button>
                        }
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8"
                            placeholder="Search slug or label…"
                            value={rawQuery}
                            onChange={(e) => setRawQuery(e.target.value)}
                        />
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {(categories.data?.data ?? []).map((c) => (
                                <SelectItem key={c.slug} value={c.slug}>
                                    {c.label_en}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={state} onValueChange={(v) => setState(v as StateFilter)}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All states</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={feature} onValueChange={(v) => setFeature(v as FeatureFilter)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All topics</SelectItem>
                            <SelectItem value="featured">Featured only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {catalog.isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : catalog.isError ? (
                    <div className="flex items-center gap-2 p-8 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Failed to load the catalog.
                    </div>
                ) : topics.length === 0 ? (
                    <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No topics match these filters.
                    </div>
                ) : (
                    <CatalogTable topics={topics} onSelect={openTopic} />
                )}
            </CardContent>

            <TopicEditSheet topic={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
        </Card>
    );
}
