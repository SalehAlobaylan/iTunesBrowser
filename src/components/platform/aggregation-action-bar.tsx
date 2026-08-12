'use client';

import { ShieldAlert } from 'lucide-react';

export function AggregationActionBar() {
    return (
        <div className="mt-3 flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
            Queue retry and purge controls are manual-only and unavailable from the Console. CMS owns approved exact recovery; queue acceptance never proves a recovered effect.
        </div>
    );
}
