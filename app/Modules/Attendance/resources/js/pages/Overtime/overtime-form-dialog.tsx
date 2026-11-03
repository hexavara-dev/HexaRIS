import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useState } from 'react';
import { type OvertimeRequest, overtimeHourlyRate, overtimeRequests } from './overtime-data';

const employees = [...new Set(overtimeRequests.map((request) => request.name))];

// An end earlier than the start is an overnight shift (22:00 to 01:00 = 3 hours). Equal times mean no duration, so they are invalid.
function durationHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let minutes = endH * 60 + endM - (startH * 60 + startM);
    if (minutes < 0) minutes += 24 * 60;
    return Math.round((minutes / 60) * 10) / 10;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export type OvertimeFormValues = {
    name: string;
    requestedAt: string;
    startTime: string;
    endTime: string;
    hours: number;
    cost: number;
    reason: string;
};

function OvertimeForm({
    request,
    onClose,
    onSubmit,
}: {
    request?: OvertimeRequest;
    onClose: () => void;
    onSubmit: (values: OvertimeFormValues) => void;
}) {
    // Editing prefills from the row; the date stays as its saved text until a new day is picked.
    const editing = request !== undefined;
    const [employee, setEmployee] = useState(request?.name ?? '');
    const [date, setDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState(request?.startTime ?? '');
    const [endTime, setEndTime] = useState(request?.endTime ?? '');
    const [reason, setReason] = useState(request?.reason ?? '');
    const [dateOpen, setDateOpen] = useState(false);

    const hours = durationHours(startTime, endTime);
    const hasDate = date !== undefined || editing;
    const canSave = employee !== '' && hasDate && hours > 0 && reason.trim() !== '';

    const submit = () => {
        onSubmit({
            name: employee,
            requestedAt: date
                ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : (request?.requestedAt ?? ''),
            startTime,
            endTime,
            hours,
            cost: Math.round(hours * overtimeHourlyRate),
            reason: reason.trim(),
        });
    };

    return (
        <>
            <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">
                <DialogTitle className="text-base font-semibold text-[#111827]">{editing ? 'Edit Lembur' : 'Tambah Lembur'}</DialogTitle>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-normal text-[#374151]">
                        Nama Karyawan <span className="text-[#E84A39]">*</span>
                    </Label>
                    <Select value={employee} onValueChange={setEmployee}>
                        <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Pilih Karyawan" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-normal text-[#374151]">
                        Tgl Pengajuan <span className="text-[#E84A39]">*</span>
                    </Label>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="h-10 justify-start gap-2 px-3 text-left text-sm font-normal text-[#374151]">
                                <CalendarIcon className="size-4 shrink-0 text-[#6B7280]" />
                                {date ? (
                                    formatDate(date)
                                ) : editing ? (
                                    request.requestedAt
                                ) : (
                                    <span className="text-[#9CA3AF]">00/00/0000</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="z-[60] w-auto p-0"
                            // The Dialog's focus trap would otherwise pull focus out of the portaled popover and close it.
                            onFocusOutside={(event) => event.preventDefault()}
                        >
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(day) => {
                                    setDate(day);
                                    if (day) setDateOpen(false);
                                }}
                                defaultMonth={date}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="overtime-start" className="text-sm font-normal text-[#374151]">
                            Dari Jam <span className="text-[#E84A39]">*</span>
                        </Label>
                        <div className="relative">
                            <Clock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B7280]" />
                            <Input id="overtime-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="pl-9" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="overtime-end" className="text-sm font-normal text-[#374151]">
                            Sampai Jam <span className="text-[#E84A39]">*</span>
                        </Label>
                        <div className="relative">
                            <Clock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B7280]" />
                            <Input id="overtime-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="pl-9" />
                        </div>
                    </div>
                </div>

                <div className="-mt-2 flex items-center justify-between text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {`${hours} jam`}
                    </span>
                    <span>{`Est. Biaya Rp ${Math.round(hours * overtimeHourlyRate).toLocaleString('id-ID')}`}</span>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="overtime-reason" className="text-sm font-normal text-[#374151]">
                        Alasan <span className="text-[#E84A39]">*</span>
                    </Label>
                    <Textarea
                        id="overtime-reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Masukkan Alasan"
                        className="min-h-24 resize-none"
                    />
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pb-6">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-[#1980C0] text-sm text-[#1980C0] hover:bg-[#F0F7FC] hover:text-[#1980C0]"
                    onClick={onClose}
                >
                    Batal
                </Button>
                <Button type="button" className="h-11 bg-[#1980C0] text-sm text-white hover:bg-[#1570AA]" disabled={!canSave} onClick={submit}>
                    Simpan
                </Button>
            </div>
        </>
    );
}

// Without `request` the dialog creates a new lembur; with one it edits that row.
export function OvertimeFormDialog({
    open,
    request,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    request?: OvertimeRequest;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: OvertimeFormValues) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)] sm:max-w-xl">
                <OvertimeForm request={request} onClose={() => onOpenChange(false)} onSubmit={onSubmit} />
            </DialogContent>
        </Dialog>
    );
}
