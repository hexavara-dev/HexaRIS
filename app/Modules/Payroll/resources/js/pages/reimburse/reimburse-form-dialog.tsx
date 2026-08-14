import { FileUploadField, SelectField, TextField, fileToStoredFile, isStoredFile, type StoredFile } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import { cn } from '@/lib/utils';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { positionTitleFor } from '../../lib/payroll-row';
import { createReimburseEntry, updateReimburseEntry } from '../../lib/reimburse-storage';

const METODE_OPTIONS = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer' },
];

// Flatter, less-rounded box than form-field.tsx's default — matches the input style already
// established across this Payroll module's other settings forms (Potongan/Lembur/Tunjangan).
const FLAT_INPUT_CLASS =
    'h-auto w-full rounded-lg border-[#E7E7E7] px-4 py-2 font-poppins text-sm placeholder:text-[#ACACAC] disabled:bg-[#F5F5F5] disabled:text-[#ACACAC]';

// Karyawan's option label ("Nama - Jabatan") can run long — SelectTrigger's shared
// [&>span]:line-clamp-1 would otherwise cut it off with an ellipsis. Given the field its own
// full-width row and let the value wrap onto a second line instead of truncating.
const KARYAWAN_INPUT_CLASS = cn(FLAT_INPUT_CLASS, 'text-left [&>span]:line-clamp-none [&>span]:whitespace-normal');

const EMPLOYEE_OPTIONS = employee
    .filter((e) => e.is_active)
    .map((e) => ({ value: e.id, label: `${e.full_name} - ${positionTitleFor(e.id)}` }));

function formatRupiahInput(digits: string): string {
    if (!digits) return '';
    return `Rp. ${Number(digits).toLocaleString('id-ID')}`;
}

interface FormState {
    employee_id: string;
    tanggal_pengeluaran: string;
    tanggal_reimburse: string;
    keperluan: string;
    nominal: string;
    metode_bayar: ReimburseEntry['metode_bayar'];
    bukti: File | StoredFile | null;
}

const EMPTY_FORM: FormState = {
    employee_id: '',
    tanggal_pengeluaran: '',
    tanggal_reimburse: '',
    keperluan: '',
    nominal: '',
    metode_bayar: 'tunai',
    bukti: null,
};

function toFormState(target: ReimburseEntry | null): FormState {
    if (!target) return EMPTY_FORM;
    return {
        employee_id: target.employee_id,
        tanggal_pengeluaran: target.tanggal_pengeluaran,
        tanggal_reimburse: target.tanggal_reimburse,
        keperluan: target.keperluan,
        nominal: formatRupiahInput(String(target.nominal)),
        metode_bayar: target.metode_bayar,
        bukti: target.bukti,
    };
}

interface ReimburseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: ReimburseEntry | null;
    defaultBranchId: string;
    onSaved: () => void;
}

export function ReimburseFormDialog({ open, onOpenChange, target, defaultBranchId, onSaved }: ReimburseFormDialogProps) {
    const [form, setForm] = useState<FormState>(() => toFormState(target));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) setForm(toFormState(target));
    }, [open, target]);

    const save = async () => {
        setSaving(true);
        try {
            const bukti: StoredFile = form.bukti
                ? isStoredFile(form.bukti)
                    ? form.bukti
                    : await fileToStoredFile(form.bukti)
                : { name: '', type: '', dataUrl: '' };
            const nominal = Number(form.nominal.replace(/\D/g, '')) || 0;
            const patch = {
                employee_id: form.employee_id,
                tanggal_pengeluaran: form.tanggal_pengeluaran,
                tanggal_reimburse: form.tanggal_reimburse,
                keperluan: form.keperluan,
                nominal,
                metode_bayar: form.metode_bayar,
                bukti,
            };

            const ok = target ? updateReimburseEntry(target.id, patch) : createReimburseEntry({ ...patch, branch_id: defaultBranchId }).ok;

            if (ok) {
                toast.success('Berhasil Disimpan');
                onSaved();
                onOpenChange(false);
            } else {
                toast.error('Gagal menyimpan — penyimpanan lokal penuh atau bermasalah.');
            }
        } catch {
            toast.error('Gagal menyimpan. Coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const canSave =
        form.employee_id.length > 0 &&
        form.keperluan.trim().length > 0 &&
        form.tanggal_pengeluaran.length > 0 &&
        form.tanggal_reimburse.length > 0 &&
        Number(form.nominal.replace(/\D/g, '')) > 0 &&
        form.bukti !== null &&
        !saving;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && saving) return;
                onOpenChange(next);
            }}
        >
            <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="border-b border-[#E7E7E7] pb-4">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">
                        {target ? 'Edit Reimburse' : 'Tambah Reimburse'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    <SelectField
                        label="Karyawan"
                        htmlFor="employee_id"
                        required
                        placeholder="Pilih Karyawan"
                        value={form.employee_id}
                        onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
                        options={EMPLOYEE_OPTIONS}
                        inputClassName={KARYAWAN_INPUT_CLASS}
                    />
                    <TextField
                        label="Keperluan"
                        htmlFor="keperluan"
                        required
                        placeholder="Masukkan Keperluan"
                        value={form.keperluan}
                        onChange={(v) => setForm((f) => ({ ...f, keperluan: v }))}
                        inputClassName={FLAT_INPUT_CLASS}
                    />
                    <TextField
                        label="Tgl Pengeluaran"
                        htmlFor="tanggal_pengeluaran"
                        required
                        type="date"
                        value={form.tanggal_pengeluaran}
                        onChange={(v) => setForm((f) => ({ ...f, tanggal_pengeluaran: v }))}
                        inputClassName={FLAT_INPUT_CLASS}
                    />
                    <TextField
                        label="Nominal"
                        htmlFor="nominal"
                        required
                        placeholder="Rp. 0"
                        value={form.nominal}
                        onChange={(v) => setForm((f) => ({ ...f, nominal: formatRupiahInput(v.replace(/\D/g, '')) }))}
                        inputClassName={FLAT_INPUT_CLASS}
                    />
                    <TextField
                        label="Tgl Reimburse"
                        htmlFor="tanggal_reimburse"
                        required
                        type="date"
                        value={form.tanggal_reimburse}
                        onChange={(v) => setForm((f) => ({ ...f, tanggal_reimburse: v }))}
                        inputClassName={FLAT_INPUT_CLASS}
                    />
                    <SelectField
                        label="Metode Bayar"
                        htmlFor="metode_bayar"
                        required
                        placeholder="Pilih Metode Bayar"
                        value={form.metode_bayar}
                        onValueChange={(v) => setForm((f) => ({ ...f, metode_bayar: v as ReimburseEntry['metode_bayar'] }))}
                        options={METODE_OPTIONS}
                        inputClassName={FLAT_INPUT_CLASS}
                    />
                    <div className="col-span-2">
                        <FileUploadField
                            label="Upload Bukti"
                            required
                            file={form.bukti}
                            onSelect={(f) => setForm((current) => ({ ...current, bukti: f }))}
                            onRemove={() => setForm((current) => ({ ...current, bukti: null }))}
                            accept="image/*,.pdf"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Batal
                    </Button>
                    <Button onClick={save} disabled={!canSave}>
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
