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
}

/**
 * Presentational wizard shell. It owns exactly one piece of state — which step
 * is active — and knows nothing about fields, validation, or data shape. Form
 * state belongs to the caller (Inertia `useForm`), reached from `content` by
 * ordinary closure.
 */
export function StepForm({ steps, title, onCancel, onFinish, processing = false, finishLabel = 'Simpan' }: StepFormProps) {
    // 0-indexed here; Stepper counts from 1.
    const [current, setCurrent] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const isFirst = current === 0;
    const isLast = current === steps.length - 1;
    const canProceed = steps[current].canProceed !== false;

    // Long step content (e.g. a form + a preview panel) can leave the body
    // scrolled down when the user advances/goes back — reset it so every step
    // opens at the top instead of wherever the previous step left off.
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0 });
    }, [current]);

    // Advancing and finishing share the submit handler so Enter behaves the
    // same as clicking, and so the browser still runs native field validation.
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!canProceed) return;
        if (isLast) {
            onFinish();
            return;
        }
        setCurrent((step) => step + 1);
    };

    return (
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col px-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pb-5">
                <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">{title}</DialogTitle>
                <Stepper steps={steps} currentStep={current + 1} />
            </div>

            {/* Only the step body scrolls, so header and footer stay put. */}
            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto py-5 pr-4 pl-1">
                {steps[current].content}
            </div>

            <div className="flex items-center gap-4 border-t border-[#E7E7E7] pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={isFirst ? onCancel : () => setCurrent((step) => step - 1)}
                    className="font-poppins h-12 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                >
                    {isFirst ? 'Batal' : 'Sebelumnya'}
                </Button>
                <Button
                    type="submit"
                    disabled={processing || !canProceed}
                    className={cn(
                        'font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white',
                        'hover:bg-[#1668a0]',
                    )}
                >
                    {isLast ? finishLabel : 'Selanjutnya'}
                </Button>
            </div>
        </form>
    );
}
