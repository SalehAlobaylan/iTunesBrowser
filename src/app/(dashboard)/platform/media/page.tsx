'use client';

import { useState } from 'react';
import { Video, Mic } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SttSettingsCard } from '@/components/platform/media/stt-settings-card';
import { MediaList } from '@/components/platform/media/media-list';
import type { ContentType } from '@/types/platform/content';

/**
 * Media Library — manages the For You audio/video corpus: caption-first transcripts,
 * caption-state badges, and on-demand STT upgrades.
 */
export default function MediaPage() {
    const [type, setType] = useState<ContentType>('VIDEO');

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Media Library</h1>
                    <p className="text-sm text-muted-foreground">
                        Browse, filter, and manage video and podcast items. Keep captions first, then
                        use STT batches for weak or missing transcripts.
                    </p>
                </div>
            </div>

            {/* STT settings */}
            <SttSettingsCard />

            {/* Type toggle */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant={type === 'VIDEO' ? 'default' : 'outline'}
                    onClick={() => setType('VIDEO')}
                >
                    <Video className="mr-1.5 h-4 w-4" /> Video
                </Button>
                <Button
                    size="sm"
                    variant={type === 'PODCAST' ? 'default' : 'outline'}
                    onClick={() => setType('PODCAST')}
                >
                    <Mic className="mr-1.5 h-4 w-4" /> Podcast
                </Button>
            </div>

            <MediaList type={type} />
        </div>
    );
}
