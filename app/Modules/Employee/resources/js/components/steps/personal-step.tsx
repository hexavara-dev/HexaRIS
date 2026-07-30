import { FileUploadField, SelectField, TextField, type SelectFieldOption, type UploadedFile } from '@/components/form/form-field';
import { province } from '@/data/Region/province';
import { regency } from '@/data/Region/regency';
import { useMemo } from 'react';
import { type EmployeeFormData } from '../../types/employee-form';

const genderOptions: SelectFieldOption[] = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
];

// Mirrors the Religion union in @/data/Employee/employee.
const religionOptions: SelectFieldOption[] = [
    { value: 'islam', label: 'Islam' },
    { value: 'christian', label: 'Kristen' },
    { value: 'catholic', label: 'Katolik' },
    { value: 'hindu', label: 'Hindu' },
    { value: 'buddha', label: 'Buddha' },
    { value: 'confucianism', label: 'Konghucu' },
    { value: 'other', label: 'Lainnya' },
];

// Employee stores this as the boolean `is_married`; the form keeps it a string
// because that is what a Select yields, and converts on submit.
const maritalOptions: SelectFieldOption[] = [
    { value: 'menikah', label: 'Menikah' },
    { value: 'lajang', label: 'Lajang' },
];

const provinceOptions: SelectFieldOption[] = province.map((p) => ({ value: p.id, label: p.name }));

/** FileUploadField shows name + size; the form itself holds the raw File. */
function toUploadedFile(file: File | null): UploadedFile | null {
    if (!file) return null;
    return { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} Mb` };
}

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

    // A regency belongs to exactly one province, so a stale selection would be
    // invalid — clear it whenever the province changes.
    const selectProvince = (value: string) => {
        setData('province_id', value);
        setData('regency_id', '');
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <TextField
                label="Full Nama"
                htmlFor="full_name"
                value={data.full_name}
                onChange={(v) => setData('full_name', v)}
                error={errors.full_name}
                placeholder="Nama sesuai KTP"
            />
            <TextField
                label="Nomor WA"
                htmlFor="phone_number"
                type="tel"
                value={data.phone_number}
                onChange={(v) => setData('phone_number', v)}
                error={errors.phone_number}
                placeholder="08xxxxxxxxxx"
            />

            <SelectField
                label="Jenis Kelamin"
                htmlFor="gender"
                options={genderOptions}
                value={data.gender}
                onValueChange={(v) => setData('gender', v)}
                error={errors.gender}
                placeholder="Pilih jenis kelamin"
            />
            <SelectField
                label="Agama"
                htmlFor="religion"
                options={religionOptions}
                value={data.religion}
                onValueChange={(v) => setData('religion', v)}
                error={errors.religion}
                placeholder="Pilih agama"
            />

            <TextField
                label="Tgl Lahir"
                htmlFor="birth_date"
                type="date"
                value={data.birth_date}
                onChange={(v) => setData('birth_date', v)}
                error={errors.birth_date}
            />
            {/* Two selects sharing one grid cell — the nesting case, and it is
                just a nested grid. No wizard feature required. */}
            <div className="grid grid-cols-2 gap-4">
                <SelectField
                    label="Provinsi"
                    htmlFor="province_id"
                    options={provinceOptions}
                    value={data.province_id}
                    onValueChange={selectProvince}
                    error={errors.province_id}
                    placeholder="Pilih provinsi"
                />
                <SelectField
                    label="Kab/kota"
                    htmlFor="regency_id"
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
                htmlFor="marital_status"
                options={maritalOptions}
                value={data.marital_status}
                onValueChange={(v) => setData('marital_status', v)}
                error={errors.marital_status}
                placeholder="Pilih status"
            />
            <TextField
                label="Alamat Lengkap"
                htmlFor="address"
                value={data.address}
                onChange={(v) => setData('address', v)}
                error={errors.address}
                placeholder="Jl. ..."
            />

            <div className="col-span-2 space-y-5">
                <FileUploadField
                    label="Upload KTP"
                    required
                    accept="image/*,.pdf"
                    file={toUploadedFile(data.ktp)}
                    onSelect={(f) => setData('ktp', f)}
                    onRemove={() => setData('ktp', null)}
                    error={errors.ktp}
                />
                <FileUploadField
                    label="Upload NPWP (Opsional)"
                    accept="image/*,.pdf"
                    file={toUploadedFile(data.npwp)}
                    onSelect={(f) => setData('npwp', f)}
                    onRemove={() => setData('npwp', null)}
                    error={errors.npwp}
                />
                <FileUploadField
                    label="Upload Kontrak"
                    required
                    accept="image/*,.pdf"
                    file={toUploadedFile(data.contract)}
                    onSelect={(f) => setData('contract', f)}
                    onRemove={() => setData('contract', null)}
                    error={errors.contract}
                />
            </div>
        </div>
    );
}
