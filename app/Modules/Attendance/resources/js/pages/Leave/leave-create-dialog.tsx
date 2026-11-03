import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, FileText, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { type LeaveRequest, leaveRequests, type LeaveType } from './leave-data';

const employees = [...new Set(leaveRequests.map((request) => request.name))];

const typeOptions: LeaveType[] = ['Cuti', 'Izin'];

function formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export type LeaveFormValues = {
    name: string;
    type: LeaveType;
    period: string;
    days: number;
    reason: string;
};

function LeaveCreateForm({
    request,
    onClose,
    onSubmit,
}: {
    request?: LeaveRequest;
    onClose: () => void;
    onSubmit: (values: LeaveFormValues) => void;
}) {
    // Editing prefills from the row; the period stays as its saved text until a new range is picked.
    const editing = request !== undefined;
    const [employee, setEmployee] = useState(request?.name ?? '');
    const [type, setType] = useState<LeaveType | ''>(request?.type ?? '');
    const [period, setPeriod] = useState<DateRange | undefined>();
    const [reason, setReason] = useState(request?.reason ?? '');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [periodOpen, setPeriodOpen] = useState(false);

    const hasPeriod = (period?.from !== undefined && period?.to !== undefined) || editing;
    const canSave =
        employee !== '' &&
        type !== '' &&
        hasPeriod &&
        reason.trim() !== '' &&
        (type !== 'Izin' || attachment !== null || editing);

    const submit = () => {
        const { from, to } = period ?? {};
        const picked = from !== undefined && to !== undefined;
        onSubmit({
            name: employee,
            type: type as LeaveType,
            period: picked ? `${formatDate(from)} - ${formatDate(to)}` : (request?.period ?? ''),
            days: picked ? Math.round((to.getTime() - from.getTime()) / 86400000) + 1 : (request?.days ?? 0),
            reason: reason.trim(),
        });
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInput.current) fileInput.current.value = '';
    };

    return (
        <>
            <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">
                <DialogTitle className="text-base font-semibold text-[#111827]">{editing ? 'Edit Izin/Cuti' : 'Tambah Izin/Cuti'}</DialogTitle>
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

                <RadioGroup
                    value={type}
                    onValueChange={(value) => {
                        setType(value as LeaveType);
                        if (value === 'Cuti') setAttachment(null);
                    }}
                    className="grid grid-cols-2 gap-3"
                >
                    {typeOptions.map((option) => {
                        const selected = type === option;
                        return (
                            <Label
                                key={option}
                                htmlFor={`leave-type-${option}`}
                                className={cn(
                                    'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm font-normal',
                                    selected ? 'border-[#1980C0] bg-[#F0F7FC] text-[#1980C0]' : 'border-[#E5E7EB] text-[#374151]',
                                )}
                            >
                                {option}
                                <RadioGroupItem id={`leave-type-${option}`} value={option} />
                            </Label>
                        );
                    })}
                </RadioGroup>

                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-normal text-[#374151]">
                        Periode <span className="text-[#E84A39]">*</span>
                    </Label>
                    <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 justify-start gap-2 px-3 text-left text-sm font-normal text-[#374151]"
                            >
                                <CalendarIcon className="size-4 shrink-0 text-[#6B7280]" />
                                {period?.from && period?.to ? (
                                    `${formatDate(period.from)} - ${formatDate(period.to)}`
                                ) : editing ? (
                                    request.period
                                ) : (
                                    <span className="text-[#9CA3AF]">00/00/00 - 00/00/00</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="pointer-events-auto z-[60] w-auto p-0"
                            onFocusOutside={(event) => event.preventDefault()}
                        >
                            <Calendar
                                mode="range"
                                numberOfMonths={2}
                                selected={period}
                                onSelect={(range) => {
                                    setPeriod(range);
                                    // Close once both ends are picked; the first click only sets the start.
                                    if (range?.from && range?.to) setPeriodOpen(false);
                                }}
                                defaultMonth={period?.from}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {type === 'Izin' && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="leave-attachment" className="text-sm font-normal text-[#374151]">
                            Upload File Pendukung <span className="text-[#E84A39]">*</span>
                        </Label>
                        <div className="rounded-xl border border-dashed border-[#C7D2E0] p-4">
                            {attachment ? (
                                <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#FEF2F1]">
                                        <FileText className="size-5 text-[#E84A39]" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-[#111827]">{attachment.name}</p>
                                        <p className="text-xs text-[#6B7280]">{`${(attachment.size / 1024 / 1024).toFixed(1)} Mb`}</p>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Hapus file" onClick={removeAttachment}>
                                        <Trash2 className="size-4 text-[#6B7280]" />
                                    </Button>
                                </div>
                            ) : (
                                <Label
                                    htmlFor="leave-attachment"
                                    className="flex cursor-pointer flex-col items-center gap-2 py-4 text-sm font-normal text-[#6B7280]"
                                >
                                    <Upload className="size-5 text-[#1980C0]" />
                                    <span>Klik untuk upload (PDF, JPG, PNG)</span>
                                </Label>
                            )}
                            <Input
                                id="leave-attachment"
                                ref={fileInput}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <Label htmlFor="leave-reason" className="text-sm font-normal text-[#374151]">
                        Keterangan <span className="text-[#E84A39]">*</span>
                    </Label>
                    <Textarea
                        id="leave-reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Masukkan Keterangan"
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
                <Button
                    type="button"
                    className="h-11 bg-[#1980C0] text-sm text-white hover:bg-[#1570AA]"
                    disabled={!canSave}
                    onClick={submit}
                >
                    Simpan
                </Button>
            </div>
        </>
    );
}

// Without `request` the dialog creates a new pengajuan; with one it edits that row.
export function LeaveCreateDialog({
    open,
    request,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    request?: LeaveRequest;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: LeaveFormValues) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)] sm:max-w-xl">
                <LeaveCreateForm request={request} onClose={() => onOpenChange(false)} onSubmit={onSubmit} />
            </DialogContent>
        </Dialog>
    );
}
