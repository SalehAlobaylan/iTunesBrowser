'use client';

import {
    useApplyRecommendation,
    useDismissRecommendation,
    useGenerateMediaCirculationRecommendations,
    useMediaCirculationCockpit,
    useUpdateMediaCirculationPolicy,
} from '@/hooks/use-media-circulation';
import { MediaCirculationCockpitView } from '@/components/platform/media/circulation/media-circulation-cockpit';

export default function MediaCirculationPage() {
    const cockpit = useMediaCirculationCockpit();
    const generate = useGenerateMediaCirculationRecommendations();
    const updatePolicy = useUpdateMediaCirculationPolicy();
    const apply = useApplyRecommendation();
    const dismiss = useDismissRecommendation();

    return (
        <MediaCirculationCockpitView
            cockpit={cockpit.data}
            loading={cockpit.isLoading}
            fetching={cockpit.isFetching}
            generating={generate.isPending}
            acting={apply.isPending || dismiss.isPending}
            savingPolicy={updatePolicy.isPending}
            onGenerate={() => generate.mutate()}
            onApply={(id) => apply.mutate(id)}
            onDismiss={(id) => dismiss.mutate(id)}
            onSavePolicy={(data) => updatePolicy.mutate(data)}
        />
    );
}
