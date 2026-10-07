import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadField } from '@/components/form/form-field';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SelectField, TextField } from '../steps/wizard-fields';

export interface ResignFormInput {
    /** Display employee id of the picked employee (EM187, ...). */
    employeeId: string;
    /** Native `type="date"` value — YYYY-MM-DD. */
    resignDate: string;
    reason: string;
    document: File | null;
}

interface ResignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Options for "Pilih Karyawan" — active employees without an open request. */
    employees: { value: string; label: string }[];
    onSubmit: (input: ResignFormInput) => void;
}

type ResignFieldErrors = Partial<Record<'employeeId' | 'resignDate' | 'reason', string>>;

/**
 * The "+ Resign" popup: pick an employee, date, reason and an optional support
 * document. Validation mirrors the wizard's — required messages plus a red
 * toast — and the form resets every time the dialog opens.
 */
export function ResignDialog({ open, onOpenChange, employees, onSubmit }: ResignDialogProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [resignDate, setResignDate] = useState('');
    const [reason, setReason] = useState('');
    const [document, setDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<ResignFieldErrors>({});

    useEffect(() => {
        if (!open) return;

        setEmployeeId('');
        setResignDate('');
        setReason('');
        setDocument(null);
        setErrors({});
    }, [open]);

    const submit = () => {
        const nextErrors: ResignFieldErrors = {};

        if (!employeeId) nextErrors.employeeId = 'Wajib diisi.';
        if (!resignDate) nextErrors.resignDate = 'Wajib diisi.';
        if (!reason.trim()) nextErrors.reason = 'Wajib diisi.';

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            toast.error('Lengkapi field wajib.');
            return;
        }

        onSubmit({ employeeId, resignDate, reason: reason.trim(), document });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-xl"
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="border-b border-[#E5E7EB] px-6 py-4 text-left">
                    <DialogTitle className="font-poppins text-[19px] font-semibold leading-6 text-[#121212]">
                        Karyawan Resign
                    </DialogTitle>
                    <DialogDescription className="sr-only">Formulir pengajuan resign karyawan</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 px-6 py-4">
                    <SelectField
                        label="Pilih Karyawan"
                        htmlFor="resign-employee"
                        required
                        value={employeeId}
                        onValueChange={setEmployeeId}
                        options={employees}
                        placeholder="Pilih Karyawan"
                        error={errors.employeeId}
                    />

                    <TextField
                        label="Tanggal Resign"
                        htmlFor="resign-date"
                        required
                        type="date"
                        value={resignDate}
                        onChange={setResignDate}
                        error={errors.resignDate}
                    />

                    <div className="flex w-full flex-col items-start gap-1.5">
                        <p className="font-poppins text-sm font-semibold text-[#121212]">
                            Alasan Resign <span className="text-[#EF4938]">*</span>
                        </p>

                        <Textarea
                            id="resign-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Masukkan Alasan Resign"
                            className={`min-h-[120px] resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-[#1980C0] focus:ring-2 focus:ring-[#1980C0]/10 ${
                                errors.reason ? 'border-[#EF4938]' : 'border-[#D1D5DB]'
                            }`}
                        />

                        {errors.reason && <p className="font-poppins text-xs text-[#EF4938]">{errors.reason}</p>}
                    </div>

                    <FileUploadField
                        label="Doc Pendukung (Opsional)"
                        dense
                        accept="image/*,.pdf"
                        file={document}
                        onSelect={setDocument}
                        onRemove={() => setDocument(null)}
                    />
                </div>

                <div className="flex gap-3 border-t border-[#E5E7EB] px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 flex-1 rounded-xl border border-[#1980C0] text-sm font-semibold text-[#1980C0] hover:bg-[#1980C0]/5"
                    >
                        Batal
                    </Button>

                    <Button
                        type="button"
                        onClick={submit}
                        className="h-11 flex-1 rounded-xl bg-[#1980C0] text-sm font-semibold hover:bg-[#1673AD]"
                    >
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
