import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { period } from '@/data/Payroll/period';
import { cn } from '@/lib/utils';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { deductionTotal, formatCurrency, formatDate, STATUS_COLOR, STATUS_LABEL, thp, totalEarnings, type RecomputedPayrollRow } from '../lib/payroll-row';

const PAYMENT_METHODS = ['Tunai', 'Transfer Bank'];

/** Shared numeric-parsing for editable amount fields — strips non-digits, defaults to 0. */
const toNumber = (value: string): number => Number(value.replace(/\D/g, '')) || 0;

interface EditableFields {
    period_id: string;
    status: PayrollStatus;
    payment_date: string;
    payment_method: string;
    base_salary: string;
    position_allowance: string;
    meal_allowance: string;
    transport_allowance: string;
    overtime: string;
    alpha: string;
    late: string;
    bpjs_health: string;
    bpjs_employment: string;
    pph21: string;
}

function toEditableFields(row: RecomputedPayrollRow): EditableFields {
    return {
        period_id: row.period_id,
        status: row.status,
        payment_date: row.payment_date ?? '',
        payment_method: row.payment_method ?? '',
        base_salary: String(row.base_salary),
        position_allowance: String(row.earnings.position_allowance),
        meal_allowance: String(row.earnings.meal_allowance),
        transport_allowance: String(row.earnings.transport_allowance),
        overtime: String(row.earnings.overtime),
        alpha: String(row.deductions.alpha),
        late: String(row.deductions.late),
        bpjs_health: String(row.deductions.bpjs_health),
        bpjs_employment: String(row.deductions.bpjs_employment),
        pph21: String(row.deductions.pph21),
    };
}

function toPatch(fields: EditableFields): Partial<PayrollEntry> {
    return {
        period_id: fields.period_id,
        status: fields.status,
        payment_date: fields.payment_date || null,
        payment_method: fields.payment_method || null,
        base_salary: toNumber(fields.base_salary),
        earnings: {
            position_allowance: toNumber(fields.position_allowance),
            meal_allowance: toNumber(fields.meal_allowance),
            transport_allowance: toNumber(fields.transport_allowance),
            overtime: toNumber(fields.overtime),
        },
        deductions: {
            alpha: toNumber(fields.alpha),
            late: toNumber(fields.late),
            bpjs_health: toNumber(fields.bpjs_health),
            bpjs_employment: toNumber(fields.bpjs_employment),
            pph21: toNumber(fields.pph21),
        },
    };
}

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function FieldRowView({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            <p className="font-poppins text-xs text-black">{value ?? '-'}</p>
        </div>
    );
}

function FieldRowEdit({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            {children}
        </div>
    );
}

