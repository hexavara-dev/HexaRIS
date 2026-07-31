import { FileUploadField, SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { Trash2 } from 'lucide-react';
import { type WorkExperience } from '../../types/employee-form';

export const employmentTypeOptions: SelectFieldOption[] = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'outsourcing', label: 'Outsourcing' },
    { value: 'temporary', label: 'Temporary' },
];

export const workLocationOptions: SelectFieldOption[] = [
    { value: 'wfh', label: 'WFH' },
    { value: 'wfo', label: 'WFO' },
    { value: 'hybrid', label: 'Hybrid' },
];

interface ExperienceEntryErrors {
    company_name?: string;
    employment_type?: string;
    position?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    work_location?: string;
    last_salary?: string;
    reference_letter?: string;
}

interface ExperienceEntryProps {
    index: number;
    experience: WorkExperience;
    onChange: (experience: WorkExperience) => void;
    onRemove: () => void;
    removable: boolean;
    errors?: ExperienceEntryErrors;
}

export function ExperienceEntry({ index, experience, onChange, onRemove, removable, errors = {} }: ExperienceEntryProps) {
    function set<K extends keyof WorkExperience>(key: K, value: WorkExperience[K]) {
        onChange({ ...experience, [key]: value });
    }

    const fieldId = (name: string) => `${name}-${index}`;

    return (
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-5 border-b border-[#E7E7E7] pb-5 last:border-b-0 last:pb-0">
            {removable && (
                <>
                    <p className="font-poppins col-span-2 text-sm font-semibold text-[#121212]">Pengalaman {index + 1}</p>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Hapus pengalaman"
                        className="absolute top-4 right-4 text-[#8F8F8F] hover:text-[#E84A39]"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </>
            )}

            <TextField
                label="Nama Perusahaan"
                htmlFor={fieldId('company_name')}
                required
                value={experience.company_name}
                onChange={(v) => set('company_name', v)}
                error={errors.company_name}
                placeholder="Masukkan nama Perusahaan"
            />
            <SelectField
                label="Type Pekerjaan"
                htmlFor={fieldId('employment_type')}
                required
                options={employmentTypeOptions}
                value={experience.employment_type}
                onValueChange={(v) => set('employment_type', v)}
                error={errors.employment_type}
                placeholder="Pilih tipe pekerjaan"
            />

            <TextField
                label="Jabatan/Posisi"
                htmlFor={fieldId('position')}
                required
                value={experience.position}
                onChange={(v) => set('position', v)}
                error={errors.position}
                placeholder="Masukkan jabatan/posisi"
            />
            <TextField
                label="Mulai"
                htmlFor={fieldId('start_date')}
                required
                type="date"
                value={experience.start_date}
                onChange={(v) => set('start_date', v)}
                error={errors.start_date}
            />

            <TextField
                label="Deskripsi"
                htmlFor={fieldId('description')}
                required
                value={experience.description}
                onChange={(v) => set('description', v)}
                error={errors.description}
                placeholder="Masukkan Deskripsi Pekerjaan"
            />
            <TextField
                label="Selesai"
                htmlFor={fieldId('end_date')}
                required
                type="date"
                value={experience.end_date}
                onChange={(v) => set('end_date', v)}
                error={errors.end_date}
            />

            <SelectField
                label="Lokasi Kerja (Opsional)"
                htmlFor={fieldId('work_location')}
                options={workLocationOptions}
                value={experience.work_location}
                onValueChange={(v) => set('work_location', v)}
                error={errors.work_location}
                placeholder="Pilih lokasi kerja"
            />
            <TextField
                label="Gaji Terakhir (Opsional)"
                htmlFor={fieldId('last_salary')}
                value={experience.last_salary}
                onChange={(v) => set('last_salary', v)}
                error={errors.last_salary}
                placeholder="Rp. 0"
            />

            <div className="col-span-2">
                <FileUploadField
                    label="Surat Referensi/Pengalaman Kerja (Opsional)"
                    accept="image/*,.pdf"
                    file={experience.reference_letter}
                    onSelect={(f) => set('reference_letter', f)}
                    onRemove={() => set('reference_letter', null)}
                    error={errors.reference_letter}
                />
            </div>
        </div>
    );
}
