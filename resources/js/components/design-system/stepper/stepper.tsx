import { cn } from '@/lib/utils';
import { Fragment } from 'react';

export interface StepperStep {
    label: string;
}

/** Shared 3-step "Struktur -> Staff -> Preview" flow used by both the create wizard and the edit dialog. */
export const ORG_STRUCTURE_STEPS: StepperStep[] = [{ label: 'Struktur' }, { label: 'Staff' }, { label: 'Preview' }];

interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    compact?: boolean;
}

/**
 * One row, always: every step is `shrink-0` with a nowrap label, and the
 * connectors flex instead, so a 6-step wizard fits the dialog width without
 * wrapping. Steps that are not reached yet read as gray (filled circle +
 * muted label) so the blue pill marks exactly where the user is.
 *
 * On small screens the non-compact variant shrinks the circles and drops the
 * labels below `sm`, so the row never overflows the dialog (the StepForm
 * wrapper can still scroll it sideways if it does).
 */
export function Stepper({ steps, currentStep, compact = false }: StepperProps) {
    const currentLabel = steps[currentStep - 1]?.label;

    return (
        <div className="flex w-full min-w-0 flex-col gap-1.5">
            <div className={cn('flex w-full min-w-0 items-center', compact ? 'gap-1.5' : 'gap-1.5 sm:gap-2')}>
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isDone = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isReached = isDone || isCurrent;
                    const isLast = index === steps.length - 1;

                    return (
                        <Fragment key={step.label}>
                            <div className={cn('flex shrink-0 items-center', compact ? 'gap-1.5' : 'gap-1.5 sm:gap-2')}>
                                <div
                                    className={cn(
                                        'font-poppins flex shrink-0 items-center justify-center rounded-full tracking-[0.01em]',
                                        compact ? 'size-5 text-[10px]' : 'size-7 text-[14px] sm:size-8 sm:text-[16px]',
                                        isReached ? 'bg-[#1980C0] text-white' : 'bg-[#9CA3AF] text-white',
                                    )}
                                >
                                    {stepNumber}
                                </div>
                                <p
                                    className={cn(
                                        'font-poppins tracking-[0.01em] whitespace-nowrap',
                                        compact ? 'hidden text-[11px] min-[480px]:block' : 'hidden text-[14px] sm:block sm:text-[16px]',
                                        isReached ? 'text-[#121212]' : 'text-[#808080]',
                                    )}
                                >
                                    {step.label}
                                </p>
                            </div>
                            {!isLast && <div className={cn('h-px min-w-2 flex-1', isDone ? 'bg-[#1980C0]' : 'bg-[#808080]')} />}
                        </Fragment>
                    );
                })}
            </div>
            {compact && currentLabel && (
                <p className="font-poppins text-[11px] text-[#667085] min-[480px]:hidden">
                    Langkah {currentStep} dari {steps.length}: <span className="font-semibold text-[#121212]">{currentLabel}</span>
                </p>
            )}
        </div>
    );
}
