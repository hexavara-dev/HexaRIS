import { FileUploadField, SelectField, TextField, toUploadedFile, type SelectFieldOption } from '@/components/form/form-field';
import { Trash2 } from 'lucide-react';
import { type EducationEntry } from '../../types/employee-form';

export const educationLevelOptions: SelectFieldOption[] = [
    { value: 'tidak_sekolah', label: 'Tdk Sekolah' },
    { value: 'sd', label: 'SD' },
    { value: 'smp', label: 'SMP' },
    { value: 'sma', label: 'SMA' },
    { value: 'd1_d2_d3', label: 'D1/D2/D3' },
    { value: 'd4_s1', label: 'D4/S1' },
    { value: 's2', label: 'S2' },
    { value: 's3', label: 'S3' },
];

interface EducationEntryErrors {
    level?: string;
    institution?: string;
    major?: string;
    number?: string;
    certificate?: string;
}

interface EducationEntryProps {
    index: number;
    education: EducationEntry;
    onChange: (education: EducationEntry) => void;
    onRemove: () => void;
    removable: boolean;
    errors?: EducationEntryErrors;
}

export function EducationEntryFields({ index, education, onChange, onRemove, removable, errors = {} }: EducationEntryProps) {
    function set<K extends keyof EducationEntry>(key: K, value: EducationEntry[K]) {
        onChange({ ...education, [key]: value });
    }

    const fieldId = (name: string) => `${name}-${index}`;

    return (
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-5 border-b border-[#E7E7E7] pb-5 last:border-b-0 last:pb-0">
            {removable && (
                <>
                    <p className="font-poppins col-span-2 text-sm font-semibold text-[#121212]">Pendidikan {index + 1}</p>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Hapus pendidikan"
                        className="absolute top-4 right-4 text-[#8F8F8F] hover:text-[#E84A39]"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </>
            )}

            <SelectField
                label="Jenjang Pendidikan"
                htmlFor={fieldId('level')}
                required
                options={educationLevelOptions}
                value={education.level}
                onValueChange={(v) => set('level', v)}
                error={errors.level}
                placeholder="Pilih Jenjang Pendidikan"
            />
            <TextField
                label="Nama Institusi"
                htmlFor={fieldId('institution')}
                required
                value={education.institution}
                onChange={(v) => set('institution', v)}
                error={errors.institution}
                placeholder="Masukkan Nama Institusi"
            />

            <TextField
                label="Jurusan"
                htmlFor={fieldId('major')}
                required
                value={education.major}
                onChange={(v) => set('major', v)}
                error={errors.major}
                placeholder="Masukkan Jurusan"
            />
            <TextField
                label="Nomor Ijazah (Opsional)"
                htmlFor={fieldId('number')}
                value={education.number}
                onChange={(v) => set('number', v)}
                error={errors.number}
                placeholder="Masukkan Nomor Ijazah"
            />

            <div className="col-span-2">
                <FileUploadField
                    label="Upload Ijazah/Transkrip"
                    accept="image/*,.pdf"
                    file={toUploadedFile(education.certificate)}
                    onSelect={(f) => set('certificate', f)}
                    onRemove={() => set('certificate', null)}
                    error={errors.certificate}
                />
            </div>
        </div>
    );
}
