'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConnectGenericProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    helper?: string;
}

export function ConnectGeneric({
    value,
    onChange,
    label = 'Feed URL',
    placeholder = 'https://example.com/feed',
    helper,
}: ConnectGenericProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="generic_url">{label}</Label>
            <Input
                id="generic_url"
                type="url"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        </div>
    );
}

export function ConnectManual() {
    return (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Manual source</p>
            <p className="mt-1 text-muted-foreground">
                No URL needed. Items will be added by hand from the console.
                Choose a name in the next step.
            </p>
        </div>
    );
}
