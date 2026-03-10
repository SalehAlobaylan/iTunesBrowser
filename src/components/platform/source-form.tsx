'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentSource, SourceType } from '@/types/platform/source';
import { SOURCE_TYPE_LABELS } from '@/types/platform/source';

const sourceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['RSS', 'PODCAST', 'YOUTUBE', 'TWITTER', 'REDDIT', 'TELEGRAM', 'MANUAL'] as const),
    feed_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    fetch_interval_minutes: z.coerce.number().min(1, 'Minimum 1 minute'),
    is_active: z.boolean(),
    telegram_channel_username: z.string().optional(),
    telegram_min_duration_sec: z.coerce.number().min(1, 'Minimum 1 second').optional(),
    telegram_max_duration_sec: z.coerce.number().min(1, 'Minimum 1 second').optional(),
    telegram_media_audio: z.boolean().default(true),
    telegram_media_voice: z.boolean().default(true),
    telegram_media_video: z.boolean().default(false),
    telegram_media_photo: z.boolean().default(false),
    telegram_media_text: z.boolean().default(false),
    telegram_max_results: z.coerce.number().min(1, 'Minimum 1').max(200, 'Maximum 200').optional(),
    telegram_max_age_hours: z.coerce.number().min(1, 'Minimum 1 hour').optional(),
    telegram_min_text_length: z.coerce.number().min(1, 'Minimum 1').max(2000, 'Maximum 2000').optional(),
});

type SourceFormData = z.infer<typeof sourceSchema>;
type SourceFormSubmitData = {
    name: SourceFormData['name'];
    type: SourceFormData['type'];
    feed_url?: string;
    fetch_interval_minutes: SourceFormData['fetch_interval_minutes'];
    is_active: SourceFormData['is_active'];
    api_config?: Record<string, unknown>;
};

interface SourceFormProps {
    source?: ContentSource;
    onSubmit: (data: SourceFormSubmitData) => void;
    isLoading?: boolean;
}

