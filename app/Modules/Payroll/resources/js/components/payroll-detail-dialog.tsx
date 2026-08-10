import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { period } from '@/data/Payroll/period';
import { Calendar, ChevronDown } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, type PayrollRow } from '../lib/payroll-row';

const STATUS_LABEL: Record<PayrollStatus, string> = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };
const PAYMENT_METHODS = ['Tunai', 'Transfer Bank'];

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

function toEditableFields(row: PayrollRow): EditableFields {
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
    const num = (value: string) => Number(value.replace(/\D/g, '')) || 0;

    return {
        period_id: fields.period_id,
        status: fields.status,
        payment_date: fields.payment_date || null,
        payment_method: fields.payment_method || null,
        base_salary: num(fields.base_salary),
        earnings: {
            position_allowance: num(fields.position_allowance),
            meal_allowance: num(fields.meal_allowance),
            transport_allowance: num(fields.transport_allowance),
            overtime: num(fields.overtime),
        },
        deductions: {
            alpha: num(fields.alpha),
            late: num(fields.late),
            bpjs_health: num(fields.bpjs_health),
            bpjs_employment: num(fields.bpjs_employment),
            pph21: num(fields.pph21),
        },
    };
}

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function FieldRowView({ label, value, icon }: { label: string; value?: string; icon: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            <span className="flex items-center gap-2 rounded-lg border border-[#E7E7E7] px-2 py-1 text-nowrap">
                <span className="font-poppins w-[61px] text-left text-xs text-black">{value ?? 'Pilih'}</span>
                {icon}
            </span>
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
    row: PayrollRow | null;
    onSaved: (entryId: string, patch: Partial<PayrollEntry>) => void;
}

export function PayrollDetailDialog({ open, onOpenChange, row, onSaved }: PayrollDetailDialogProps) {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [fields, setFields] = useState<EditableFields | null>(null);

    useEffect(() => {
        if (row) {
            setFields(toEditableFields(row));
            setMode('view');
        }
    }, [row]);

    if (!row || !fields) return null;

    const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
        setFields((current) => (current ? { ...current, [key]: value } : current));

    const earningsView = [
        { label: 'Gaji Pokok', amount: row.base_salary },
        { label: 'Tunjangan Jabatan', amount: row.earnings.position_allowance },
        { label: 'Tunjangan Makan', amount: row.earnings.meal_allowance },
        { label: 'Tunjangan Transport', amount: row.earnings.transport_allowance },
        { label: 'Lembur', amount: row.earnings.overtime },
    ];
    const deductionsView = [
        { label: 'Alpha', amount: row.deductions.alpha },
        { label: 'Terlambat', amount: row.deductions.late },
        { label: 'BPJS Kesehatan', amount: row.deductions.bpjs_health },
        { label: 'BPJS Ketenagakerjaan', amount: row.deductions.bpjs_employment },
        { label: 'PPh 21', amount: row.deductions.pph21 },
    ];
    const totalEarningsView = earningsView.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductionsView = deductionsView.reduce((sum, item) => sum + item.amount, 0);
    const netSalary = totalEarningsView - totalDeductionsView;

    const save = () => {
        onSaved(row.id, toPatch(fields));
        toast.success('Berhasil Disimpan');
        setMode('view');
    };

    const chevron = <ChevronDown className="h-2.5 w-2.5 text-black" />;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Detail Gaji</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
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
                                <FieldRowView label="Periode" value={period.find((p) => p.id === fields.period_id)?.label} icon={chevron} />
                                <FieldRowView label="Status" value={STATUS_LABEL[fields.status]} icon={chevron} />
                                <FieldRowView
                                    label="Tanggal Bayar"
                                    value={fields.payment_date ? formatDate(fields.payment_date) : undefined}
                                    icon={<Calendar className="h-2.5 w-2.5 text-black" />}
                                />
                                <FieldRowView label="Metode Bayar" value={fields.payment_method || undefined} icon={chevron} />
                            </>
                        ) : (
                            <>
                                <FieldRowEdit label="Periode">
                                    <Select value={fields.period_id} onValueChange={(value) => setField('period_id', value)}>
                                        <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {period.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldRowEdit>
                                <FieldRowEdit label="Status">
                                    <Select value={fields.status} onValueChange={(value) => setField('status', value as PayrollStatus)}>
                                        <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(STATUS_LABEL) as PayrollStatus[]).map((status) => (
                                                <SelectItem key={status} value={status}>
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
                            <SalarySectionEdit
                                title="PENDAPATAN"
                                rows={[
                                    { label: 'Gaji Pokok', key: 'base_salary' },
                                    { label: 'Tunjangan Jabatan', key: 'position_allowance' },
                                    { label: 'Tunjangan Makan', key: 'meal_allowance' },
                                    { label: 'Tunjangan Transport', key: 'transport_allowance' },
                                    { label: 'Lembur', key: 'overtime' },
                                ]}
                                fields={fields}
                                setField={setField}
                            />
                            <SalarySectionEdit
                                title="POTONGAN"
                                rows={[
                                    { label: 'Alpha', key: 'alpha' },
                                    { label: 'Terlambat', key: 'late' },
                                    { label: 'BPJS Kesehatan', key: 'bpjs_health' },
                                    { label: 'BPJS Ketenagakerjaan', key: 'bpjs_employment' },
                                    { label: 'PPh 21', key: 'pph21' },
                                ]}
                                fields={fields}
                                setField={setField}
                            />
                        </div>
                    )}

                    <Separator className="bg-[#E2E8F0]" />

                    <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#E0F2FE] p-3.5">
                        <p className="font-poppins text-[11px] font-semibold text-[#1980C0]">GAJI BERSIH (THP)</p>
                        <p className="font-poppins text-lg font-extrabold text-[#1980C0]">{formatCurrency(netSalary)}</p>
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
                                onClick={() => window.print()}
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
            </DialogContent>
        </Dialog>
    );
}
