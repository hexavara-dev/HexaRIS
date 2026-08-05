import { formatDate, labelFor } from '../../lib/format-employee-form';
import { educationLevelOptions } from '../steps/education-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';
import { DetailFileRow } from './detail-file-row';

export function EducationTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Pendidikan Terakhir" value={labelFor(educationLevelOptions, data.education.level)} />
            <DetailField label="Nama Institusi" value={data.education.institution} />
            <DetailField label="Jurusan" value={data.education.major} />
            <DetailField label="Waktu Mulai" value={formatDate(data.education.start_date)} />
            <DetailField label="Waktu Lulus" value={formatDate(data.education.end_date)} />
            <DetailField label="Nilai Akhir" value={data.education.final_score} />
            <DetailFileRow label="Sertifikat/Ijazah" file={data.education.certificate} />
        </div>
    );
}
