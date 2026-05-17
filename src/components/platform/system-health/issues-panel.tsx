'use client';

import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDismissedIssues } from '@/hooks/use-dismissed-issues';
import type { SystemIssue } from '@/types/platform/system-health';

export function IssuesPanel({ issues }: { issues: SystemIssue[] }) {
    const { isDismissed, dismiss, clearAll } = useDismissedIssues();
    const visible = issues.filter((i) => !isDismissed(i));
    const hiddenCount = issues.length - visible.length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">Issues</CardTitle>
                        <CardDescription>
                            Missing or weak parts detected across the platform.
                        </CardDescription>
                    </div>
                    {hiddenCount > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="text-xs"
                        >
                            Show {hiddenCount} dismissed
                        </Button>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                {visible.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {issues.length === 0
                            ? 'No issues detected.'
                            : 'All current issues dismissed.'}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {visible.map((issue, idx) => {
                            const isCritical = issue.severity === 'critical';
                            const Icon = isCritical ? ShieldAlert : AlertTriangle;
                            return (
                                <li
                                    key={idx}
                                    className="flex items-start gap-3 rounded-md border p-3 text-sm"
                                >
                                    <Icon
                                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                                            isCritical ? 'text-destructive' : 'text-warning'
                                        }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={isCritical ? 'destructive' : 'warning'}
                                                className="text-[10px] uppercase"
                                            >
                                                {issue.severity}
                                            </Badge>
                                            {issue.service ? (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {issue.service}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 break-words">{issue.message}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => dismiss(issue)}
                                        title="Dismiss for 4 hours"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
