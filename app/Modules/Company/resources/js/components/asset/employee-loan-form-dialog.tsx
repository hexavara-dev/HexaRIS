import { SelectField, TextField } from '@/components/form/form-field';
import { useState } from 'react';
import { toast } from 'sonner';

import { BRANCH_OPTIONS, CATEGORY_OPTIONS, EMPLOYEE_OPTIONS } from '../../lib/asset-catalog';
import { AssetDateField } from './asset-date-field';
import { AssetFormDialogShell } from './asset-form-dialog-shell';

export interface EmployeeLoanFormState {
    branch: string;
    employee: string;
    category: string;
    quantity: string;
    name: string;
    loanDate: string;
}

export const EMPTY_EMPLOYEE_LOAN_FORM: EmployeeLoanFormState = { branch: '', employee: '', category: '', quantity: '', name: '', loanDate: '' };

interface EmployeeLoanFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValues?: EmployeeLoanFormState;
    successMessage: string;
    onSubmit: (values: EmployeeLoanFormState) => void;
}

/** Shared by AddEmployeeLoanDialog (empty initialValues) and EditEmployeeLoanDialog (row-derived initialValues) — same fields, same validation, different title/starting state/mutation. */
export function EmployeeLoanFormDialog({
    open,
    onOpenChange,
    title,
    initialValues = EMPTY_EMPLOYEE_LOAN_FORM,
    successMessage,
    onSubmit,
}: EmployeeLoanFormDialogProps) {
    const [form, setForm] = useState<EmployeeLoanFormState>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof EmployeeLoanFormState, string>>>({});

    function resetAndClose() {
        setForm(initialValues);
        setErrors({});
        onOpenChange(false);
    }

    function handleSave() {
        const nextErrors: Partial<Record<keyof EmployeeLoanFormState, string>> = {};
        if (!form.branch) nextErrors.branch = 'Cabang perusahaan wajib dipilih.';
        if (!form.employee) nextErrors.employee = 'Karyawan wajib dipilih.';
        if (!form.category) nextErrors.category = 'Kategori aset wajib dipilih.';
        if (!form.quantity || Number(form.quantity) <= 0) nextErrors.quantity = 'Jumlah wajib diisi.';
        if (!form.name.trim()) nextErrors.name = 'Nama aset wajib diisi.';
        if (!form.loanDate) nextErrors.loanDate = 'Tanggal peminjaman wajib diisi.';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        onSubmit(form);
        toast.success(successMessage);
        resetAndClose();
    }

    return (
        <AssetFormDialogShell open={open} title={title} onCancel={resetAndClose} onSave={handleSave} wide>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <SelectField
                    label="Cabang Perusahaan"
                    htmlFor="loan-branch"
                    required
                    value={form.branch || undefined}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, branch: value }))}
                    placeholder="Pilih Cabang"
                    options={BRANCH_OPTIONS}
                    error={errors.branch}
                />

                <SelectField
                    label="Dipinjam Oleh"
                    htmlFor="loan-employee"
                    required
                    value={form.employee || undefined}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, employee: value }))}
                    placeholder="Pilih Karyawan"
                    options={EMPLOYEE_OPTIONS}
                    error={errors.employee}
                />

                <SelectField
                    label="Kategori Aset"
                    htmlFor="loan-category"
                    required
                    value={form.category || undefined}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                    placeholder="Pilih Kategori Aset"
                    options={CATEGORY_OPTIONS}
                    error={errors.category}
                />

                <TextField
                    label="QTY Dipinjam"
                    htmlFor="loan-quantity"
                    required
                    type="number"
                    value={form.quantity}
                    onChange={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
                    placeholder="Masukkan Jumlah"
                    error={errors.quantity}
                />

                <TextField
                    label="Nama Aset"
                    htmlFor="loan-name"
                    required
                    value={form.name}
                    onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Masukkan Nama Aset"
                    error={errors.name}
                />

                <AssetDateField
                    label="Tgl Peminjaman"
                    htmlFor="loan-date"
                    required
                    value={form.loanDate}
                    onChange={(value) => setForm((prev) => ({ ...prev, loanDate: value }))}
                    error={errors.loanDate}
                />
            </div>
        </AssetFormDialogShell>
    );
}
