import { SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { type EmployeeFormData, type FieldErrors } from '../../types/employee-form';

// Mirrors the bank_name values already seeded in @/data/Employee/employeeBankAccount.
export const bankOptions: SelectFieldOption[] = [
    { value: 'mandiri', label: 'Bank Mandiri' },
    { value: 'bca', label: 'BCA' },
    { value: 'bni', label: 'BNI' },
    { value: 'bri', label: 'BRI' },
    { value: 'cimb_niaga', label: 'CIMB Niaga' },
];

interface FinancialStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function FinancialStep({ data, setData, errors }: FinancialStepProps) {
    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <SelectField
                label="Bank"
                htmlFor="bank_name"
                required
                options={bankOptions}
                value={data.bank_name}
                onValueChange={(v) => setData('bank_name', v)}
                error={errors.bank_name}
                placeholder="Pilih Bank"
            />
            <TextField
                label="Gaji Pokok"
                htmlFor="basic_salary"
                required
                value={data.basic_salary}
                onChange={(v) => setData('basic_salary', v)}
                error={errors.basic_salary}
                placeholder="Rp 0"
            />

            <TextField
                label="Atas Nama Bank"
                htmlFor="bank_account_holder"
                required
                value={data.bank_account_holder}
                onChange={(v) => setData('bank_account_holder', v)}
                error={errors.bank_account_holder}
                placeholder="Masukkan Nama Pemilik Rekening"
            />
            <TextField
                label="No Rekening"
                htmlFor="bank_account_number"
                required
                value={data.bank_account_number}
                onChange={(v) => setData('bank_account_number', v)}
                error={errors.bank_account_number}
                placeholder="Masukkan Nomor Rekening"
            />

            <TextField
                label="Nomor BPJS Kesehatan (Opsional)"
                htmlFor="bpjs_health_number"
                value={data.bpjs_health_number}
                onChange={(v) => setData('bpjs_health_number', v.replace(/\D/g, ''))}
                error={errors.bpjs_health_number}
                placeholder="Masukkan Nomor BPJS Kesehatan"
            />
            <TextField
                label="Nomor BPJS Ketenagakerjaan (Opsional)"
                htmlFor="bpjs_employment_number"
                value={data.bpjs_employment_number}
                onChange={(v) => setData('bpjs_employment_number', v.replace(/\D/g, ''))}
                error={errors.bpjs_employment_number}
                placeholder="Masukkan Nomor BPJS Ketenagakerjaan"
            />
        </div>
    );
}
