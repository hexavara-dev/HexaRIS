import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export interface WorkHourInput {
    name: string;
    start: string;
    end: string;
    color: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (value: WorkHourInput) => void;
}

const EMPTY: WorkHourInput = { name: '', start: '', end: '', color: '#1E3F76' };

export function AddWorkHourDialog({ open, onOpenChange, onSave }: Props) {
    const [form, setForm] = useState(EMPTY);

    const canSave = form.name.trim() !== '' && form.start !== '' && form.end !== '';

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) setForm(EMPTY);
    };

    const save = () => {
        onSave({ ...form, name: form.name.trim() });
        close(false);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="grid-cols-1 font-poppins gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-base">Tambah</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">
                            Judul <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Masukkan Judul"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="h-10 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Dari Jam <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="time"
                                value={form.start}
                                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Sampai Jam <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="time"
                                value={form.end}
                                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                                className="h-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">
                            Warna Indikator <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative flex h-10 items-center justify-between rounded-xl border px-3">
                            {/* Invisible picker covers the whole row, so a click anywhere opens the native color dialog. */}
                            <input
                                type="color"
                                aria-label="Pilih warna"
                                value={form.color}
                                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <span className="pointer-events-none text-sm uppercase">{form.color}</span>
                            <span className="pointer-events-none size-6 rounded-full border" style={{ backgroundColor: form.color }} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t px-6 py-4">
                    <Button type="button" variant="outline" className="border-sky-400 text-sky-500" onClick={() => close(false)}>
                        Batal
                    </Button>
                    <Button type="button" disabled={!canSave} onClick={save}>
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
