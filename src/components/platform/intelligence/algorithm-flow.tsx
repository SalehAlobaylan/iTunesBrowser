'use client';

const SIGNALS = [
    { name: 'Freshness', color: 'bg-orange-500' },
    { name: 'Engagement', color: 'bg-rose-500' },
    { name: 'Velocity', color: 'bg-blue-500' },
    { name: 'Similarity', color: 'bg-violet-500' },
    { name: 'Quality', color: 'bg-green-500' },
    { name: 'Diversity', color: 'bg-yellow-500' },
    { name: 'Trending', color: 'bg-red-500' },
];

export function AlgorithmFlow() {
    return (
        <div className="flex items-center gap-3 overflow-x-auto py-4">
            {/* Signals */}
            <div className="flex flex-col gap-1 shrink-0">
                {SIGNALS.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        <span className="text-xs font-medium">{s.name}</span>
                    </div>
                ))}
            </div>

            {/* Arrow */}
            <div className="flex items-center shrink-0">
                <div className="w-8 h-px bg-border" />
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-border" />
            </div>

            {/* Weighted Sum */}
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border bg-muted/50 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Weighted Sum</span>
                <span className="text-[10px] text-muted-foreground">7 signals x weights</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center shrink-0">
                <div className="w-8 h-px bg-border" />
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-border" />
            </div>

            {/* Flag Multipliers */}
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border bg-muted/50 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Flags</span>
                <span className="text-[10px] text-muted-foreground">Boost / Suppress / Pin</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center shrink-0">
                <div className="w-8 h-px bg-border" />
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-border" />
            </div>

            {/* Diversity Pass */}
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border bg-muted/50 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Diversity</span>
                <span className="text-[10px] text-muted-foreground">Anti-repetition</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center shrink-0">
                <div className="w-8 h-px bg-border" />
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-border" />
            </div>

            {/* Final Feed */}
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 border-primary bg-primary/5 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Final Feed</span>
                <span className="text-[10px] text-muted-foreground">Ranked output</span>
            </div>
        </div>
    );
}
