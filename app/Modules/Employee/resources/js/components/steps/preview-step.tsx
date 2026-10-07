import { FileTypeIcon, toUploadedFile, useFilePreviewUrl, type StoredFile } from '@/components/form/form-field';
import { regency } from '@/data/Region/regency';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';
import { formatDate, labelFor, orgUnitName } from '../../lib/format-employee-form';
import { isEmptyWorkExperience, type EmployeeFormData } from '../../types/employee-form';
import { educationLevelOptions } from './education-step';
import { employmentTypeOptions, workLocationOptions } from './experience-entry';
import { allowanceOptions, allowanceValueField, bankOptions } from './financial-step';
import { genderOptions, maritalStatusLabel, religionOptions } from './personal-step';
import { branchOptions, contractEvaluationOptions, contractOptions, jobLevelOptions, positionOptions } from './provision-step';

/** One bordered card per section, matching the design's stacked summary panels. */
function SummarySection({ title, columns = 2, children }: { title: string; columns?: 2 | 3; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-[#E7E7E7] bg-white px-4 py-3">
            <p className="font-poppins mb-1.5 text-sm font-semibold text-[#121212]">{title}</p>
            <div className={cn('grid gap-x-6 gap-y-1', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>{children}</div>
        </section>
    );
}

/** "Label : value" on one line — the read-only pairing used across every section. */
function SummaryPair({ label, value }: { label: string; value: string }) {
    return (
        <p className="font-poppins text-sm text-[#353535]">
            <span className="text-[#8F8F8F]">{label} : </span>
            <span className="font-medium text-[#121212]">{value || '—'}</span>
        </p>
    );
}

function DocumentRow({ label, file }: { label: string; file: File | StoredFile | null }) {
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);
    if (!uploaded) return null;

    return (
        <a
            href={previewUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Lihat ${label}: ${uploaded.name}`}
            className="flex w-full items-center gap-3 rounded-lg border border-[#E7E7E7] bg-white px-3 py-2 hover:border-[#1980C0]"
        >
            <FileTypeIcon name={uploaded.name} className="h-7 w-7" />
            <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="font-poppins w-full truncate text-sm text-[#353535]">{uploaded.name}</p>
                <p className="font-poppins text-xs text-[#808080]">{uploaded.size ?? label}</p>
            </div>
        </a>
    );
}

interface PreviewStepProps {
    data: EmployeeFormData;
}

export function PreviewStep({ data }: PreviewStepProps) {
    const cityName = regency.find((region) => region.id === data.regency_id)?.name ?? '';

    return (
        <div className="flex flex-col gap-2.5">
            <SummarySection title="Data Personal" columns={3}>
                <SummaryPair label="Nama Lengkap" value={data.full_name} />
                <SummaryPair label="Status" value={maritalStatusLabel(data.is_married)} />
                <SummaryPair label="Kab/Kota" value={cityName} />
                <SummaryPair label="Jenis Kelamin" value={labelFor(genderOptions, data.gender)} />
                <SummaryPair label="Nomor WA" value={data.phone_number} />
                <SummaryPair label="Alamat Lengkap" value={data.address} />
                <SummaryPair label="Tgl Lahir" value={formatDate(data.birth_date)} />
                <SummaryPair label="Agama" value={labelFor(religionOptions, data.religion)} />
            </SummarySection>

            <SummarySection title="Data Pendidikan" columns={3}>
                <SummaryPair label="Pendidikan Terakhir" value={labelFor(educationLevelOptions, data.education.level)} />
                <SummaryPair label="Nama Institusi" value={data.education.institution} />
                <SummaryPair label="Jurusan" value={data.education.major} />
                <SummaryPair label="Waktu Mulai" value={formatDate(data.education.start_date)} />
                <SummaryPair label="Waktu Lulus" value={formatDate(data.education.end_date)} />
                <SummaryPair label="Nilai Akhir" value={data.education.final_score} />
            </SummarySection>

            {data.work_experiences
                .filter((experience) => !isEmptyWorkExperience(experience))
                .map((experience, index, visible) => (
                    <SummarySection key={index} title={visible.length > 1 ? `Data Pengalaman ${index + 1}` : 'Data Pengalaman'} columns={3}>
                        <SummaryPair label="Nama Perusahaan" value={experience.company_name} />
                        <SummaryPair label="Type Pekerjaan" value={labelFor(employmentTypeOptions, experience.employment_type)} />
                        <SummaryPair label="Gaji Terakhir" value={experience.last_salary} />
                        <SummaryPair label="Jabatan/Posisi" value={experience.position} />
                        <SummaryPair label="Waktu Mulai" value={formatDate(experience.start_date)} />
                        <SummaryPair label="Deskripsi" value={experience.description} />
                        <SummaryPair label="Lokasi Kerja" value={labelFor(workLocationOptions, experience.work_location)} />
                        <SummaryPair label="Waktu Selesai" value={formatDate(experience.end_date)} />
                    </SummarySection>
                ))}

            <SummarySection title="Data Ketentuan" columns={3}>
                <SummaryPair label="Cabang" value={labelFor(branchOptions, data.branch)} />
                <SummaryPair label="Organisasi" value={orgUnitName(data.department_id)} />
                <SummaryPair label="Posisi Jabatan" value={labelFor(positionOptions, data.division_id)} />
                <SummaryPair label="Level" value={labelFor(jobLevelOptions, data.job_level)} />
                <SummaryPair label="Kontrak" value={labelFor(contractOptions, data.contract_type)} />
                <SummaryPair label="Tgl Gabung" value={formatDate(data.join_date)} />
                {data.contract_type === 'permanent' && (
                    <SummaryPair label="Evaluasi Kontrak" value={labelFor(contractEvaluationOptions, data.contract_evaluation)} />
                )}
            </SummarySection>

            <SummarySection title="Data Gaji & Bank" columns={3}>
                <SummaryPair label="Bank" value={labelFor(bankOptions, data.bank_name)} />
                <SummaryPair label="Atas Nama Bank" value={data.bank_account_holder} />
                <SummaryPair label="No Rekening" value={data.bank_account_number} />
                <SummaryPair label="Gaji Pokok" value={data.basic_salary} />
                <SummaryPair label="Tunjangan" value={labelFor(allowanceOptions, data.allowance)} />
                {data.allowance && <SummaryPair label={allowanceValueField(data.allowance).label} value={data.allowance_value} />}
            </SummarySection>

            <div className="border-t border-[#E7E7E7]" />

            <div className="flex flex-col gap-2.5">
                <p className="font-poppins text-sm font-semibold text-[#121212]">Dokumen Pendukung</p>
                <div className="flex flex-col gap-2">
                    <DocumentRow label="KTP" file={data.ktp} />
                    <DocumentRow label="NPWP" file={data.npwp} />
                    <DocumentRow label="Surat Kontrak" file={data.contract} />
                    <DocumentRow label="Ijazah/Transkrip" file={data.education.certificate} />
                    {data.work_experiences.map((experience, index) => (
                        <DocumentRow key={index} label="Surat Referensi" file={experience.reference_letter} />
                    ))}
                </div>
            </div>
        </div>
    );
}