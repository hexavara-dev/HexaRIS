import { type SelectOption } from '@/components/searchable-multi-select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateField } from './assign-schedule-dialog';
import { FOREVER, FOREVER_END, JADWAL, type Employee, avatarTone, initials, toIsoDate } from './schedule-data';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee;
    schedules: SelectOption[];
    initial: { scheduleId: number; start: Date; end: Date };
    onSave: (scheduleId: number, start: Date, end: Date) => void;
    onDelete: () => void;
}

export function EditAssignScheduleDialog({ open, onOpenChange, employee, schedules, initial, onSave, onDelete }: Props) {
    const [schedule, setSchedule] = useState(String(initial.scheduleId));
    const [start, setStart] = useState<Date | undefined>(initial.start);
    const [end, setEnd] = useState<Date | typeof FOREVER | undefined>(toIsoDate(initial.end) === toIsoDate(FOREVER_END) ? FOREVER : initial.end);

    const canSave = schedule !== '' && start && end && (end === FOREVER || end >= start);

    const save = () => {
        if (!start || !end) return;
        onSave(Number(schedule), start, end === FOREVER ? FOREVER_END : end);
        toast.success(`Jadwal ${employee.name} diperbarui`);
    };

    const [confirmOpen, setConfirmOpen] = useState(false);

    // The range of the block being deleted, from the original data rather than the form.
    const fmt = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const blockEnd = toIsoDate(initial.end) === toIsoDate(FOREVER_END) ? 'Seterusnya' : fmt(initial.end);
    const rangeLabel = `${fmt(initial.start)} – ${blockEnd}`;
    const jadwalTitle = JADWAL.find((j) => j.id === initial.scheduleId)?.title;

    const remove = () => {
        setConfirmOpen(false);
        onDelete();
        toast.success(`Jadwal ${employee.name} dihapus`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
                <DialogHeader className="flex-row items-center justify-between border-b px-6 py-4 pr-12">
                    <DialogTitle className="text-base">Edit Assign Jadwal</DialogTitle>
                    <Button type="button" variant="ghost" size="icon" aria-label="Hapus jadwal" className="text-red-500 hover:text-red-600" onClick={() => setConfirmOpen(true)}>
                        <Trash2 className="size-4" />
                    </Button>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    <div className="flex items-center gap-3 rounded-xl border p-3">
                        <Avatar>
                            <AvatarFallback className={`font-semibold ${avatarTone(employee.id)}`}>{initials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm font-semibold">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">{employee.dept}</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">
                            Jadwal Kerja <span className="text-red-500">*</span>
                        </Label>
                        <Select value={schedule} onValueChange={setSchedule}>
                            <SelectTrigger className="h-10 w-full rounded-xl">
                                <SelectValue placeholder="Pilih Jadwal" />
                            </SelectTrigger>
                            <SelectContent className="z-[60]">
                                {schedules.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-4">
                        <DateField label="Tanggal Mulai" value={start} onChange={(date) => date !== FOREVER && setStart(date)} />
                        <DateField label="Sampai Tanggal" value={end} onChange={setEnd} allowForever />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t px-6 py-4">
                    <Button type="button" variant="outline" className="border-primary text-primary" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" disabled={!canSave} onClick={save}>
                        Simpan
                    </Button>
                </div>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
                        <DialogHeader className="space-y-2 px-6 pt-6 pb-4">
                            <DialogTitle className="text-base">Hapus Jadwal?</DialogTitle>
                            <DialogDescription className="text-sm">
                                Anda akan menghapus jadwal {jadwalTitle} pada rentang{' '}
                                <span className="font-bold text-foreground">{rangeLabel}</span>. Tindakan ini tidak dapat dibatalkan dan seluruh informasi
                                terkait akan dihilangkan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 border-t px-6 py-4">
                            <Button type="button" variant="outline" className="border-primary text-primary" onClick={() => setConfirmOpen(false)}>
                                Batal
                            </Button>
                            <Button type="button" onClick={remove}>
                                Hapus
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
