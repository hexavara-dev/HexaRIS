import { FileUploadField, FormField } from '@/components/form/form-field';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

import { AssetDateField } from './asset-date-field';
import { AssetFormDialogShell } from './asset-form-dialog-shell';

interface ReturnAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
}

interface FormState {
    returnDate: string;
    proof: File | null;
    note: string;
}

const EMPTY_FORM: FormState = { returnDate: '', proof: null, note: '' };

export function ReturnAssetDialog({ open, onOpenChange, onSubmit }: ReturnAssetDialogProps) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    function resetAndClose() {
        setForm(EMPTY_FORM);
        setErrors({});
        onOpenChange(false);
    }

    function handleSave() {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        if (!form.returnDate) nextErrors.returnDate = 'Tanggal pengembalian wajib diisi.';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        onSubmit();
        toast.success('Aset berhasil dikembalikan.');
        resetAndClose();
    }

    return (
        <AssetFormDialogShell open={open} title="Pengembalian Aset" onCancel={resetAndClose} onSave={handleSave}>
            <div className="space-y-5">
                <AssetDateField
                    label="Tgl Pengembalian"
                    htmlFor="return-date"
                    required
                    value={form.returnDate}
                    onChange={(value) => setForm((prev) => ({ ...prev, returnDate: value }))}
                    error={errors.returnDate}
                />

                <FileUploadField
                    label="Upload Bukti Pengembalian (Opsional)"
                    file={form.proof}
                    onSelect={(file) => setForm((prev) => ({ ...prev, proof: file }))}
                    onRemove={() => setForm((prev) => ({ ...prev, proof: null }))}
                    accept="image/*,application/pdf"
                />

                <FormField label="Catatan (Opsional)" htmlFor="return-note">
                    <Textarea
                        id="return-note"
                        value={form.note}
                        onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                        placeholder="Masukkan Catatan Pengembalian"
                        className="min-h-24 w-full rounded-2xl border-[#ACACAC] px-4 py-4 font-poppins text-sm placeholder:text-[#ACACAC]"
                    />
                </FormField>
            </div>
        </AssetFormDialogShell>
    );
}
