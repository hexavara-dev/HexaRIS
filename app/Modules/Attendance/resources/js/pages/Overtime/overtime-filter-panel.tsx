import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { type OvertimeStatus } from './overtime-data';

export type OvertimePeriod = 'last7' | 'last30' | 'custom';

export interface OvertimeFilterValue {
    organization: string;
    statuses: OvertimeStatus[];
    period: OvertimePeriod;
    from: string;
    to: string;
}

export const defaultOvertimeFilter: OvertimeFilterValue = {
    organization: 'all',
    statuses: [],
    period: 'custom',
    from: '',
    to: '',
};

const statusOptions: { value: OvertimeStatus; label: string }[] = [
    { value: 'Menunggu', label: 'Sedang Menunggu' },
    { value: 'Disetujui', label: 'Diterima' },
    { value: 'Ditolak', label: 'Ditolak' },
];

const periodOptions: { value: OvertimePeriod; label: string }[] = [
    { value: 'last7', label: '7 Hari Terakhir' },
    { value: 'last30', label: '30 Hari Terakhir' },
    { value: 'custom', label: 'Pilih Tgl Pengajuan Sendiri' },
];

export function OvertimeFilterPanel({
    value,
    organizations,
    onApply,
}: {
    value: OvertimeFilterValue;
    organizations: string[];
    onApply: (value: OvertimeFilterValue) => void;
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<OvertimeFilterValue>(value);

    const handleOpenChange = (next: boolean) => {
        // Reset the draft to the applied value every time the panel opens, so unapplied edits don't stick.
        if (next) setDraft(value);
        setOpen(next);
    };

    const toggleStatus = (status: OvertimeStatus) => {
        setDraft((current) => ({
            ...current,
            statuses: current.statuses.includes(status) ? current.statuses.filter((item) => item !== status) : [...current.statuses, status],
        }));
    };

    const apply = () => {
        onApply(draft);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-md border-[#E3E8EF] bg-white hover:bg-[#F8FAFC]"
                    aria-label="Filter lembur"
                >
                    <SlidersHorizontal className="size-4 text-[#374151]" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="left"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="font-poppins max-h-[var(--radix-popover-content-available-height)] w-[300px] overflow-y-auto rounded-2xl p-0 shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
            >
                <div className="flex items-center justify-between border-b border-[#E7E7E7] px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">Filter</p>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Tutup filter" className="text-[#6B7280] hover:text-[#111827]">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-5 px-5 py-4">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-[#111827]">Organisasi</p>
                        <Select value={draft.organization} onValueChange={(organization) => setDraft({ ...draft, organization })}>
                            <SelectTrigger className="h-10 w-full text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Organisasi</SelectItem>
                                {organizations.map((organization) => (
                                    <SelectItem key={organization} value={organization}>
                                        {organization}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-[#111827]">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => {
                                const active = draft.statuses.includes(status.value);
                                return (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => toggleStatus(status.value)}
                                        aria-pressed={active}
                                        className={cn(
                                            'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                                            active ? 'border-[#1980C0] bg-[#F0F7FC] text-[#1980C0]' : 'border-[#E5E7EB] text-[#9CA3AF] hover:bg-[#F9FAFB]',
                                        )}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-[#111827]">Periode</p>
                        <RadioGroup
                            value={draft.period}
                            onValueChange={(period) => setDraft({ ...draft, period: period as OvertimePeriod })}
                            className="gap-3"
                        >
                            {periodOptions.map((option) => (
                                <div key={option.value} className="flex items-center justify-between">
                                    <Label htmlFor={`overtime-period-${option.value}`} className="text-xs font-normal text-[#374151]">
                                        {option.label}
                                    </Label>
                                    <RadioGroupItem id={`overtime-period-${option.value}`} value={option.value} />
                                </div>
                            ))}
                        </RadioGroup>

                        {draft.period === 'custom' && (
                            <div className="mt-1 grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="overtime-filter-from" className="text-xs font-normal text-[#6B7280]">
                                        Dari Tgl
                                    </Label>
                                    <Input
                                        id="overtime-filter-from"
                                        type="date"
                                        value={draft.from}
                                        onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="overtime-filter-to" className="text-xs font-normal text-[#6B7280]">
                                        Sampai Tgl
                                    </Label>
                                    <Input id="overtime-filter-to" type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5">
                    <Button className="h-11 w-full bg-[#1980C0] text-sm text-white hover:bg-[#1570AA]" onClick={apply}>
                        Terapkan Filter
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
