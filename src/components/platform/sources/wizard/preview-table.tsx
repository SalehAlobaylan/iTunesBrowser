'use client';

import { ExternalLink } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PreviewItem } from '@/types/platform/source';

interface PreviewTableProps {
    items: PreviewItem[];
}

function formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

export function PreviewTable({ items }: PreviewTableProps) {
    if (items.length === 0) {
        return (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No items returned. Adjust filters and try again.
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.idempotencyKey}>
                            <TableCell className="max-w-0">
                                <div className="truncate font-medium">{item.title}</div>
                                {item.excerpt && (
                                    <div className="truncate text-xs text-muted-foreground">
                                        {item.excerpt}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="text-[10px]">
                                    {item.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {item.author || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(item.publishedAt)}
                            </TableCell>
                            <TableCell>
                                {item.originalUrl && (
                                    <a
                                        href={item.originalUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-foreground"
                                        aria-label="Open original"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
