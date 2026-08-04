import { type Employee } from '@/data/Employee/employee';
import { province } from '@/data/Region/province';
import { regency } from '@/data/Region/regency';
import { formatDate, labelFor } from '../../lib/format-employee-form';
import { genderOptions, maritalStatusLabel, religionOptions } from '../steps/personal-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

function regionName(regencyId: string, provinceId: string): string {
    const regencyName = regency.find((r) => r.id === regencyId)?.name;
    const provinceName = province.find((p) => p.id === provinceId)?.name;
    return [regencyName, provinceName].filter(Boolean).join(', ');
}

interface PersonalTabProps {
    employee: Employee;
    data: EmployeeFormData;
}

export function PersonalTab({ employee, data }: PersonalTabProps) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <p className="font-poppins text-sm font-semibold text-[#121212]">Data Personal</p>
                <DetailField label="Nama Lengkap" value={data.full_name} />
                <DetailField label="Jenis Kelamin" value={labelFor(genderOptions, data.gender)} />
                <DetailField label="Tgl Lahir" value={formatDate(data.birth_date)} />
                <DetailField label="Status" value={maritalStatusLabel(data.is_married)} />
                <DetailField label="Nomor WA" value={data.phone_number} />
                <DetailField label="Agama" value={labelFor(religionOptions, data.religion)} />
                <DetailField label="Kab/Kota" value={regionName(data.regency_id, data.province_id)} />
                <DetailField label="Full Address" value={data.address} />
            </div>

            <div className="flex flex-col gap-2">
                <p className="font-poppins text-sm font-semibold text-[#121212]">Data Identitas</p>
                <DetailField label="Nomor Induk Karyawan" value={employee.employee_number} />
                <DetailField label="Email Perusahaan" value={employee.email_company ?? '-'} />
                <DetailField label="Email Pribadi" value={employee.email_self} />
                <DetailField label="No. KTP" value={employee.identity_number} />
                <DetailField label="NPWP" value={employee.npwp_number ?? '-'} />
                <DetailField label="Golongan Darah" value={employee.blood_type} />
                <DetailField label="Kewarganegaraan" value={employee.nationality} />
            </div>
        </div>
    );
}
