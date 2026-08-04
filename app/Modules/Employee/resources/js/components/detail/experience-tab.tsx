import { formatDate, labelFor } from '../../lib/format-employee-form';
import { employmentTypeOptions, workLocationOptions } from '../steps/experience-entry';
import { isEmptyWorkExperience, type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';
import { DetailFileRow } from './detail-file-row';

export function ExperienceTab({ data }: { data: EmployeeFormData }) {
    const experiences = data.work_experiences.filter((experience) => !isEmptyWorkExperience(experience));

    if (experiences.length === 0) {
        return <p className="font-poppins text-sm text-[#8F8F8F]">Belum ada riwayat pengalaman kerja.</p>;
    }

    return (
        <div className="flex flex-col gap-5">
            {experiences.map((experience, index) => (
                <div key={index} className="flex flex-col gap-2 border-b border-[#E7E7E7] pb-5 last:border-b-0 last:pb-0">
                    {experiences.length > 1 && <p className="font-poppins text-sm font-semibold text-[#121212]">Pengalaman {index + 1}</p>}
                    <DetailField label="Nama Perusahaan" value={experience.company_name} />
                    <DetailField label="Tipe Pekerjaan" value={labelFor(employmentTypeOptions, experience.employment_type)} />
                    <DetailField label="Jabatan/Posisi" value={experience.position} />
                    <DetailField label="Periode" value={`${formatDate(experience.start_date)} - ${formatDate(experience.end_date)}`} />
                    <DetailField label="Lokasi Kerja" value={labelFor(workLocationOptions, experience.work_location)} />
                    <DetailField label="Gaji Terakhir" value={experience.last_salary} />
                    <DetailField label="Deskripsi" value={experience.description} />
                    <DetailFileRow label="Surat Referensi" file={experience.reference_letter} />
                </div>
            ))}
        </div>
    );
}