function SalarySectionView({
    title,
    items,
    total,
    totalLabel,
}: {
    title: string;
    items: { label: string; amount: number }[];
    total: number;
    totalLabel: string;
}) {
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

function SalarySectionEdit({
    title,
    rows,
    fields,
    setField,
}: {
    title: string;
    rows: { label: string; key: keyof EditableFields }[];
    fields: EditableFields;
    setField: <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => void;
}) {
    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className="font-poppins text-xs font-semibold text-[#1A8215]">{title}</p>
            <div className="flex w-full flex-col items-start gap-1.5">
                {rows.map((row) => (
                    <div key={row.key} className="flex w-full items-center justify-between py-1">
                        <p className="font-poppins text-xs text-[#8F8F8F]">{row.label}</p>
                        <Input
                            value={fields[row.key]}
                            onChange={(e) => setField(row.key, e.target.value.replace(/\D/g, ''))}
                            className="h-7 w-32 border-[#E7E7E7] text-right text-xs"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

interface PayrollDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: RecomputedPayrollRow | null;
    onSaved: (entryId: string, patch: Partial<PayrollEntry>) => void;
    initialMode: 'view' | 'edit';
}

export function PayrollDetailDialog({ open, onOpenChange, row, onSaved, initialMode }: PayrollDetailDialogProps) {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [fields, setFields] = useState<EditableFields | null>(null);

    useEffect(() => {
        if (row) {
            setFields(toEditableFields(row));
            setMode(initialMode);
        }
    }, [row, initialMode]);

    if (!row || !fields) return null;

    const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
        setFields((current) => (current ? { ...current, [key]: value } : current));

    const earningsView = [
        { label: 'Gaji Pokok', amount: row.base_salary },
        ...row.allowance_items.map((item) => ({ label: item.nama, amount: item.nominal })),
        { label: 'Lembur', amount: row.earnings.overtime },
    ];
    const deductionsView = [
        { label: 'Alpha', amount: row.deductions.alpha },
        { label: 'Terlambat', amount: row.deductions.late },
        { label: 'BPJS Kesehatan', amount: row.deductions.bpjs_health },
        { label: 'BPJS Ketenagakerjaan', amount: row.deductions.bpjs_employment },
        { label: 'PPh 21', amount: row.deductions.pph21 },
    ];
    // View mode shows the saved, authoritative `row`; edit mode overlays the live `base_salary` draft
    // onto `row` so GAJI BERSIH (THP) updates immediately as it's typed instead of only after Simpan.
    // Every other earnings/deductions field is read-only in edit mode (settings-driven), so it's
    // sourced straight from `row` either way.
    const totalsSource = mode === 'view' ? row : { ...row, base_salary: toNumber(fields.base_salary) };
    const totalEarningsView = totalEarnings(totalsSource);
    const totalDeductionsView = deductionTotal(totalsSource);
    const netSalary = thp(totalsSource);

    const save = () => {
        onSaved(row.id, toPatch(fields));
        toast.success('Berhasil Disimpan');
        setMode('view');
    };

    // Browsers use `document.title` as the suggested print/save-as-PDF filename, so we swap it in
    // just for the print dialog and restore it once printing finishes (or is cancelled).
    const printSlip = () => {
        const originalTitle = document.title;
        document.title = `${row.employee_number}-${row.full_name}`;
        const restoreTitle = () => {
            document.title = originalTitle;
            window.removeEventListener('afterprint', restoreTitle);
        };
        window.addEventListener('afterprint', restoreTitle);
        window.print();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)] print:hidden"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <div className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                            <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Detail Gaji</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
                            <div className="flex flex-col gap-5">
                                <div className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start">
                                        <p className="font-poppins text-base font-semibold text-[#1E293B]">{row.full_name}</p>
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-poppins text-xs text-[#64748B]">{row.position_title}</p>
                                            <span className="h-1 w-1 rounded-full bg-[#64748B]" />
                                            <p className="font-poppins text-xs text-[#64748B]">{row.employee_number}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col items-start gap-2.5">
                                    {mode === 'view' ? (
                                        <>
                                            <FieldRowView label="Periode" value={period.find((p) => p.id === fields.period_id)?.label} />
                                            <FieldRowView label="Status" value={STATUS_LABEL[fields.status]} />
                                            <FieldRowView
                                                label="Tanggal Bayar"
                                                value={fields.payment_date ? formatDate(fields.payment_date) : undefined}
                                            />
                                            <FieldRowView label="Metode Bayar" value={fields.payment_method || undefined} />
                                        </>
                                    ) : (
                                        <>
                                            {/* Periode stays read-only even in edit mode: it is the second half of this entry's
                                                `payroll-<employee_number>-<period_id>` id, and letting it change here could move
                                                an entry into a period that already has one for the same employee, double-counting
                                                them in the KPI cards on Index.tsx. */}
                                            <FieldRowView label="Periode" value={period.find((p) => p.id === fields.period_id)?.label} />
                                            <FieldRowEdit label="Status">
                                                <Select value={fields.status} onValueChange={(value) => setField('status', value as PayrollStatus)}>
                                                    <SelectTrigger className={cn('h-7 w-fit border-[#E7E7E7] text-xs', STATUS_COLOR[fields.status])}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(Object.keys(STATUS_LABEL) as PayrollStatus[]).map((status) => (
                                                            <SelectItem key={status} value={status} className={STATUS_COLOR[status]}>
                                                                {STATUS_LABEL[status]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldRowEdit>
                                            <FieldRowEdit label="Tanggal Bayar">
                                                <Input
                                                    type="date"
                                                    value={fields.payment_date}
                                                    onChange={(e) => setField('payment_date', e.target.value)}
                                                    className="h-7 w-fit border-[#E7E7E7] text-xs"
                                                />
                                            </FieldRowEdit>
                                            <FieldRowEdit label="Metode Bayar">
                                                <Select value={fields.payment_method || undefined} onValueChange={(value) => setField('payment_method', value)}>
                                                    <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                                        <SelectValue placeholder="Pilih" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAYMENT_METHODS.map((m) => (
                                                            <SelectItem key={m} value={m}>
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldRowEdit>
                                        </>
                                    )}
                                </div>

                                <Separator className="bg-[#E2E8F0]" />

                                {mode === 'view' ? (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        <SalarySectionView title="PENDAPATAN" items={earningsView} total={totalEarningsView} totalLabel="Total Pendapatan" />
                                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                                    </div>
                                ) : (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        {/* Only Gaji Pokok stays editable per employee here — every other PENDAPATAN/POTONGAN
                                            line is now settings-driven (see Pengaturan Gaji) and would silently revert on
                                            next render if edited here, so it's read-only instead of misleadingly editable. */}
                                        <SalarySectionEdit title="PENDAPATAN" rows={[{ label: 'Gaji Pokok', key: 'base_salary' }]} fields={fields} setField={setField} />
                                        <SalarySectionView title="" items={earningsView.slice(1)} total={totalEarningsView} totalLabel="Total Pendapatan" />
                                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                                    </div>
                                )}

                                <Separator className="bg-[#E2E8F0]" />

                                <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#E0F2FE] p-3.5">
                                    <p className="font-poppins text-[11px] font-semibold text-[#1980C0]">GAJI BERSIH (THP)</p>
                                    <p className="font-poppins text-lg font-extrabold text-[#1980C0]">{formatCurrency(netSalary)}</p>
                                </div>
                            </div>

                            {mode === 'view' ? (
                                <div className="flex w-full items-start gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setMode('edit')}
                                        className="font-poppins h-10 w-full cursor-pointer rounded-[10px] border border-[#1980C0] text-xs font-semibold text-[#1980C0]"
                                    >
                                        Edit Slip Gaji
                                    </button>
                                    <button
                                        type="button"
                                        onClick={printSlip}
                                        className="font-poppins h-10 w-full cursor-pointer rounded-[10px] bg-[#1980C0] text-xs font-bold text-white"
                                    >
                                        Cetak Slip Gaji
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={save}
                                    className="font-poppins h-10 w-full cursor-pointer rounded-[10px] bg-[#1980C0] text-xs font-bold text-white"
                                >
                                    Simpan
                                </button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {createPortal(
                <div className="hidden print:block p-6">
                    <div className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <p className="font-poppins text-base font-semibold text-[#1E293B]">{row.full_name}</p>
                            <div className="flex items-center gap-1.5">
                                <p className="font-poppins text-xs text-[#64748B]">{row.position_title}</p>
                                <span className="h-1 w-1 rounded-full bg-[#64748B]" />
                                <p className="font-poppins text-xs text-[#64748B]">{row.employee_number}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 flex w-full flex-col items-start gap-[18px]">
                        <SalarySectionView title="PENDAPATAN" items={earningsView} total={totalEarningsView} totalLabel="Total Pendapatan" />
                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                    </div>
                    <div className="mt-5 flex w-full flex-col items-center gap-1 rounded-xl bg-[#E0F2FE] p-3.5">
                        <p className="font-poppins text-[11px] font-semibold text-[#1980C0]">GAJI BERSIH (THP)</p>
                        <p className="font-poppins text-lg font-extrabold text-[#1980C0]">{formatCurrency(netSalary)}</p>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
