import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogTitle } from '@/components/ui/dialog';
import { type Employee } from '@/data/Employee/employee';
import { useMemo, useState } from 'react';
import { hydrateEmployeeFormData } from '../../lib/employee-form-overlay';
import { positionTitle } from '../../lib/employee-org';
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
}

export function DetailDialog({ employee }: DetailDialogProps) {
    const [active, setActive] = useState(0);
    const { data } = useMemo(() => hydrateEmployeeFormData(employee), [employee]);
    const position = positionTitle(employee.id) ?? jobLevelOptions.find((option) => option.value === data.job_level)?.label ?? '-';

    return (
        <div className="flex max-h-[85vh] flex-col gap-5 px-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                    {employee.profile_picture_path && <AvatarImage src={employee.profile_picture_path} alt={employee.full_name} />}
                    <AvatarFallback className="font-poppins text-base font-semibold">{initials(employee.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">{employee.full_name}</DialogTitle>
                    <p className="font-poppins text-sm text-[#8F8F8F]">{position}</p>
                </div>
            </div>

            <TabBar tabs={TABS} active={active} onChange={setActive} />

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                {active === 0 && <PersonalTab employee={employee} data={data} />}
                {active === 1 && <EducationTab data={data} />}
                {active === 2 && <ExperienceTab data={data} />}
                {active === 3 && <ProvisionTab data={data} />}
                {active === 4 && <FinancialTab data={data} />}
                {active === 5 && <DocumentsTab data={data} />}
            </div>
        </div>
    );
}
