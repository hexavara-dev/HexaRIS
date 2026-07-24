import { Calendar, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export interface SalaryLineItem {
    label: string;
    amount: number;
}

interface DialogSalaryDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    employee: {
        name: string;
        role: string;
        employeeId: string;
        avatarUrl?: string;
    };
    period?: string;
    onPeriodClick?: () => void;
    status?: string;
    onStatusClick?: () => void;
    paymentDate?: string;
    onPaymentDateClick?: () => void;
    paymentMethod?: string;
    onPaymentMethodClick?: () => void;
    earnings: SalaryLineItem[];
    deductions: SalaryLineItem[];
    onEditSlip?: () => void;
    onPrintSlip?: () => void;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function FieldRow({
    label,
    value,
    placeholder,
    icon,
    onClick,
}: {
    label: string;
    value?: string;
    placeholder: string;
    icon: ReactNode;
    onClick?: () => void;
}) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            <button
                type="button"
                onClick={onClick}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E7E7E7] px-2 py-1 text-nowrap"
            >
                <span className="font-poppins w-[61px] text-left text-xs text-black">{value ?? placeholder}</span>
                {icon}
            </button>
        </div>
    );
}

function SalarySection({ title, items, totalLabel }: { title: string; items: SalaryLineItem[]; totalLabel: string }) {
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className="font-poppins text-xs font-semibold text-[#1A8215]">{title}</p>
            <div className="flex w-full flex-col items-start gap-1.5">
                {items.map((item) => (
                    <div key={item.label} className="flex w-full items-center justify-between py-1">
                        <p className="font-poppins text-xs text-[#8F8F8F]">{item.label}</p>
                        <p className="font-poppins text-xs font-medium text-black">{formatCurrency(item.amount)}</p>
                    </div>
                ))}
                <Separator className="bg-[#E2E8F0]" />
                <div className="flex w-full items-center justify-between py-1">
                    <p className="font-poppins text-xs font-semibold text-black">{totalLabel}</p>
                    <p className="font-poppins text-[13px] font-bold text-[#1A8215]">{formatCurrency(total)}</p>
                </div>
            </div>
        </div>
    );
}

export function DialogSalaryDetail({
    open,
    onOpenChange,
    title = 'Detail Gaji',
    employee,
    period,
    onPeriodClick,
    status,
    onStatusClick,
    paymentDate,
    onPaymentDateClick,
    paymentMethod,
    onPaymentMethodClick,
    earnings,
    deductions,
    onEditSlip,
    onPrintSlip,
}: DialogSalaryDetailProps) {
    const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const netSalary = totalEarnings - totalDeductions;

    const chevron = <ChevronDown className="h-2.5 w-2.5 text-black" />;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
                    <div className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <p className="font-poppins text-base font-semibold text-[#1E293B]">{employee.name}</p>
                            <div className="flex items-center gap-1.5">
                                <p className="font-poppins text-xs text-[#64748B]">{employee.role}</p>
                                <span className="h-1 w-1 rounded-full bg-[#64748B]" />
                                <p className="font-poppins text-xs text-[#64748B]">{employee.employeeId}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2.5">
                        <FieldRow label="Periode" value={period} placeholder="Pilih" icon={chevron} onClick={onPeriodClick} />
                        <FieldRow label="Status" value={status} placeholder="Pilih" icon={chevron} onClick={onStatusClick} />
                        <FieldRow
                            label="Tanggal Bayar"
                            value={paymentDate}
                            placeholder="00-00-00"
                            icon={<Calendar className="h-2.5 w-2.5 text-black" />}
                            onClick={onPaymentDateClick}
                        />
                        <FieldRow label="Metode Bayar" value={paymentMethod} placeholder="Pilih" icon={chevron} onClick={onPaymentMethodClick} />
                    </div>

                    <Separator className="bg-[#E2E8F0]" />

                    <div className="flex w-full flex-col items-start gap-[18px]">
                        <SalarySection title="PENDAPATAN" items={earnings} totalLabel="Total Pendapatan" />
                        <SalarySection title="POTONGAN" items={deductions} totalLabel="Total Potongan" />
                    </div>

                    <Separator className="bg-[#E2E8F0]" />

                    <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#E0F2FE] p-3.5">
                        <p className="font-poppins text-[11px] font-semibold text-[#1980C0]">GAJI BERSIH (THP)</p>
                        <p className="font-poppins text-lg font-extrabold text-[#1980C0]">{formatCurrency(netSalary)}</p>
                    </div>

                    <div className="flex w-full items-start gap-2.5">
                        <button
                            type="button"
                            onClick={onEditSlip}
                            className="font-poppins h-10 w-full cursor-pointer rounded-[10px] border border-[#1980C0] text-xs font-semibold text-[#1980C0]"
                        >
                            Edit Slip Gaji
                        </button>
                        <button
                            type="button"
                            onClick={onPrintSlip}
                            className="font-poppins h-10 w-full cursor-pointer rounded-[10px] bg-[#1980C0] text-xs font-bold text-white"
                        >
                            Cetak Slip Gaji
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
