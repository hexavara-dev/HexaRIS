
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    resign?: ResignRecord | null;
    onApprove?: () => void;
}

export function DetailDialog({ employee, resign, onApprove }: DetailDialogProps) {
    const [active, setActive] = useState(0);
    const { data } = useMemo(() => hydrateEmployeeFormData(employee), [employee]);

    const position = positionTitle(employee.id) ?? jobLevelOptions.find((option) => option.value === data.job_level)?.label ?? '-';
    const isActive = resign ? resign.status !== 'Non Aktif' : employee.is_active;
    const canApprove = resign?.status === 'Menunggu' && !!onApprove;

    const employeeIdentity = (
        <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-11 shrink-0">
                {employee.profile_picture_path && (
                    <AvatarImage src={employee.profile_picture_path} alt={employee.full_name} className="object-cover" />
                )}
                <AvatarFallback className="font-poppins bg-[#1980C0] text-sm font-semibold text-white">
                    {initials(employee.full_name)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
                <p className="font-poppins truncate text-sm font-semibold text-[#121212]">{employee.full_name}</p>
                <p className="font-poppins text-xs text-[#353535]">{position}</p>
            </div>
        </div>
    );

    return (
        <div className="flex max-h-[90vh] w-full min-w-0 flex-col">
            {/* Dialog Header */}
            <div className="shrink-0 border-b border-[#E5E5E5] px-5 py-3 pr-12">
                <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">Detail Karyawan</DialogTitle>
            </div>

            {/* Dialog Content */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 py-4">
                {resign ? (
                    /* Resign Request Card */
                    <div className="shrink-0 rounded-xl border border-[#FF928C] bg-[#FFE9E7] p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {employeeIdentity}

                            {canApprove && (
                                <Button type="button" onClick={onApprove} className="h-9 rounded-lg bg-[#1980C0] px-5 text-xs font-semibold text-white hover:bg-[#1673AD]">
                                    Approve
                                </Button>
                            )}

                            <span className={`ml-auto shrink-0 text-xs font-medium ${isActive ? 'text-[#39B52A]' : 'text-[#EF4938]'}`}>
                                {isActive ? 'Aktif' : 'Non Aktif'}
                            </span>
                        </div>

                        {/* Resign Information */}
                        <div className="mt-3 rounded-lg border border-[#FF8178] bg-white p-3">
                            <div className="[&>*]:!m-0 [&>*]:!rounded-none [&>*]:!border-0 [&>*]:!bg-transparent [&>*]:!p-0 [&>*]:!shadow-none">
                                <ResignCard record={resign} showIdentity={false} />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Regular Employee Profile */
                    <div className="flex shrink-0 items-center justify-between gap-3">
                        {employeeIdentity}

                        <span className={`shrink-0 text-xs font-medium ${isActive ? 'text-[#39B52A]' : 'text-[#EF4938]'}`}>
                            {isActive ? 'Aktif' : 'Non Aktif'}
                        </span>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="min-w-0 shrink-0 overflow-x-auto">
                    <TabBar tabs={TABS} active={active} onChange={setActive} />
                </div>

                {/* Tab Contents */}
                <div className="min-w-0 shrink-0">
                    {active === 0 ? (
                        <PersonalTab employee={employee} data={data} />
                    ) : (
                        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
                            {active === 1 && <EducationTab data={data} />}
                            {active === 2 && <ExperienceTab data={data} />}
                            {active === 3 && <ProvisionTab data={data} />}
                            {active === 4 && <FinancialTab data={data} />}
                            {active === 5 && <DocumentsTab data={data} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
