'use client';

import {
    useApplyRecommendation,
    useCreateMediaCirculationOverride,
    useDeleteMediaCirculationOverride,
    useDismissRecommendation,
    useGenerateMediaCirculationRecommendations,
    useMediaCirculationCockpit,
    useMediaCirculationOverrides,
    useMediaSupplyEpisodes,
    useMediaSupplyStatus,
    useRevertRecommendation,
    useUpdateMediaCirculationPolicy,
} from '@/hooks/use-media-circulation';
import { MediaCirculationCockpitView } from '@/components/platform/media/circulation/media-circulation-cockpit';

export default function MediaCirculationPage() {
    const cockpit = useMediaCirculationCockpit();
    const generate = useGenerateMediaCirculationRecommendations();
    const overrides = useMediaCirculationOverrides();
    const updatePolicy = useUpdateMediaCirculationPolicy();
    const apply = useApplyRecommendation();
    const dismiss = useDismissRecommendation();
    const revert = useRevertRecommendation();
    const createOverride = useCreateMediaCirculationOverride();
    const deleteOverride = useDeleteMediaCirculationOverride();
    const supply = useMediaSupplyStatus();
    const supplyEpisodes = useMediaSupplyEpisodes();

    return (
        <MediaCirculationCockpitView
            cockpit={cockpit.data}
            overrides={overrides.data?.data ?? []}
            loading={cockpit.isLoading}
            fetching={cockpit.isFetching}
            generating={generate.isPending}
            acting={apply.isPending || dismiss.isPending || revert.isPending || createOverride.isPending || deleteOverride.isPending}
            savingPolicy={updatePolicy.isPending}
            onGenerate={() => generate.mutate()}
            onApply={(id) => apply.mutate(id)}
            onDismiss={(id) => dismiss.mutate(id)}
            onRevert={(id) => revert.mutate(id)}
            onSavePolicy={(data) => updatePolicy.mutate(data)}
            onCreateOverride={(data) => createOverride.mutate(data)}
            onDeleteOverride={(id) => deleteOverride.mutate(id)}
            supply={supply.data}
            supplyEpisodes={supplyEpisodes.data}
            supplyLoading={supply.isLoading}
            supplyError={supply.error instanceof Error ? supply.error : null}
            supplyEpisodesError={supplyEpisodes.error instanceof Error ? supplyEpisodes.error : null}
        />
    );
}
