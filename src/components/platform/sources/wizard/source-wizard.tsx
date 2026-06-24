'use client';

import { useMemo, useReducer } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ContentSource, CreateSourceRequest, SourceType } from '@/types/platform/source';

import {
    initialWizardState,
    wizardReducer,
    isConnectValid,
    isSettingsValid,
    buildCreatePayload,
    sourceToWizardState,
} from './types';
import type { WizardStep, WizardState } from './types';
import { StepTypeSelect } from './step-type-select';
import { StepConnect } from './step-connect';
import { StepPreview } from './step-preview';
import { StepSettings } from './step-settings';

interface SourceWizardProps {
    onSubmit: (data: CreateSourceRequest) => void;
    isSubmitting?: boolean;
    /** Pass an existing source to enter edit mode. */
    source?: ContentSource;
    /** Restrict the type picker (e.g. media-only add flow). */
    allowedTypes?: SourceType[];
    /** Apply media-friendly defaults (e.g. Telegram audio/voice/video). */
    mediaDefaults?: boolean;
}

const STEPS: { id: WizardStep; title: string; subtitle: string }[] = [
    { id: 1, title: 'Type', subtitle: 'What kind of source?' },
    { id: 2, title: 'Connect', subtitle: 'Where to fetch from' },
    { id: 3, title: 'Preview', subtitle: 'Confirm what gets ingested' },
    { id: 4, title: 'Settings', subtitle: 'Name, schedule, filters' },
];

export function SourceWizard({
    onSubmit,
    isSubmitting,
    source,
    allowedTypes,
    mediaDefaults,
}: SourceWizardProps) {
    const isEdit = Boolean(source);
    const editInit = useMemo(
        () => (source ? sourceToWizardState(source) : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [source?.id]
    );

    const [state, dispatch] = useReducer(
        wizardReducer,
        editInit ?? initialWizardState
    );

    const minStep: WizardStep = isEdit ? 2 : 1;

    const canAdvance = (() => {
        switch (state.step) {
            case 1:
                return state.type !== null;
            case 2:
                return isConnectValid(state);
            case 3:
                return true;
            case 4:
                return isSettingsValid(state);
        }
    })();

    const goNext = () => {
        if (state.step < 4) dispatch({ kind: 'set_step', step: (state.step + 1) as WizardStep });
        else handleSubmit();
    };

    const goBack = () => {
        if (state.step > minStep)
            dispatch({ kind: 'set_step', step: (state.step - 1) as WizardStep });
    };

    const handleSubmit = () => {
        if (!isSettingsValid(state) || !state.type) return;
        onSubmit(buildCreatePayload(state));
    };

    const visibleSteps = isEdit ? STEPS.filter((s) => s.id >= 2) : STEPS;

    return (
        <Card>
            <CardHeader className="border-b">
                <Stepper
                    steps={visibleSteps}
                    current={state.step}
                    onJump={(s) => dispatch({ kind: 'set_step', step: s })}
                    state={state}
                    isEdit={isEdit}
                />
                <CardTitle className="pt-2 text-lg">
                    {STEPS[state.step - 1].subtitle}
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
                {state.step === 1 && !isEdit && (
                    <StepTypeSelect
                        selected={state.type}
                        allowedTypes={allowedTypes}
                        onSelect={(type) => {
                            dispatch({ kind: 'set_type', type });
                            // Media flow: default Telegram to the For-You media kinds.
                            if (mediaDefaults && type === 'TELEGRAM') {
                                dispatch({ kind: 'toggle_telegram_media', media: 'video', on: true });
                            }
                            dispatch({ kind: 'set_step', step: 2 });
                        }}
                    />
                )}
                {state.step === 2 && <StepConnect state={state} dispatch={dispatch} />}
                {state.step === 3 && (
                    <StepPreview
                        state={state}
                        onResult={(result) => dispatch({ kind: 'set_preview_result', result })}
                    />
                )}
                {state.step === 4 && <StepSettings state={state} dispatch={dispatch} />}
            </CardContent>

            <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={state.step <= minStep || isSubmitting}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance || isSubmitting}
                >
                    {state.step === 4 ? (
                        isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEdit ? 'Updating…' : 'Creating…'}
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                {isEdit ? 'Update source' : 'Create source'}
                            </>
                        )
                    ) : (
                        <>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
}

interface StepperProps {
    steps: typeof STEPS;
    current: WizardStep;
    onJump: (step: WizardStep) => void;
    state: WizardState;
    isEdit: boolean;
}

function Stepper({ steps, current, onJump, state, isEdit }: StepperProps) {
    const reachable = (id: WizardStep): boolean => {
        if (id <= current) return true;
        if (isEdit) return true;
        if (id >= 2 && state.type === null) return false;
        if (id >= 3 && !isConnectValid(state)) return false;
        return true;
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto">
            {steps.map((s, idx) => {
                const isCurrent = s.id === current;
                const isDone = s.id < current;
                const canJump = reachable(s.id);
                return (
                    <div key={s.id} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => canJump && onJump(s.id)}
                            disabled={!canJump}
                            className={cn(
                                'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                isCurrent && 'border-primary bg-primary text-primary-foreground',
                                isDone && !isCurrent && 'border-primary/40 bg-primary/10 text-primary',
                                !isCurrent && !isDone && 'border-muted text-muted-foreground',
                                !canJump && 'cursor-not-allowed opacity-60'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                                    isCurrent ? 'bg-primary-foreground text-primary' : 'bg-muted text-foreground'
                                )}
                            >
                                {isDone ? <Check className="h-3 w-3" /> : s.id}
                            </span>
                            {s.title}
                        </button>
                        {idx < steps.length - 1 && (
                            <div className="h-px w-6 flex-shrink-0 bg-border" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
