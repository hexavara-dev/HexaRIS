import { FileTypeIcon, toUploadedFile, useFilePreviewUrl, type StoredFile } from '@/components/form/form-field';
import { type ReactNode } from 'react';
import { formatDate, labelFor, orgUnitName } from '../../lib/format-employee-form';
import { type EmployeeFormData } from '../../types/employee-form';
import { educationLevelOptions } from './education-step';
import { employmentTypeOptions, workLocationOptions } from './experience-entry';
import { bankOptions } from './financial-step';
import { genderOptions, maritalStatusLabel, religionOptions } from './personal-step';
import { branchOptions, contractOptions, jobLevelOptions } from './provision-step';

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3 border-b border-[#E7E7E7] pb-5 last:border-b-0 last:pb-0">
            <p className="font-poppins text-sm font-semibold text-[#121212]">{title}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="font-poppins text-xs text-[#8F8F8F]">{label}</p>
            <p className="font-poppins text-sm text-[#121212]">{value || '—'}</p>
        </div>
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
            aria-label={`Lihat ${uploaded.name}`}
            className="flex w-full items-center gap-4 rounded-lg border border-[#E7E7E7] bg-white px-4 py-2 hover:border-[#1980C0]"
        >
            <FileTypeIcon name={uploaded.name} className="h-8 w-8" />
            <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="font-poppins text-sm text-[#353535]">{label}</p>
                <p className="font-poppins w-full truncate text-xs text-[#808080]">
                    {uploaded.name}
                    {uploaded.size ? ` · ${uploaded.size}` : ''}
                </p>
            </div>
        </a>
    );
}

interface PreviewStepProps {
    data: EmployeeFormData;
}

export function PreviewStep({ data }: PreviewStepProps) {
    return (
        <div className="flex flex-col gap-5">
            <SummarySection title="Data Personal">
                <SummaryRow label="Nama Lengkap" value={data.full_name} />
                <SummaryRow label="No Telp" value={data.phone_number} />
                <SummaryRow label="Jenis Kelamin" value={labelFor(genderOptions, data.gender)} />
                <SummaryRow label="Tgl Lahir" value={formatDate(data.birth_date)} />
                <SummaryRow label="Agama" value={labelFor(religionOptions, data.religion)} />
                <SummaryRow label="Status Pernikahan" value={maritalStatusLabel(data.is_married)} />
                <div className="col-span-2">
                    <SummaryRow label="Alamat Lengkap" value={data.address} />
                </div>
            </SummarySection>

            <SummarySection title="Data Pendidikan">
                <SummaryRow label="Pendidikan Terakhir" value={labelFor(educationLevelOptions, data.education.level)} />
                <SummaryRow label="Nama Institusi" value={data.education.institution} />
                <SummaryRow label="Mulai" value={formatDate(data.education.start_date)} />
                <SummaryRow label="Jurusan" value={data.education.major} />
                <SummaryRow label="Lulus" value={formatDate(data.education.end_date)} />
                <SummaryRow label="Nilai Akhir" value={data.education.final_score} />
            </SummarySection>

            {data.work_experiences.map((experience, index) => (
                <SummarySection key={index} title={data.work_experiences.length > 1 ? `Data Pengalaman ${index + 1}` : 'Data Pengalaman'}>
                    <SummaryRow label="Nama Perusahaan" value={experience.company_name} />
                    <SummaryRow label="Type Pekerjaan" value={labelFor(employmentTypeOptions, experience.employment_type)} />
                    <SummaryRow label="Jabatan/Posisi" value={experience.position} />
                    <SummaryRow label="Mulai" value={formatDate(experience.start_date)} />
                    <SummaryRow label="Selesai" value={formatDate(experience.end_date)} />
                    <SummaryRow label="Lokasi Kerja" value={labelFor(workLocationOptions, experience.work_location)} />
                    <div className="col-span-2">
                        <SummaryRow label="Deskripsi" value={experience.description} />
                    </div>
                </SummarySection>
            ))}

            <SummarySection title="Data Ketentuan">
                <SummaryRow label="Cabang" value={labelFor(branchOptions, data.branch)} />
                <SummaryRow label="Level" value={labelFor(jobLevelOptions, data.job_level)} />
                <SummaryRow label="Departemen" value={orgUnitName(data.department_id)} />
                <SummaryRow label="Kontrak" value={labelFor(contractOptions, data.contract_type)} />
                <SummaryRow label="Divisi" value={orgUnitName(data.division_id)} />
                <SummaryRow label="Tgl Gabung" value={formatDate(data.join_date)} />
            </SummarySection>

            <SummarySection title="Data Gaji & Bank">
                <SummaryRow label="Bank" value={labelFor(bankOptions, data.bank_name)} />
                <SummaryRow label="Gaji Pokok" value={data.basic_salary} />
                <SummaryRow label="Atas Nama Bank" value={data.bank_account_holder} />
                <SummaryRow label="No Rekening" value={data.bank_account_number} />
                <SummaryRow label="Nomor BPJS Kesehatan" value={data.bpjs_health_number} />
                <SummaryRow label="Nomor BPJS Ketenagakerjaan" value={data.bpjs_employment_number} />
            </SummarySection>

            <div className="flex flex-col gap-3">
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
