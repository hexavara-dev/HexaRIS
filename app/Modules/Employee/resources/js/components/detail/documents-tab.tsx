import { isEmptyWorkExperience, type EmployeeFormData } from '../../types/employee-form';
import { DetailFileRow } from './detail-file-row';

export function DocumentsTab({ data }: { data: EmployeeFormData }) {
    const nonEmptyExperiences = data.work_experiences.filter((experience) => !isEmptyWorkExperience(experience));

    return (
        <div className="flex flex-col gap-2">
            <DetailFileRow label="KTP" file={data.ktp} />
            <DetailFileRow label="NPWP" file={data.npwp} />
            <DetailFileRow label="Kontrak" file={data.contract} />
            <DetailFileRow label="Sertifikat/Ijazah Pendidikan" file={data.education.certificate} />
            {nonEmptyExperiences.map((experience, index) => (
                <DetailFileRow
                    key={index}
                    label={nonEmptyExperiences.length > 1 ? `Surat Referensi (Pengalaman ${index + 1})` : 'Surat Referensi'}
                    file={experience.reference_letter}
                />
            ))}
        </div>
    );
}
