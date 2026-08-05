import { labelFor } from '../../lib/format-employee-form';
import { bankOptions } from '../steps/financial-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

function formatCurrency(value: string): string {
    const amount = Number(value);
    if (!value || Number.isNaN(amount)) return value;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export function FinancialTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Bank" value={labelFor(bankOptions, data.bank_name)} />
            <DetailField label="Nama Pemilik Rekening" value={data.bank_account_holder} />
            <DetailField label="No Rekening" value={data.bank_account_number} />
            <DetailField label="Gaji Pokok" value={formatCurrency(data.basic_salary)} />
            <DetailField label="Nomor BPJS Kesehatan" value={data.bpjs_health_number} />
            <DetailField label="Nomor BPJS Ketenagakerjaan" value={data.bpjs_employment_number} />
        </div>
    );
}
