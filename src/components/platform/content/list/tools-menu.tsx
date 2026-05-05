'use client';

import { useState } from 'react';
import {
    Wrench,
    Trash2,
    ListChecks,
    RefreshCw,
    Zap,
    AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BulkDeleteByFilterDialog } from './bulk-delete-by-filter-dialog';
import { BulkChangeStatusDialog } from './bulk-change-status-dialog';
import { RetryJobsDialog } from './retry-jobs-dialog';
import { PurgeQueuesDialog } from './purge-queues-dialog';

export function ToolsMenu() {
    const [open, setOpen] = useState<
        'none' | 'delete' | 'status' | 'retry-pending' | 'retry-failed' | 'purge'
    >('none');

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Wrench className="mr-2 h-4 w-4" /> Tools
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setOpen('delete')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Bulk delete by filter…
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen('status')}>
                        <ListChecks className="mr-2 h-4 w-4" /> Bulk change status…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpen('retry-pending')}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry pending…
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen('retry-failed')}>
                        <AlertTriangle className="mr-2 h-4 w-4" /> Retry failed…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpen('purge')}
                        className="text-destructive"
                    >
                        <Zap className="mr-2 h-4 w-4" /> Purge queues…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <BulkDeleteByFilterDialog
                open={open === 'delete'}
                onClose={() => setOpen('none')}
            />
            <BulkChangeStatusDialog
                open={open === 'status'}
                onClose={() => setOpen('none')}
            />
            <RetryJobsDialog
                open={open === 'retry-pending'}
                mode="pending"
                onClose={() => setOpen('none')}
            />
            <RetryJobsDialog
                open={open === 'retry-failed'}
                mode="failed"
                onClose={() => setOpen('none')}
            />
            <PurgeQueuesDialog
                open={open === 'purge'}
                onClose={() => setOpen('none')}
            />
        </>
    );
}
