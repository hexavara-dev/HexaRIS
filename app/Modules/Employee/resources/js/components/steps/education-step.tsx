import { FileUploadField, SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { type EducationEntry, type EmployeeFormData, type FieldErrors } from '../../types/employee-form';

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

interface EducationStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function EducationStep({ data, setData, errors }: EducationStepProps) {
    function set<K extends keyof EducationEntry>(key: K, value: EducationEntry[K]) {
        setData('education', { ...data.education, [key]: value });
    }

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <SelectField
                label="Pendidikan Terakhir"
                htmlFor="level"
                required
                options={educationLevelOptions}
                value={data.education.level}
                onValueChange={(v) => set('level', v)}
                error={errors['education.level']}
                placeholder="Pilih Pendidikan Terakhir"
            />
            <TextField
                label="Mulai"
                htmlFor="start_date"
                required
                type="date"
                value={data.education.start_date}
                onChange={(v) => set('start_date', v)}
                error={errors['education.start_date']}
            />

            <TextField
                label="Nama Institusi"
                htmlFor="institution"
                required
                value={data.education.institution}
                onChange={(v) => set('institution', v)}
                error={errors['education.institution']}
                placeholder="Masukkan Nama Institusi"
            />
            <TextField
                label="Lulus"
                htmlFor="end_date"
                required
                type="date"
                value={data.education.end_date}
                onChange={(v) => set('end_date', v)}
                error={errors['education.end_date']}
            />

            <TextField
                label="Jurusan"
                htmlFor="major"
                required
                value={data.education.major}
                onChange={(v) => set('major', v)}
                error={errors['education.major']}
                placeholder="Masukkan Jurusan"
            />
            <TextField
                label="Nilai Akhir"
                htmlFor="final_score"
                required
                value={data.education.final_score}
                onChange={(v) => set('final_score', v)}
                error={errors['education.final_score']}
                placeholder="0/4.00"
            />

            <div className="col-span-2">
                <FileUploadField
                    label="Upload Ijazah/Transkrip"
                    required
                    accept="image/*,.pdf"
                    file={data.education.certificate}
                    onSelect={(f) => set('certificate', f)}
                    onRemove={() => set('certificate', null)}
                    error={errors['education.certificate']}
                />
            </div>
        </div>
    );
}
