'use client';

import { useRouter } from 'next/navigation';
import {
    MoreHorizontal,
    ExternalLink,
    Sparkles,
    Trash2,
    Copy,
    PanelRight,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { useUpdateContentStatus } from '@/hooks/use-content';
import { triggerEnrichment } from '@/lib/api/cms/enrichment';
import {
    CONTENT_STATUS_LABELS,
} from '@/types/platform/content';
import type { ContentItem, ContentStatus } from '@/types/platform/content';

const STATUS_OPTIONS: ContentStatus[] = [
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED',
    'ARCHIVED',
];

interface ContentRowActionsProps {
    item: ContentItem;
    onDelete: (id: string) => void;
}

export function ContentRowActions({ item, onDelete }: ContentRowActionsProps) {
    const router = useRouter();
    const updateStatus = useUpdateContentStatus();

    const isUpdating =
        updateStatus.isPending && updateStatus.variables?.id === item.id;

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(item.id);
            toast({ title: 'ID copied', description: item.id, variant: 'success' });
        } catch {
            toast({
                title: 'Copy failed',
                description: 'Clipboard access denied.',
                variant: 'destructive',
            });
        }
    };

    const reEnrich = async () => {
        try {
            await triggerEnrichment(item.id, ['transcript', 'embedding', 'news']);
            toast({
                title: 'Enrichment triggered',
                description: item.title,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Enrichment failed',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Row actions">
                    {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push(`/platform/content/${item.id}`)}>
                    <PanelRight className="mr-2 h-4 w-4" /> Open detail
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => item.original_url && window.open(item.original_url, '_blank')}
                    disabled={!item.original_url}
                >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open original
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyId}>
                    <Copy className="mr-2 h-4 w-4" /> Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <DropdownMenuLabel className="flex items-center px-0 py-0 font-normal">
                            Set status
                        </DropdownMenuLabel>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuItem
                                key={s}
                                disabled={s === item.status}
                                onClick={() =>
                                    updateStatus.mutate({ id: item.id, status: s })
                                }
                            >
                                {CONTENT_STATUS_LABELS[s]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={reEnrich}>
                    <Sparkles className="mr-2 h-4 w-4" /> Re-enrich
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
