import { cn } from '@/lib/utils';

export interface StepperStep {
    label: string;
}

interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="inline-flex items-center gap-2">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isDone = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isReached = isDone || isCurrent;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.label} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'font-poppins flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm tracking-[0.01em]',
                                    isReached ? 'bg-[#1980C0] text-white' : 'border border-[#808080] text-[#808080]',
                                )}
                            >
                                {stepNumber}
                            </div>
                            <p className={cn('font-poppins text-sm tracking-[0.01em]', isReached ? 'text-[#121212]' : 'text-[#808080]')}>
                                {step.label}
                            </p>
                        </div>
                        {!isLast && <div className={cn('h-px w-[18px]', isDone ? 'bg-[#1980C0]' : 'bg-[#808080]')} />}
                    </div>
                );
            })}
        </div>
    );
}
