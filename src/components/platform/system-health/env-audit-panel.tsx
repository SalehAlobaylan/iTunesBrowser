'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { EnvAuditEntry } from '@/types/platform/system-health';

export function EnvAuditPanel({ envAudit }: { envAudit: EnvAuditEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Environment Audit</CardTitle>
                <CardDescription>
                    Server-side base URLs the Console needs to reach each service.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="divide-y rounded-md border">
                    {envAudit.map((entry) => (
                        <li
                            key={entry.key}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                            <code className="font-mono text-xs">{entry.key}</code>
                            {entry.present ? (
                                <span className="inline-flex items-center gap-1 text-success">
                                    <CheckCircle2 className="h-4 w-4" />
                                    set
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    missing
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