export function SourceForm({ source, onSubmit, isLoading }: SourceFormProps) {
    const sourceApiConfig = source?.api_config as Record<string, unknown> | undefined;
    const sourceMediaTypes = Array.isArray(sourceApiConfig?.['media_types'])
        ? sourceApiConfig?.['media_types'].filter(
            (value): value is string => typeof value === 'string'
        )
        : [];

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
            telegram_channel_username: typeof sourceApiConfig?.['channel_username'] === 'string'
                ? sourceApiConfig['channel_username']
                : '',
            telegram_min_duration_sec: typeof sourceApiConfig?.['min_duration_sec'] === 'number'
                ? sourceApiConfig['min_duration_sec']
                : 120,
            telegram_max_duration_sec: typeof sourceApiConfig?.['max_duration_sec'] === 'number'
                ? sourceApiConfig['max_duration_sec']
                : undefined,
            telegram_media_audio: sourceMediaTypes.length === 0 || sourceMediaTypes.includes('audio'),
            telegram_media_voice: sourceMediaTypes.length === 0 || sourceMediaTypes.includes('voice'),
            telegram_media_video: sourceMediaTypes.includes('video'),
            telegram_media_photo: sourceMediaTypes.includes('photo'),
            telegram_media_text: sourceMediaTypes.includes('text'),
            telegram_max_results: typeof sourceApiConfig?.['max_results'] === 'number'
                ? sourceApiConfig['max_results']
                : undefined,
            telegram_max_age_hours: typeof sourceApiConfig?.['max_age_hours'] === 'number'
                ? sourceApiConfig['max_age_hours']
                : undefined,
            telegram_min_text_length: typeof sourceApiConfig?.['min_text_length'] === 'number'
                ? sourceApiConfig['min_text_length']
                : undefined,
        },
    });

    const selectedType = watch('type');
    const isActive = watch('is_active');
    const telegramMediaAudio = watch('telegram_media_audio');
    const telegramMediaVoice = watch('telegram_media_voice');
    const telegramMediaVideo = watch('telegram_media_video');
    const telegramMediaPhoto = watch('telegram_media_photo');
    const telegramMediaText = watch('telegram_media_text');

    // Duration fields are only relevant when fetching timed media (audio / voice / video)
    const showDurationFields = telegramMediaAudio || telegramMediaVoice || telegramMediaVideo;
    // Text limit fields only relevant when text posts are enabled
    const showTextLimits = telegramMediaText;

    const showFeedUrl = ['RSS', 'PODCAST', 'YOUTUBE', 'TELEGRAM'].includes(selectedType);
    const showTelegramConfig = selectedType === 'TELEGRAM';

    const submitForm = (data: SourceFormData) => {
        const payload: SourceFormSubmitData = {
            name: data.name,
            type: data.type,
            fetch_interval_minutes: data.fetch_interval_minutes,
            is_active: data.is_active,
            feed_url: data.feed_url || undefined,
        };

        if (data.type === 'TELEGRAM') {
            const mediaTypes = [
                data.telegram_media_audio ? 'audio' : null,
                data.telegram_media_voice ? 'voice' : null,
                data.telegram_media_video ? 'video' : null,
                data.telegram_media_photo ? 'photo' : null,
                data.telegram_media_text ? 'text' : null,
            ].filter((value): value is 'audio' | 'voice' | 'video' | 'photo' | 'text' => value !== null);

            const hasDurationMedia = data.telegram_media_audio || data.telegram_media_voice || data.telegram_media_video;

            payload.api_config = {
                channel_username: data.telegram_channel_username?.trim() || undefined,
                ...(hasDurationMedia ? {
                    min_duration_sec: data.telegram_min_duration_sec || 120,
                    max_duration_sec: data.telegram_max_duration_sec || undefined,
                } : {}),
                media_types: mediaTypes.length > 0 ? mediaTypes : ['audio', 'voice'],
                ...(data.telegram_max_results ? { max_results: data.telegram_max_results } : {}),
                ...(data.telegram_max_age_hours ? { max_age_hours: data.telegram_max_age_hours } : {}),
                ...(data.telegram_min_text_length ? { min_text_length: data.telegram_min_text_length } : {}),
            };
        } else {
            payload.api_config = source?.api_config;
        }

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
                            <Label htmlFor="feed_url">
                                {selectedType === 'TELEGRAM' ? 'Channel URL' : 'Feed URL'}
                            </Label>
                            <Input
                                id="feed_url"
                                type="url"
                                placeholder={
                                    selectedType === 'TELEGRAM'
                                        ? 'https://t.me/channel_name'
                                        : 'https://example.com/feed.xml'
                                }
                                {...register('feed_url')}
                                disabled={isLoading}
                            />
                            {errors.feed_url && (
                                <p className="text-sm text-destructive">{errors.feed_url.message}</p>
                            )}
                        </div>
                    )}

                    {showTelegramConfig && (
                        <div className="grid gap-4 md:grid-cols-2" data-testid="telegram-config">
                            <div className="space-y-2">
                                <Label htmlFor="telegram_channel_username">Channel Username (optional)</Label>
                                <Input
                                    id="telegram_channel_username"
                                    placeholder="@channel_name"
                                    {...register('telegram_channel_username')}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to derive from Channel URL.
                                </p>
                            </div>
                            {showDurationFields && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="telegram_min_duration_sec">Minimum Audio Duration (seconds)</Label>
                                        <Input
                                            id="telegram_min_duration_sec"
                                            type="number"
                                            min={1}
                                            {...register('telegram_min_duration_sec')}
                                            disabled={isLoading}
                                        />
                                        {errors.telegram_min_duration_sec && (
                                            <p className="text-sm text-destructive">
                                                {errors.telegram_min_duration_sec.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telegram_max_duration_sec">Maximum Duration (seconds, optional)</Label>
                                        <Input
                                            id="telegram_max_duration_sec"
                                            type="number"
                                            min={1}
                                            {...register('telegram_max_duration_sec')}
                                            disabled={isLoading}
                                        />
                                        {errors.telegram_max_duration_sec && (
                                            <p className="text-sm text-destructive">
                                                {errors.telegram_max_duration_sec.message}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label>Content Types to Fetch</Label>
                                <p className="text-xs text-muted-foreground">
                                    Audio / Voice / Video → <strong>For You</strong> feed &nbsp;·&nbsp; Text Posts / Photos → <strong>News</strong> feed
                                </p>
                                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={telegramMediaAudio}
                                            onCheckedChange={(checked) => setValue('telegram_media_audio', Boolean(checked))}
                                            disabled={isLoading}
                                        />
                                        Audio Files
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={telegramMediaVoice}
                                            onCheckedChange={(checked) => setValue('telegram_media_voice', Boolean(checked))}
                                            disabled={isLoading}
                                        />
                                        Voice Notes
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={telegramMediaVideo}
                                            onCheckedChange={(checked) => setValue('telegram_media_video', Boolean(checked))}
                                            disabled={isLoading}
                                        />
                                        Videos
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={telegramMediaPhoto}
                                            onCheckedChange={(checked) => setValue('telegram_media_photo', Boolean(checked))}
                                            disabled={isLoading}
                                        />
                                        Photos
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={telegramMediaText}
                                            onCheckedChange={(checked) => setValue('telegram_media_text', Boolean(checked))}
                                            disabled={isLoading}
                                        />
                                        <span>
                                            Text Posts{' '}
                                            <span className="text-muted-foreground">(News)</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {showTelegramConfig && (
                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Fetch Limits
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                {/* Max Posts per Fetch — applies to all content types */}
                                <div className="space-y-2">
                                    <Label htmlFor="telegram_max_results">Max Posts per Fetch</Label>
                                    <Input
                                        id="telegram_max_results"
                                        type="number"
                                        min={1}
                                        max={200}
                                        placeholder="50"
                                        {...register('telegram_max_results')}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max messages scanned per fetch cycle (1–200). Default: 50.
                                    </p>
                                    {errors.telegram_max_results && (
                                        <p className="text-sm text-destructive">{errors.telegram_max_results.message}</p>
                                    )}
                                </div>

                                {/* Max Post Age — useful for news channels to avoid pulling history */}
                                <div className="space-y-2">
                                    <Label htmlFor="telegram_max_age_hours">
                                        Max Post Age (hours)
                                    </Label>
                                    <Input
                                        id="telegram_max_age_hours"
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 24"
                                        {...register('telegram_max_age_hours')}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Skip posts older than this. Leave empty for no limit.
                                        Recommended for high-volume news channels (e.g. 24 or 48).
                                    </p>
                                    {errors.telegram_max_age_hours && (
                                        <p className="text-sm text-destructive">{errors.telegram_max_age_hours.message}</p>
                                    )}
                                </div>

                                {/* Min Text Length — only relevant for text posts */}
                                {showTextLimits && (
                                    <div className="space-y-2">
                                        <Label htmlFor="telegram_min_text_length">
                                            Min Text Length (characters)
                                        </Label>
                                        <Input
                                            id="telegram_min_text_length"
                                            type="number"
                                            min={1}
                                            max={2000}
                                            placeholder="20"
                                            {...register('telegram_min_text_length')}
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Discard text posts shorter than this (e.g. reactions,
                                            emoji-only). Default: 20.
                                        </p>
                                        {errors.telegram_min_text_length && (
                                            <p className="text-sm text-destructive">{errors.telegram_min_text_length.message}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
