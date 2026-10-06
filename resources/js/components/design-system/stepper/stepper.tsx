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
}

/**
 * One row, always: every step is `shrink-0` with a nowrap label, and the
 * connectors flex instead, so a 6-step wizard fits the dialog width without
 * wrapping. Steps that are not reached yet read as gray (filled circle +
 * muted label) so the blue pill marks exactly where the user is.
 */
export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="flex w-full min-w-0 items-center gap-2">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isDone = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isReached = isDone || isCurrent;
                const isLast = index === steps.length - 1;

                return (
                    <Fragment key={step.label}>
                        <div className="flex shrink-0 items-center gap-2">
                            <div
                                className={cn(
                                    'font-poppins flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] tracking-[0.01em]',
                                    isReached ? 'bg-[#1980C0] text-white' : 'bg-[#9CA3AF] text-white',
                                )}
                            >
                                {stepNumber}
                            </div>
                            <p
                                className={cn(
                                    'font-poppins text-[16px] tracking-[0.01em] whitespace-nowrap',
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
    );
}
