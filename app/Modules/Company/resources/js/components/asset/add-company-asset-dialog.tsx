import { fileToStoredFile, FileUploadField, SelectField, TextField } from '@/components/form/form-field';
import { useState } from 'react';
import { toast } from 'sonner';

import { BRANCH_OPTIONS, CATEGORY_OPTIONS } from '../../lib/asset-catalog';
import { AssetDateField } from './asset-date-field';
import { AssetFormDialogShell } from './asset-form-dialog-shell';

export interface NewCompanyAssetValues {
    branch: string;
    category: string;
    name: string;
    /** ISO "YYYY-MM-DD" from the native date input — format for display at the call site. */
    procurementDate: string;
    quantity: number;
    /** Data URL of the uploaded photo, if one was selected. */
    photoUrl?: string;
}

interface AddCompanyAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: NewCompanyAssetValues) => void;
}

interface FormState {
    branch: string;
    category: string;
    name: string;
    procurementDate: string;
    quantity: string;
    photo: File | null;
}

const EMPTY_FORM: FormState = { branch: '', category: '', name: '', procurementDate: '', quantity: '', photo: null };

export function AddCompanyAssetDialog({ open, onOpenChange, onSubmit }: AddCompanyAssetDialogProps) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    function resetAndClose() {
        setForm(EMPTY_FORM);
        setErrors({});
        onOpenChange(false);
    }

    async function handleSave() {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        if (!form.branch) nextErrors.branch = 'Cabang perusahaan wajib dipilih.';
        if (!form.category) nextErrors.category = 'Kategori aset wajib dipilih.';
        if (!form.name.trim()) nextErrors.name = 'Nama aset wajib diisi.';
        if (!form.procurementDate) nextErrors.procurementDate = 'Tanggal pengadaan wajib diisi.';
        if (!form.quantity || Number(form.quantity) <= 0) nextErrors.quantity = 'Jumlah wajib diisi.';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const photoUrl = form.photo ? (await fileToStoredFile(form.photo)).dataUrl : undefined;

        onSubmit({
            branch: form.branch,
            category: form.category,
            name: form.name.trim(),
            procurementDate: form.procurementDate,
            quantity: Number(form.quantity),
            photoUrl,
        });
        toast.success('Aset berhasil ditambahkan.');
        resetAndClose();
    }

    return (
        <AssetFormDialogShell open={open} title="Tambah Aset Perusahaan" onCancel={resetAndClose} onSave={handleSave}>
            <div className="space-y-5">
                <SelectField
                    label="Cabang Perusahaan"
                    htmlFor="asset-branch"
                    required
                    value={form.branch || undefined}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, branch: value }))}
                    placeholder="Pilih Cabang"
                    options={BRANCH_OPTIONS}
                    error={errors.branch}
                />

                <SelectField
                    label="Kategori Aset"
                    htmlFor="asset-category"
                    required
                    value={form.category || undefined}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                    placeholder="Pilih Kategori Aset"
                    options={CATEGORY_OPTIONS}
                    error={errors.category}
                />

                <TextField
                    label="Nama Aset"
                    htmlFor="asset-name"
                    required
                    value={form.name}
                    onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Masukkan Nama Aset"
                    error={errors.name}
                />

                <AssetDateField
                    label="Tgl Pengadaan"
                    htmlFor="asset-procurement-date"
                    required
                    value={form.procurementDate}
                    onChange={(value) => setForm((prev) => ({ ...prev, procurementDate: value }))}
                    error={errors.procurementDate}
                />

                <TextField
                    label="QTY"
                    htmlFor="asset-quantity"
                    required
                    type="number"
                    value={form.quantity}
                    onChange={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
                    placeholder="Masukkan Jumlah"
                    error={errors.quantity}
                />

                <FileUploadField
                    label="Upload Foto Aset (Opsional)"
                    file={form.photo}
                    onSelect={(file) => setForm((prev) => ({ ...prev, photo: file }))}
                    onRemove={() => setForm((prev) => ({ ...prev, photo: null }))}
                    accept="image/*"
                />
            </div>
        </AssetFormDialogShell>
    );
}
