'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CatalogTopic } from '@/types/platform/topics';

export function CatalogTable({ topics, onSelect }: { topics: CatalogTopic[]; onSelect: (t: CatalogTopic) => void }) {
    const maxMembers = Math.max(1, ...topics.map((t) => t.member_count));

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-48">Coverage</TableHead>
                        <TableHead className="text-center">State</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topics.map((t) => {
                        const pct = Math.round((t.member_count / maxMembers) * 100);
                        return (
                            <TableRow
                                key={t.id}
                                className="cursor-pointer"
                                onClick={() => onSelect(t)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        {t.featured && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                                        {t.label_en}
                                    </div>
                                    <div className="text-xs text-muted-foreground" dir="rtl">
                                        {t.label_ar} · <span dir="ltr" className="font-mono">{t.slug}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {t.category_slug ? (
                                        <Badge variant="outline">{t.category_slug}</Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={cn('h-full rounded-full', t.member_count > 0 ? 'bg-primary' : 'bg-transparent')}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                            {t.member_count}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {t.active ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
