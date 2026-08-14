import { SelectField, TextField } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createAllowance, updateAllowance } from '../../lib/payroll-settings-storage';

const PERIODE_OPTIONS = [
    { value: 'bulanan', label: 'Bulanan' },
    { value: 'harian', label: 'Harian' },
    { value: 'tahunan', label: 'Tahunan' },
];

function formatRupiahInput(digits: string): string {
    if (!digits) return '';
    return `Rp. ${Number(digits).toLocaleString('id-ID')}`;
}

interface FormState {
    nama: string;
    nominal: string;
    periode: PayrollAllowance['periode'];
}

const EMPTY_FORM: FormState = { nama: '', nominal: '', periode: 'bulanan' };

function toFormState(target: PayrollAllowance | null): FormState {
    if (!target) return EMPTY_FORM;
    return { nama: target.nama, nominal: formatRupiahInput(String(target.nominal)), periode: target.periode };
}

interface TunjanganFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: PayrollAllowance | null;
    onSaved: () => void;
}

export function TunjanganFormDialog({ open, onOpenChange, target, onSaved }: TunjanganFormDialogProps) {
    const [form, setForm] = useState<FormState>(() => toFormState(target));

    useEffect(() => {
        if (open) setForm(toFormState(target));
    }, [open, target]);

    const save = () => {
        const nominal = Number(form.nominal.replace(/\D/g, '')) || 0;
        if (target) {
            // Status isn't editable here — it's toggled from the row's action menu — so aktif is
            // left out of the patch and the existing value is preserved untouched.
            updateAllowance(target.id, { nama: form.nama, nominal, periode: form.periode });
        } else {
            createAllowance({ nama: form.nama, nominal, periode: form.periode, aktif: true });
        }
        toast.success('Berhasil Disimpan');
        onSaved();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">
                        {target ? 'Edit Tunjangan' : 'Tambah Tunjangan'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <TextField label="Nama Tunjangan" htmlFor="nama" required value={form.nama} onChange={(v) => setForm((f) => ({ ...f, nama: v }))} />
                    <TextField
                        label="Nominal"
                        htmlFor="nominal"
                        required
                        value={form.nominal}
                        onChange={(v) => setForm((f) => ({ ...f, nominal: formatRupiahInput(v.replace(/\D/g, '')) }))}
                        placeholder="Rp. 0"
                    />
                    <SelectField
                        label="Periode"
                        htmlFor="periode"
                        required
                        value={form.periode}
                        onValueChange={(v) => setForm((f) => ({ ...f, periode: v as PayrollAllowance['periode'] }))}
                        options={PERIODE_OPTIONS}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={save} disabled={!form.nama.trim()}>
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
