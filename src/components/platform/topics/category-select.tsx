'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTopicCategories } from '@/hooks/use-topics';

const NONE = '__none__';

/** Category picker backed by the live category list. Empty string = uncategorized. */
export function CategorySelect({
    value,
    onChange,
    allowNone = true,
}: {
    value: string;
    onChange: (slug: string) => void;
    allowNone?: boolean;
}) {
    const categories = useTopicCategories();
    const rows = categories.data?.data ?? [];

    return (
        <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
            <SelectTrigger>
                <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
                {allowNone && <SelectItem value={NONE}>Uncategorized</SelectItem>}
                {rows.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                        {c.label_en} <span className="text-muted-foreground">· {c.slug}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
