import { StepForm, type Step } from '@/components/step-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type Employee } from '@/data/Employee/employee';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { hydrateEmployeeFormData } from '../lib/employee-form-overlay';
import { validateEmployeeForm, validateEmployeeFormStep } from '../lib/validate-employee-form';
import {
    createEmptyFileFieldFlags,
    initialEmployeeFormData,
    type EmployeeFormData,
    type FieldErrors,
    type FileFieldFlags,
} from '../types/employee-form';
import { EducationStep } from './steps/education-step';
import { ExperienceStep } from './steps/experience-step';
import { FinancialStep } from './steps/financial-step';
import { PersonalStep } from './steps/personal-step';
import { PreviewStep } from './steps/preview-step';
import { ProvisionStep } from './steps/provision-step';

interface EmployeeFormDialogProps {
    open: boolean;
    /** `null` opens create mode; an employee opens edit mode, hydrated from that record. */
    employee: Employee | null;
    onClose: () => void;
    /** Persists a brand-new employee (local record + form overlay). */
    onCreate: (data: EmployeeFormData, fileFlags: FileFieldFlags) => Promise<void>;
    /** Persists edits — local record or seed override, plus the form overlay. */
    onUpdate: (target: Employee, data: EmployeeFormData, fileFlags: FileFieldFlags) => Promise<void>;
}

/**
 * The "Tambah Karyawan" / "Edit Karyawan" wizard: form state, client-side
 * validation, the six steps, and the dialog shell. The table page keeps only
 * the persistence callbacks, so this dialog owns everything about the form.
 */
export function EmployeeFormDialog({ open, employee, onClose, onCreate, onUpdate }: EmployeeFormDialogProps) {
    const { data, setData, reset, processing } = useForm<EmployeeFormData>(initialEmployeeFormData);

    const [validationErrors, setValidationErrors] = useState<FieldErrors>({});
    const [fileFlags, setFileFlags] = useState<FileFieldFlags>(createEmptyFileFieldFlags());
    const [saving, setSaving] = useState(false);

    /**
     * Highest step the user has tried to leave. The form stays quiet until the
     * first "Selanjutnya"; after that every keystroke re-validates the attempted
     * range, so a field's error clears the moment it is filled in again instead
     * of sticking until the next click.
     */
    const [attemptedUpTo, setAttemptedUpTo] = useState(-1);

    // Re-hydrating on every open keeps a half-filled form from leaking from one
    // record into the next, and from create mode into edit mode.
    useEffect(() => {
        if (!open) return;

        if (employee) {
            const hydrated = hydrateEmployeeFormData(employee);
            setData(hydrated.data);
            setFileFlags(hydrated.fileFlags);
        } else {
            reset();
            setFileFlags(createEmptyFileFieldFlags());
        }

        setValidationErrors({});
        setAttemptedUpTo(-1);
    }, [open, employee, reset, setData]);

    const close = () => {
        reset();
        setValidationErrors({});
        setAttemptedUpTo(-1);
        setFileFlags(createEmptyFileFieldFlags());
        onClose();
    };

    /** Live per-field validation: once a step has been attempted, every change re-runs it. */
    const updateField = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
        const next = { ...data, [key]: value } as EmployeeFormData;

        setData(next);

        if (attemptedUpTo >= 0) {
            setValidationErrors(validateEmployeeFormStep(attemptedUpTo, next, fileFlags));
        }
    };

    const finish = async () => {
        setAttemptedUpTo(steps.length - 1);

        const nextErrors = validateEmployeeForm(data, fileFlags);

        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi field wajib.');
            return;
        }

        if (saving) return;
        setSaving(true);

        try {
            if (employee) {
                await onUpdate(employee, data, fileFlags);
                toast.success('Berhasil Diperbarui');
            } else {
                await onCreate(data, fileFlags);
                toast.success('Berhasil Ditambahkan');
            }

            close();
        } catch {
            toast.error('Gagal menyimpan — coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Gate for "Selanjutnya": re-checks every step up to `stepIndex` (not just
     * the current one) so an error surfaced earlier can't be left behind, then
     * clears the errors when the run passes. Returning false stops StepForm
     * from advancing — the failing fields are already rendered with messages.
     */
    const validateUpTo = (stepIndex: number) => {
        setAttemptedUpTo(stepIndex);

        const nextErrors = validateEmployeeFormStep(stepIndex, data, fileFlags);

        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi field wajib.');
            return false;
        }

        setValidationErrors({});
        return true;
    };

    const steps: Step[] = [
        {
            label: 'Personal',
            content: <PersonalStep data={data} setData={updateField} errors={validationErrors} />,
            validate: () => validateUpTo(0),
        },
        {
            label: 'Pendidikan',
            content: <EducationStep data={data} setData={updateField} errors={validationErrors} />,
            validate: () => validateUpTo(1),
        },
        {
            label: 'Pengalaman',
            content: <ExperienceStep data={data} setData={updateField} errors={validationErrors} />,
            validate: () => validateUpTo(2),
        },
        {
            label: 'Ketentuan',
            content: <ProvisionStep data={data} setData={updateField} errors={validationErrors} />,
            validate: () => validateUpTo(3),
        },
        {
            label: 'Gaji & Bank',
            content: <FinancialStep data={data} setData={updateField} errors={validationErrors} />,
            validate: () => validateUpTo(4),
        },
        {
            label: 'Pratinjau',
            content: <PreviewStep data={data} />,
        },
    ];

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) close();
            }}
        >
            <DialogContent
                className="flex max-w-6xl flex-col gap-0 py-3"
                aria-describedby={undefined}
                onInteractOutside={(event) => event.preventDefault()}
            >
                <StepForm
                    steps={steps}
                    title={employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                    finishLabel={employee ? 'Perbarui' : 'Simpan'}
                    processing={processing || saving}
                    compact
                    maxHeightClassName="max-h-[min(840px,calc(100vh-2.5rem))]"
                    onCancel={close}
                    onFinish={finish}
                />
            </DialogContent>
        </Dialog>
    );
}
