import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddWorkHourDialog, type WorkHourInput } from './add-work-hour-dialog';

interface WorkHour extends WorkHourInput {
    id: number;
}

// Mock data: work-hour templates until the schedule API exists.
const INITIAL_HOURS: WorkHour[] = [
    { id: 1, name: 'Shift Pagi', start: '08:00', end: '16:00', color: '#22C55E' },
    { id: 2, name: 'Shift Siang', start: '16:00', end: '00:00', color: '#F59E0B' },
    { id: 3, name: 'Shift Malam', start: '00:00', end: '08:00', color: '#0EA5E9' },
    { id: 4, name: 'Jam Normal', start: '16:00', end: '00:00', color: '#A855F7' },
];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingScheduleDialog({ open, onOpenChange }: Props) {
    const [hours, setHours] = useState(INITIAL_HOURS);
    const [addOpen, setAddOpen] = useState(false);
    const [dirty, setDirty] = useState(false);

    const remove = (id: number) => {
        setHours((prev) => prev.filter((h) => h.id !== id));
        setDirty(true);
    };

    const add = (value: WorkHourInput) => {
        const next = { ...value, id: Date.now() };
        setHours((prev) => [...prev, next]);
        setDirty(true);
    };

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setHours(INITIAL_HOURS);
            setDirty(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent className="font-poppins gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="text-base">Setting Jam Kerja</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2.5 px-6 py-5">
                        {hours.map((h) => (
                            <div
                                key={h.id}
                                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                                style={{ borderColor: h.color, backgroundColor: `${h.color}1A`, color: h.color }}
                            >
                                <div>
                                    <div className="text-sm font-semibold">{h.name}</div>
                                    <div className="text-xs opacity-80">
                                        {h.start} – {h.end}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    aria-label={`Hapus ${h.name}`}
                                    onClick={() => remove(h.id)}
                                    className="cursor-pointer opacity-80 hover:opacity-100"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="mt-2 w-fit justify-start gap-2 border-sky-400 px-3 text-sky-500 hover:bg-sky-50"
                            onClick={() => setAddOpen(true)}
                        >
                            <Plus className="size-4" /> Tambah Jam Kerja
                        </Button>
                    </div>

                    <div className="flex gap-4 border-t px-6 py-4">
                        <Button type="button" variant="outline" className="flex-1 border-sky-400 text-sky-500" onClick={() => close(false)}>
                            Batal
                        </Button>
                        <Button type="button" className="flex-1" disabled={!dirty}>
                            Simpan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AddWorkHourDialog open={addOpen} onOpenChange={setAddOpen} onSave={add} />
        </>
    );
}
