import { toUploadedFile, useFilePreviewUrl, type SelectFieldOption } from '@/components/form/form-field';
import { employee } from '@/data/Employee/employee';
import { organization } from '@/data/Organization/organization';
import { jobPosition } from '@/data/Position/jobPosition';
import { FileText } from 'lucide-react';
import { type ReactNode } from 'react';
import { type EmployeeFormData } from '../../types/employee-form';
import { educationLevelOptions } from './education-entry';
import { employmentTypeOptions, workLocationOptions } from './experience-entry';
import { bankOptions } from './financial-step';
import { genderOptions, maritalStatusLabel, religionOptions } from './personal-step';
import { branchOptions, contractOptions, jobLevelNameForPosition } from './provision-step';

function labelFor(options: SelectFieldOption[], value: string) {
    return options.find((option) => option.value === value)?.label || '—';
}

function orgUnitName(id: string) {
    return organization.find((unit) => unit.id === id)?.name || '—';
}

function jobPositionTitle(id: string) {
    return jobPosition.find((p) => p.id === id)?.title || '—';
}

function employeeName(id: string) {
    return employee.find((e) => e.id === id)?.full_name || '—';
}

function formatDate(value: string) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

function DocumentRow({ label, file }: { label: string; file: File | null }) {
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);
    const isImage = file?.type.startsWith('image/') ?? false;
    if (!uploaded) return null;

    return (
        <a
            href={previewUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Lihat ${uploaded.name}`}
            className="flex w-full items-center gap-4 rounded-lg border border-[#E7E7E7] bg-white px-4 py-2 hover:border-[#1980C0]"
        >
            {isImage && previewUrl ? (
                <img src={previewUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
            ) : (
                <FileText className="h-8 w-8 shrink-0 text-[#E84A39]" />
            )}
            <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="font-poppins text-sm text-[#353535]">{label}</p>
                <p className="font-poppins w-full truncate text-xs text-[#808080]">
                    {uploaded.name} · {uploaded.size}
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
                <SummaryRow label="Email Pribadi" value={data.email_self} />
                <SummaryRow label="Email Perusahaan" value={data.email_company} />
                <SummaryRow label="No Telp" value={data.phone_number} />
                <SummaryRow label="Jenis Kelamin" value={labelFor(genderOptions, data.gender)} />
                <SummaryRow label="Tgl Lahir" value={formatDate(data.birth_date)} />
                <SummaryRow label="Agama" value={labelFor(religionOptions, data.religion)} />
                <SummaryRow label="Status Pernikahan" value={maritalStatusLabel(data.is_married)} />
                <SummaryRow label="NIK" value={data.identity_number} />
                <SummaryRow label="NPWP" value={data.npwp_number} />
                <div className="col-span-2">
                    <SummaryRow label="Alamat Lengkap" value={data.address} />
                </div>
            </SummarySection>

            {data.educations.map((education, index) => (
                <SummarySection key={index} title={data.educations.length > 1 ? `Data Pendidikan ${index + 1}` : 'Data Pendidikan'}>
                    <SummaryRow label="Jenjang Pendidikan" value={labelFor(educationLevelOptions, education.level)} />
                    <SummaryRow label="Nama Institusi" value={education.institution} />
                    <SummaryRow label="Jurusan" value={education.major} />
                    <SummaryRow label="Nomor Ijazah" value={education.number} />
                </SummarySection>
            ))}

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
                <SummaryRow label="Departemen" value={orgUnitName(data.department_id)} />
                <SummaryRow label="Divisi" value={orgUnitName(data.division_id)} />
                <SummaryRow label="Jabatan" value={jobPositionTitle(data.job_position_id)} />
                <SummaryRow label="Level" value={jobLevelNameForPosition(data.job_position_id) ?? '—'} />
                <SummaryRow label="Atasan Langsung" value={employeeName(data.direct_manager_id)} />
                <SummaryRow label="Kontrak" value={labelFor(contractOptions, data.contract_type)} />
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
                    {data.educations.map((education, index) => (
                        <DocumentRow key={index} label="Ijazah/Transkrip" file={education.certificate} />
                    ))}
                    {data.work_experiences.map((experience, index) => (
                        <DocumentRow key={index} label="Surat Referensi" file={experience.reference_letter} />
                    ))}
                </div>
            </div>
        </div>
    );
}
