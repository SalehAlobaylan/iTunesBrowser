'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useDiscoverSourceFeeds, usePreviewSource } from '@/hooks/use-sources';
import type { CreateSourceRequest, UpdateSourceRequest, ContentSource, SourceType } from '@/types/platform/source';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';

const sourceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['RSS', 'PODCAST', 'YOUTUBE', 'TWITTER', 'REDDIT', 'MANUAL'] as const),
    feed_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    fetch_interval_minutes: z.coerce.number().min(1, 'Minimum 1 minute'),
    is_active: z.boolean(),
    include_keywords: z.string().optional(),
    exclude_keywords: z.string().optional(),
    min_engagement: z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? undefined : value),
        z.coerce.number().min(0, 'Must be zero or positive').optional()
    ),
});

type SourceFormData = z.infer<typeof sourceSchema>;

interface SourceFormProps {
    source?: ContentSource;
    onSubmit: (data: CreateSourceRequest | UpdateSourceRequest) => void;
    isLoading?: boolean;
}

export function SourceForm({ source, onSubmit, isLoading }: SourceFormProps) {
    const discoverMutation = useDiscoverSourceFeeds();
    const previewMutation = usePreviewSource();
    const [discoverUrl, setDiscoverUrl] = useState('');
    const [discoveredFeeds, setDiscoveredFeeds] = useState<Array<{ url: string; title?: string; type: string }>>([]);

    const currentFilters = useMemo(() => {
        const raw = source?.api_config?.filters as Record<string, unknown> | undefined;
        return {
            includeKeywords: Array.isArray(raw?.include_keywords) ? raw?.include_keywords.join(', ') : '',
            excludeKeywords: Array.isArray(raw?.exclude_keywords) ? raw?.exclude_keywords.join(', ') : '',
            minEngagement: typeof raw?.min_engagement === 'number' ? raw.min_engagement : undefined,
        };
    }, [source?.api_config]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SourceFormData>({
        resolver: zodResolver(sourceSchema),
        defaultValues: {
            name: source?.name || '',
            type: source?.type || 'RSS',
            feed_url: source?.feed_url || '',
            fetch_interval_minutes: source?.fetch_interval_minutes || 60,
            is_active: source?.is_active ?? true,
            include_keywords: currentFilters.includeKeywords,
            exclude_keywords: currentFilters.excludeKeywords,
            min_engagement: currentFilters.minEngagement,
        },
    });

    const selectedType = watch('type');
    const isActive = watch('is_active');
    const feedUrl = watch('feed_url');
    const sourceName = watch('name');
    const includeKeywordsInput = watch('include_keywords');
    const excludeKeywordsInput = watch('exclude_keywords');
    const minEngagementValue = watch('min_engagement');

    const showFeedUrl = ['RSS', 'PODCAST', 'YOUTUBE'].includes(selectedType);
    const showFilters = ['RSS', 'TWITTER', 'REDDIT', 'YOUTUBE', 'PODCAST'].includes(selectedType);

    const parseKeywordList = (input?: string): string[] =>
        (input || '')
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

    const handleDiscover = () => {
        if (!discoverUrl.trim()) {
            toast({
                title: 'URL required',
                description: 'Enter a website URL to discover available feeds.',
                variant: 'destructive',
            });
            return;
        }

        discoverMutation.mutate(
            { url: discoverUrl.trim() },
            {
                onSuccess: (response) => {
                    setDiscoveredFeeds(response.feeds || []);
                    toast({
                        title: 'Discovery complete',
                        description: response.message || 'Feed candidates loaded.',
                        variant: 'success',
                    });
                },
                onError: (error: Error) => {
                    toast({
                        title: 'Discovery failed',
                        description: error.message,
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    const handlePreview = () => {
        if (!feedUrl || !feedUrl.trim()) {
            toast({
                title: 'Feed URL required',
                description: 'Set a source URL before running preview.',
                variant: 'destructive',
            });
            return;
        }

        const includeKeywords = parseKeywordList(includeKeywordsInput);
        const excludeKeywords = parseKeywordList(excludeKeywordsInput);
        const hasFilters = includeKeywords.length > 0 || excludeKeywords.length > 0 || typeof minEngagementValue === 'number';

        previewMutation.mutate(
            {
                sourceType: selectedType,
                url: feedUrl.trim(),
                name: sourceName || undefined,
                limit: 10,
                settings: hasFilters
                    ? {
                        filters: {
                            include_keywords: includeKeywords,
                            exclude_keywords: excludeKeywords,
                            min_engagement: typeof minEngagementValue === 'number' ? minEngagementValue : undefined,
                        },
                    }
                    : {},
            },
            {
                onError: (error: Error) => {
                    toast({
                        title: 'Preview failed',
                        description: error.message,
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    const submitForm = (data: SourceFormData) => {
        const includeKeywords = parseKeywordList(data.include_keywords);
        const excludeKeywords = parseKeywordList(data.exclude_keywords);
        const hasFilters = includeKeywords.length > 0 || excludeKeywords.length > 0 || typeof data.min_engagement === 'number';

        const payload: CreateSourceRequest | UpdateSourceRequest = {
            name: data.name.trim(),
            type: data.type,
            feed_url: data.feed_url?.trim() || undefined,
            fetch_interval_minutes: data.fetch_interval_minutes,
            is_active: data.is_active,
            api_config: hasFilters
                ? {
                    ...(source?.api_config || {}),
                    filters: {
                        include_keywords: includeKeywords,
                        exclude_keywords: excludeKeywords,
                        min_engagement: typeof data.min_engagement === 'number' ? data.min_engagement : undefined,
                    },
                }
                : (source?.api_config || undefined),
        };

        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Source Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="My RSS Feed"
                                {...register('name')}
                                disabled={isLoading}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) => setValue('type', value as SourceType)}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-destructive">{errors.type.message}</p>
                            )}
                        </div>
                    </div>

                    {showFeedUrl && (
                        <div className="space-y-2">
                            <Label htmlFor="feed_url">Feed URL</Label>
                            <Input
                                id="feed_url"
                                type="url"
                                placeholder="https://example.com/feed.xml"
                                {...register('feed_url')}
                                disabled={isLoading}
                            />
                            {errors.feed_url && (
                                <p className="text-sm text-destructive">{errors.feed_url.message}</p>
                            )}
                        </div>
                    )}

                    {showFilters && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="include_keywords">Include Keywords (comma-separated)</Label>
                                <Input
                                    id="include_keywords"
                                    placeholder="ai, technology, startup"
                                    {...register('include_keywords')}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="exclude_keywords">Exclude Keywords (comma-separated)</Label>
                                <Input
                                    id="exclude_keywords"
                                    placeholder="sponsored, giveaway"
                                    {...register('exclude_keywords')}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="min_engagement">Minimum Engagement (optional)</Label>
                                <Input
                                    id="min_engagement"
                                    type="number"
                                    min={0}
                                    {...register('min_engagement')}
                                    disabled={isLoading}
                                />
                                {errors.min_engagement && (
                                    <p className="text-sm text-destructive">{errors.min_engagement.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fetch_interval_minutes">Fetch Interval (minutes)</Label>
                            <Input
                                id="fetch_interval_minutes"
                                type="number"
                                min={1}
                                {...register('fetch_interval_minutes')}
                                disabled={isLoading}
                            />
                            {errors.fetch_interval_minutes && (
                                <p className="text-sm text-destructive">
                                    {errors.fetch_interval_minutes.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    type="button"
                                    variant={isActive ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setValue('is_active', true)}
                                    disabled={isLoading}
                                >
                                    Active
                                </Button>
                                <Button
                                    type="button"
                                    variant={!isActive ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => setValue('is_active', false)}
                                    disabled={isLoading}
                                >
                                    Disabled
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Discovery and Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="discover_url">Discover Feed URL from Website</Label>
                        <div className="flex gap-2">
                            <Input
                                id="discover_url"
                                type="url"
                                placeholder="https://example.com"
                                value={discoverUrl}
                                onChange={(event) => setDiscoverUrl(event.target.value)}
                                disabled={isLoading || discoverMutation.isPending}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDiscover}
                                disabled={isLoading || discoverMutation.isPending}
                            >
                                {discoverMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {discoveredFeeds.length > 0 && (
                        <div className="space-y-2">
                            <Label>Discovered Feeds</Label>
                            <div className="space-y-2">
                                {discoveredFeeds.map((feed) => (
                                    <button
                                        key={feed.url}
                                        type="button"
                                        className="w-full rounded-md border p-3 text-left text-sm hover:bg-muted"
                                        onClick={() => setValue('feed_url', feed.url, { shouldValidate: true })}
                                    >
                                        <p className="font-medium">{feed.title || feed.url}</p>
                                        <p className="text-muted-foreground">{feed.url}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="text-sm font-medium">Preview source output</p>
                            <p className="text-xs text-muted-foreground">
                                Runs fetch + normalize only. No content is written.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePreview}
                            disabled={isLoading || previewMutation.isPending}
                        >
                            {previewMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Previewing...
                                </>
                            ) : (
                                'Preview'
                            )}
                        </Button>
                    </div>

                    {previewMutation.data && (
                        <div className="space-y-2 rounded-md border p-3">
                            <p className="text-sm font-medium">
                                Preview Results ({previewMutation.data.normalized}/{previewMutation.data.fetched})
                            </p>
                            {previewMutation.data.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No preview items available.</p>
                            ) : (
                                <div className="space-y-2">
                                    {previewMutation.data.items.slice(0, 5).map((item) => (
                                        <div key={item.idempotencyKey} className="rounded-md bg-muted p-2">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            {item.excerpt && (
                                                <p className="text-xs text-muted-foreground">
                                                    {item.excerpt}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : source ? (
                        'Update Source'
                    ) : (
                        'Create Source'
                    )}
                </Button>
            </div>
        </form>
    );
}
