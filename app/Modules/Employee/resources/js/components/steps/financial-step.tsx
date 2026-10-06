import { type EmployeeFormData, type FieldErrors } from '../../types/employee-form';
import { SelectField, TextField, type SelectFieldOption } from './wizard-fields';

// Mirrors the bank_name values already seeded in @/data/Employee/employeeBankAccount.
export const bankOptions: SelectFieldOption[] = [
    { value: 'mandiri', label: 'Bank Mandiri' },
    { value: 'bca', label: 'BCA' },
    { value: 'bni', label: 'BNI' },
    { value: 'bri', label: 'BRI' },
    { value: 'cimb_niaga', label: 'CIMB Niaga' },
];

/** What the employee is paid besides gaji pokok — BPJS first, matching the design's "Tunjangan" select. */
export const allowanceOptions: SelectFieldOption[] = [
    { value: 'bpjs', label: 'BPJS' },
    { value: 'makan', label: 'Tunjangan Makan' },
    { value: 'transport', label: 'Tunjangan Transport' },
    { value: 'jabatan', label: 'Tunjangan Jabatan' },
];

/**
 * Shapes a typed amount into the Indonesian display form — "Rp 1.000.000" — as
 * the user types. Everything non-digit is dropped first, so editing the value
 * later keeps reformatting from the digits instead of fighting the separators.
 */
export function formatRupiah(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        return '';
    }

    return `Rp ${Number(digits).toLocaleString('id-ID')}`;
}

export type AllowanceValueField = {
    /** Label for the field holding the picked Tunjangan's value — BPJS collects a policy number, the rest a rupiah amount. */
    label: string;
    placeholder: string;
    /** A BPJS policy number is digits only; the amounts stay free text, like Gaji Pokok. */
    digitsOnly: boolean;
};

/** Shapes the second Gaji & Bank field from the selected Tunjangan instead of keeping it a hardcoded "BPJS" box. */
export function allowanceValueField(allowance: string): AllowanceValueField {
    switch (allowance) {
        case 'bpjs':
            return { label: 'Nomor BPJS', placeholder: 'Masukkan Nomor BPJS', digitsOnly: true };
        case 'makan':
            return { label: 'Tunjangan Makan', placeholder: 'Masukkan Nominal Tunjangan', digitsOnly: false };
        case 'transport':
            return { label: 'Tunjangan Transport', placeholder: 'Masukkan Nominal Tunjangan', digitsOnly: false };
        case 'jabatan':
            return { label: 'Tunjangan Jabatan', placeholder: 'Masukkan Nominal Tunjangan', digitsOnly: false };
        default:
            return { label: 'Nilai Tunjangan', placeholder: 'Pilih tunjangan dulu', digitsOnly: false };
    }
}

interface FinancialStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function FinancialStep({ data, setData, errors }: FinancialStepProps) {
    const allowanceField = allowanceValueField(data.allowance);

    const selectAllowance = (value: string) => {
        // The value belongs to the previous pick — carry it over only if the pick itself is unchanged.
        if (value !== data.allowance) setData('allowance_value', '');
        setData('allowance', value);
    };

    return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
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
                onChange={(v) => setData('basic_salary', formatRupiah(v))}
                error={errors.basic_salary}
                placeholder="Masukkan Gaji Pokok"
            />

            <TextField
                label="Atas Nama Bank"
                htmlFor="bank_account_holder"
                required
                value={data.bank_account_holder}
                onChange={(v) => setData('bank_account_holder', v)}
                error={errors.bank_account_holder}
                placeholder="Masukkan Atas Nama Bank"
            />
            <SelectField
                label="Tunjangan"
                htmlFor="allowance"
                required
                options={allowanceOptions}
                value={data.allowance}
                onValueChange={selectAllowance}
                error={errors.allowance}
                placeholder="Pilih Tunjangan"
            />

            <TextField
                label="No Rekening"
                htmlFor="bank_account_number"
                required
                value={data.bank_account_number}
                onChange={(v) => setData('bank_account_number', v)}
                error={errors.bank_account_number}
                placeholder="Masukkan No Rekening"
            />
            {/* The derived value field only exists once a Tunjangan is picked —
                before that there is nothing to collect (BPJS number vs nominal). */}
            {data.allowance && (
                <TextField
                    label={allowanceField.label}
                    htmlFor="allowance_value"
                    value={data.allowance_value}
                    onChange={(v) => setData('allowance_value', allowanceField.digitsOnly ? v.replace(/\D/g, '') : formatRupiah(v))}
                    error={errors.allowance_value}
                    placeholder={allowanceField.placeholder}
                />
            )}
        </div>
    );
}
