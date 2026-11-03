import { SearchableMultiSelect, type SelectOption } from '@/components/searchable-multi-select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FOREVER, FOREVER_END } from './schedule-data';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: SelectOption[];
    schedules: SelectOption[];
    onSave: (employeeIds: number[], scheduleId: number, start: Date, end: Date) => void;
}

const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });

export function DateField({
    label,
    value,
    onChange,
    allowForever = false,
}: {
    label: string;
    value?: Date | typeof FOREVER;
    onChange: (date?: Date | typeof FOREVER) => void;
    allowForever?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex-1 space-y-1.5">
            <Label className="text-sm font-semibold">
                {label} <span className="text-red-500">*</span>
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-10 w-full justify-start gap-2 rounded-xl px-3 font-normal">
                        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                        {value === FOREVER ? 'Seterusnya' : value ? formatDate(value) : <span className="text-muted-foreground">00/00/00</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="pointer-events-auto z-[60] w-auto p-0"
                    onFocusOutside={(event) => event.preventDefault()}
                >
                    <Calendar
                        mode="single"
                        selected={value === FOREVER ? undefined : value}
                        defaultMonth={value === FOREVER ? undefined : value}
                        onSelect={(date) => {
                            onChange(date);
                            setOpen(false);
                        }}
                    />
                    {allowForever && (
                        <div className="border-t p-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    onChange(FOREVER);
                                    setOpen(false);
                                }}
                            >
                                Seterusnya
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function AssignScheduleDialog({ open, onOpenChange, employees, schedules, onSave }: Props) {
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [employeesOpen, setEmployeesOpen] = useState(false);
    const [schedule, setSchedule] = useState('');
    const [start, setStart] = useState<Date>();
    const [end, setEnd] = useState<Date | typeof FOREVER>();

    const canSave = selectedEmployees.length > 0 && schedule !== '' && start && end && (end === FOREVER || end >= start);

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setSelectedEmployees([]);
            setSchedule('');
            setStart(undefined);
            setEnd(undefined);
        }
    };

    const save = () => {
        if (!start || !end) return;
        onSave(selectedEmployees.map(Number), Number(schedule), start, end === FOREVER ? FOREVER_END : end);
        toast.success(`Jadwal ditetapkan untuk ${selectedEmployees.length} karyawan`);
        close(false);
    };

    const labelOf = (value: string) => employees.find((e) => e.value === value)?.label ?? value;

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="font-poppins gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-base">Assign Jadwal</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">
                            Karyawan <span className="text-red-500">*</span>
                        </Label>
                        <Popover open={employeesOpen} onOpenChange={setEmployeesOpen}>
                            <PopoverTrigger asChild>
                                <div
                                    role="combobox"
                                    aria-expanded={employeesOpen}
                                    tabIndex={0}
                                    className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm"
                                >
                                    {selectedEmployees.map((value) => (
                                        <span key={value} className="flex items-center gap-2 rounded bg-muted px-2 py-1">
                                            {labelOf(value)}
                                            <button
                                                type="button"
                                                aria-label={`Hapus ${labelOf(value)}`}
                                                className="cursor-pointer"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedEmployees((prev) => prev.filter((v) => v !== value));
                                                }}
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                    {selectedEmployees.length === 0 && <span className="text-muted-foreground">Masukkan Karyawan</span>}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                className="pointer-events-auto z-[60] w-(--radix-popover-trigger-width) p-2"
                                onFocusOutside={(event) => event.preventDefault()}
                            >
                                <SearchableMultiSelect
                                    options={employees}
                                    value={selectedEmployees}
                                    onChange={setSelectedEmployees}
                                    placeholder="Cari"
                                    emptyMessage="Karyawan tidak ditemukan"
                                />
                            </PopoverContent>
                        </Popover>
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

                <div className="flex gap-4 border-t px-6 py-4">
                    <Button type="button" variant="outline" className="flex-1 border-primary text-primary" onClick={() => close(false)}>
                        Batal
                    </Button>
                    <Button type="button" className="flex-1" disabled={!canSave} onClick={save}>
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
