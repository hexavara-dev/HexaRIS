import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogTitle } from '@/components/ui/dialog';
import { type Employee } from '@/data/Employee/employee';
import { useMemo, useState } from 'react';
import { hydrateEmployeeFormData } from '../../lib/employee-form-overlay';
import { positionTitle } from '../../lib/employee-org';
import { type ResignRecord } from '../../pages/Resign/resign-dummy';
import { ResignCard } from '../resign/resign-card';
import { jobLevelOptions } from '../steps/provision-step';
import { DocumentsTab } from './documents-tab';
import { EducationTab } from './education-tab';
import { ExperienceTab } from './experience-tab';
import { FinancialTab } from './financial-tab';
import { PersonalTab } from './personal-tab';
import { ProvisionTab } from './provision-tab';
import { TabBar } from './tab-bar';

const TABS = ['Personal', 'Pendidikan', 'Pengalaman', 'Ketentuan', 'Gaji & Bank', 'Dokumen Pendukung'];

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

interface DetailDialogProps {
    employee: Employee;
    /** The employee's resign request, when one exists — shows the pink pengajuan card under the profile. */
    resign?: ResignRecord | null;
    /** Wired to the card's Approve button; only rendered while the request is still awaiting approval. */
    onApprove?: () => void;
}

export function DetailDialog({ employee, resign, onApprove }: DetailDialogProps) {
    const [active, setActive] = useState(0);
    const { data } = useMemo(() => hydrateEmployeeFormData(employee), [employee]);
    const position = positionTitle(employee.id) ?? jobLevelOptions.find((option) => option.value === data.job_level)?.label ?? '-';

    // A resign row sitting at Non Aktif has already been approved; anything else is still (or back to) active.
    const isActive = resign ? resign.status !== 'Non Aktif' : employee.is_active;

    return (
        <div className="flex max-h-[80vh] w-full min-w-0 flex-col">
            {/* Judul dialog + garis pemisah */}
            <div className="shrink-0 border-b border-[#E5E5E5] px-6 py-4 pr-14">
                <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Detail Karyawan</DialogTitle>
            </div>

            {/* Body scrollable */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-6 py-5">
                {/* Header profil */}
                <div className="flex shrink-0 items-center gap-3">
                    <Avatar className="h-14 w-14">
                        {employee.profile_picture_path && (
                            <AvatarImage src={employee.profile_picture_path} alt={employee.full_name} className="object-cover" />
                        )}
                        <AvatarFallback className="font-poppins bg-[#1980C0] text-base font-semibold text-white">
                            {initials(employee.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-poppins text-base leading-tight font-bold text-[#121212]">{employee.full_name}</p>
                        <p className="font-poppins text-sm text-[#353535]">{position}</p>
                    </div>

                    <span
                        className={`ml-auto inline-flex shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                            isActive ? 'border-[#45C33A] text-[#39B52A]' : 'border-[#EF4938] text-[#EF4938]'
                        }`}
                    >
                        {isActive ? 'Aktif' : 'Non Aktif'}
                    </span>
                </div>

                {/* Ringkasan pengajuan resign */}
                {resign && (
                    <div className="shrink-0">
                        <ResignCard
                            record={resign}
                            showIdentity={false}
                            onApprove={resign.status === 'Menunggu' ? onApprove : undefined}
                        />
                    </div>
                )}

                {/* Tab bar */}
                <div className="min-w-0 shrink-0">
                    <TabBar tabs={TABS} active={active} onChange={setActive} />
                </div>

                {/* Card konten */}
                <div className="min-w-0 shrink-0 rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
                    {active === 0 && <PersonalTab employee={employee} data={data} />}
                    {active === 1 && <EducationTab data={data} />}
                    {active === 2 && <ExperienceTab data={data} />}
                    {active === 3 && <ProvisionTab data={data} />}
                    {active === 4 && <FinancialTab data={data} />}
                    {active === 5 && <DocumentsTab data={data} />}
                </div>
            </div>
        </div>
    );
}