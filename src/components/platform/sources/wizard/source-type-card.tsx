'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface SourceTypeCardProps {
    icon: LucideIcon;
    label: string;
    description: string;
    feedHint?: 'For You' | 'News' | 'Both';
    selected: boolean;
    disabled?: boolean;
    onSelect: () => void;
}

export function SourceTypeCard({
    icon: Icon,
    label,
    description,
    feedHint,
    selected,
    disabled,
    onSelect,
}: SourceTypeCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                'group relative flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition-all',
                'hover:border-primary hover:shadow-sm',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'border-primary bg-primary/5 ring-1 ring-primary',
                disabled && 'cursor-not-allowed opacity-60'
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5" />
                </div>
                {feedHint && (
                    <Badge variant="secondary" className="text-xs">
                        {feedHint}
                    </Badge>
                )}
            </div>
            <div className="space-y-1">
                <div className="font-semibold leading-none">{label}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </button>
    );
}
