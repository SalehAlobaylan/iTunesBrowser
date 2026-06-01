'use client';

import { useState } from 'react';
import { Plus, ArrowLeft, Sparkles, Wand2, ChevronDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { TopicBoard } from '@/components/platform/news/topic-board';
import { NewsBoard } from '@/components/platform/news/news-board';
import { AddNewsSheet } from '@/components/platform/news/add-news-sheet';
import { PullFreshButton } from '@/components/platform/news/run-source-dialog';
import { RecclusterDialog } from '@/components/platform/news/recluster-dialog';
import { useReclassify } from '@/hooks/use-news';
import type { TopicSelection } from '@/types/platform/news';

export default function NewsPage() {
    const [active, setActive] = useState<TopicSelection | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [reclusterOpen, setReclusterOpen] = useState(false);
    const [classifying, setClassifying] = useState(false);

    const reclassify = useReclassify();

    const runClassify = async () => {
        setClassifying(true);
        try {
            let guard = 0;
            let last = 0;
            while (guard++ < 200) {
                const r = await reclassify.mutateAsync(25);
                last = r.processed;
                if (r.remaining === 0 || r.processed === 0) break;
            }
            toast({
                title: 'Classification complete',
                description: last === 0 ? 'Nothing to classify.' : 'Topics updated.',
                variant: 'success',
            });
        } finally {
            setClassifying(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    {active ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setActive(null)}
                                className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                All topics
                            </button>
                            <h1 className="truncate text-3xl font-bold tracking-tight" title={active.label}>
                                {active.label}
                            </h1>
                            <p className="text-muted-foreground">Manage this topic’s news — item by item.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight">News</h1>
                            <p className="text-muted-foreground">
                                Rotate the feed by topic — publish, archive, and curate whole topics at once.
                            </p>
                        </>
                    )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    <PullFreshButton />
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add news
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Topics
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={runClassify} disabled={classifying}>
                                {classifying ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Classify unsorted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReclusterOpen(true)}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Re-cluster all…
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main: topic board, or a topic's news board when drilled in */}
            {active ? <NewsBoard topic={active} /> : <TopicBoard onOpenTopic={setActive} />}

            <AddNewsSheet open={addOpen} onClose={() => setAddOpen(false)} />
            <RecclusterDialog open={reclusterOpen} onClose={() => setReclusterOpen(false)} />
        </div>
    );
}
