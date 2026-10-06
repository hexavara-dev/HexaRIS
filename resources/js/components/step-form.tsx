import { Stepper } from '@/components/design-system/stepper/stepper';
import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * One step of the wizard. `content` is arbitrary JSX written by the caller —
 * field layout varies too much between steps to be worth driving from data,
 * and nested grids or cascading selects are ordinary JSX but would need a
 * recursive field type and cross-field reactivity in a schema.
 */
export interface Step {
    label: string;
    content: ReactNode;
    /** When `false`, this step's "Selanjutnya"/finish button is disabled — e.g. nothing added yet to carry forward. Defaults to always allowed. */
    canProceed?: boolean;
    /**
     * Runs on "Selanjutnya" before advancing; return `false` to keep the user
     * on this step. The caller owns it so it can surface its own errors — the
     * shell knows nothing about fields. The last step skips it (its submit
     * goes to `onFinish`, which validates the whole form).
     */
    validate?: () => boolean;
}

interface StepFormProps {
    steps: Step[];
    title: string;
    /** Called from the "Batal" button on the first step. */
    onCancel: () => void;
    /** Called when the final step is submitted. */
    onFinish: () => void | Promise<void>;
    processing?: boolean;
    /** Label for the last step's submit button — e.g. "Perbarui" when editing. */
    finishLabel?: string;
    /** Cap on the wizard's height — the default is generous; a compact dialog passes something shorter. */
    maxHeightClassName?: string;
    /** Tighter header/content/footer padding — the employee wizard's steps read too tall at the default rhythm. */
    compact?: boolean;
}

/**
 * Presentational wizard shell. It owns exactly one piece of state — which step
 * is active — and knows nothing about fields, validation, or data shape. Form
 * state belongs to the caller (Inertia `useForm`), reached from `content` by
 * ordinary closure.
 */
export function StepForm({
    steps,
    title,
    onCancel,
    onFinish,
    processing = false,
    finishLabel = 'Simpan',
    maxHeightClassName = 'max-h-[min(940px,calc(100vh-2.5rem))]',
    compact = false,
}: StepFormProps) {
    // 0-indexed here; Stepper counts from 1.
    const [current, setCurrent] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const isFirst = current === 0;
    const isLast = current === steps.length - 1;
    const canProceed = steps[current].canProceed !== false;

    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0 });
    }, [current]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!canProceed) return;
        if (isLast) {
            onFinish();
            return;
        }
        if (steps[current].validate && !steps[current].validate()) return;
        setCurrent((step) => step + 1);
    };

    return (
        <form onSubmit={submit} className={cn('grid grid-rows-[auto_minmax(0,1fr)_auto] px-5', maxHeightClassName)}>
            {/* Title and stepper share one row; the stepper only drops to its
                own line when the pair cannot fit, in which case it still
                renders as a single row of its own. */}
            <div className={cn('flex flex-wrap items-center gap-x-8 gap-y-2', compact ? 'pb-2' : 'pb-3')}>
                <DialogTitle className="font-poppins shrink-0 text-[19px] leading-6 font-semibold text-[#121212]">{title}</DialogTitle>
                <div className="min-w-0 flex-auto shrink-0">
                    <Stepper steps={steps} currentStep={current + 1} />
                </div>
            </div>

            {/* Only the step body scrolls, so header and footer stay put. */}
            <div ref={contentRef} className={cn('min-h-0 overflow-y-auto pr-4 pl-1', compact ? 'py-2' : 'py-4')}>
                {steps[current].content}
            </div>

            <div className={cn('flex items-center gap-3 border-t border-[#E7E7E7]', compact ? 'pt-3' : 'pt-4')}>
                <Button
                    type="button"
                    variant="outline"
                    onClick={isFirst ? onCancel : () => setCurrent((step) => step - 1)}
                    className="font-poppins h-11 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-sm font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                >
                    {isFirst ? 'Batal' : 'Sebelumnya'}
                </Button>
                <Button
                    type="submit"
                    disabled={processing || !canProceed}
                    className={cn(
                        'font-poppins h-11 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-sm font-semibold text-white',
                        'hover:bg-[#1668a0]',
                    )}
                >
                    {isLast ? finishLabel : 'Selanjutnya'}
                </Button>
            </div>
        </form>
    );
}
