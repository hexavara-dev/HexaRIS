import { SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { province } from '@/data/Region/province';
import { regency } from '@/data/Region/regency';
import { useMemo } from 'react';
import { type EmployeeFormData } from '../../types/employee-form';
import { DocumentUploads } from './document-uploads';

export const genderOptions: SelectFieldOption[] = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
];

// Mirrors the Religion union in @/data/Employee/employee.
export const religionOptions: SelectFieldOption[] = [
    { value: 'islam', label: 'Islam' },
    { value: 'christian', label: 'Kristen' },
    { value: 'catholic', label: 'Katolik' },
    { value: 'hindu', label: 'Hindu' },
    { value: 'buddha', label: 'Buddha' },
    { value: 'confucianism', label: 'Konghucu' },
    { value: 'other', label: 'Lainnya' },
];

// Mirrors Employee.is_married directly — the select just presents it as Menikah/Belum Menikah.
const maritalStatusOptions: SelectFieldOption[] = [
    { value: 'true', label: 'Menikah' },
    { value: 'false', label: 'Belum Menikah' },
];

export function maritalStatusLabel(isMarried: boolean) {
    return isMarried ? 'Menikah' : 'Belum Menikah';
}

const provinceOptions: SelectFieldOption[] = province.map((p) => ({ value: p.id, label: p.name }));

interface PersonalStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: Partial<Record<keyof EmployeeFormData, string>>;
}

export function PersonalStep({ data, setData, errors }: PersonalStepProps) {
    const regencyOptions = useMemo<SelectFieldOption[]>(
        () => regency.filter((r) => r.province_id === data.province_id).map((r) => ({ value: r.id, label: r.name })),
        [data.province_id],
    );

    const selectProvince = (value: string) => {
        setData('province_id', value);
        setData('regency_id', '');
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <TextField
                label="Full Nama"
                htmlFor="full_name"
                required
                value={data.full_name}
                onChange={(v) => setData('full_name', v)}
                error={errors.full_name}
                placeholder="Nama sesuai KTP"
            />
            <TextField
                label="Nomor WA"
                htmlFor="phone_number"
                required
                type="tel"
                value={data.phone_number}
                onChange={(v) => setData('phone_number', v)}
                error={errors.phone_number}
                placeholder="08xxxxxxxxxx"
            />

            <TextField
                label="Email Pribadi"
                htmlFor="email_self"
                required
                type="email"
                value={data.email_self}
                onChange={(v) => setData('email_self', v)}
                error={errors.email_self}
                placeholder="nama@email.com"
            />
            <TextField
                label="Email Perusahaan (Opsional)"
                htmlFor="email_company"
                type="email"
                value={data.email_company}
                onChange={(v) => setData('email_company', v)}
                error={errors.email_company}
                placeholder="nama@perusahaan.com"
            />

            <SelectField
                label="Jenis Kelamin"
                htmlFor="gender"
                required
                options={genderOptions}
                value={data.gender}
                onValueChange={(v) => setData('gender', v)}
                error={errors.gender}
                placeholder="Pilih jenis kelamin"
            />
            <SelectField
                label="Agama"
                htmlFor="religion"
                required
                options={religionOptions}
                value={data.religion}
                onValueChange={(v) => setData('religion', v)}
                error={errors.religion}
                placeholder="Pilih agama"
            />

            <TextField
                label="Tgl Lahir"
                htmlFor="birth_date"
                required
                type="date"
                value={data.birth_date}
                onChange={(v) => setData('birth_date', v)}
                error={errors.birth_date}
            />
            <TextField
                label="Nomor KTP (NIK)"
                htmlFor="identity_number"
                required
                value={data.identity_number}
                onChange={(v) => setData('identity_number', v.replace(/\D/g, ''))}
                error={errors.identity_number}
                placeholder="16 digit sesuai KTP"
            />

            <TextField
                label="Nomor NPWP (Opsional)"
                htmlFor="npwp_number"
                value={data.npwp_number}
                onChange={(v) => setData('npwp_number', v)}
                error={errors.npwp_number}
                placeholder="00.000.000.0-000.000"
            />
            {/* Two selects sharing one grid cell — the nesting case, and it is
                just a nested grid. No wizard feature required. */}
            <div className="grid grid-cols-2 gap-6">
                <SelectField
                    label="Provinsi"
                    htmlFor="province_id"
                    required
                    options={provinceOptions}
                    value={data.province_id}
                    onValueChange={selectProvince}
                    error={errors.province_id}
                    placeholder="Pilih provinsi"
                />
                <SelectField
                    label="Kab/kota"
                    htmlFor="regency_id"
                    required
                    options={regencyOptions}
                    value={data.regency_id}
                    onValueChange={(v) => setData('regency_id', v)}
                    error={errors.regency_id}
                    placeholder={data.province_id ? 'Pilih kab/kota' : 'Pilih provinsi dulu'}
                    disabled={!data.province_id}
                />
            </div>

            <SelectField
                label="Status"
                htmlFor="is_married"
                required
                options={maritalStatusOptions}
                value={String(data.is_married)}
                onValueChange={(v) => setData('is_married', v === 'true')}
                error={errors.is_married}
                placeholder="Pilih status"
            />
            <TextField
                label="Alamat Lengkap"
                htmlFor="address"
                required
                value={data.address}
                onChange={(v) => setData('address', v)}
                error={errors.address}
                placeholder="Jl. ..."
            />

            <DocumentUploads data={data} setData={setData} errors={errors} />
        </div>
    );
}
