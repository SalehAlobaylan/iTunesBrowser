'use client';

import { Clock, TrendingUp, UserCheck, Sparkles, Scale, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ModeDefinition } from '@/types/platform/intelligence';

const ICON_MAP: Record<string, LucideIcon> = {
    clock: Clock,
    'trending-up': TrendingUp,
    'user-check': UserCheck,
    sparkles: Sparkles,
    scale: Scale,
};

interface ModeCardProps {
    mode: ModeDefinition;
    isActive: boolean;
    isLoading?: boolean;
    onClick: () => void;
}

export function ModeCard({ mode, isActive, isLoading, onClick }: ModeCardProps) {
    const Icon = ICON_MAP[mode.icon] || Scale;

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
                isActive
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
            } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{mode.name}</CardTitle>
                        {isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm">{mode.description}</CardDescription>
            </CardContent>
        </Card>
    );
}
