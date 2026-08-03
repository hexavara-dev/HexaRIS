import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { OverviewCard } from '@/components/design-system/card/overview-card';
import { StepForm, type Step } from '@/components/step-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EducationStep } from '../components/steps/education-step';
import { ExperienceStep } from '../components/steps/experience-step';
import { FinancialStep } from '../components/steps/financial-step';
import { PersonalStep } from '../components/steps/personal-step';
import { PreviewStep } from '../components/steps/preview-step';
import { ProvisionStep } from '../components/steps/provision-step';
import { loadLocalEmployees, saveLocalEmployee } from '../lib/employee-storage';
import { validateEmployeeForm } from '../lib/validate-employee-form';
import { initialEmployeeFormData, type EmployeeFormData, type FieldErrors } from '../types/employee-form';
import { employeeColumns } from './columns';

const employeeSearch: SearchConfig = {
    keys: ['full_name', 'email_self'],
    placeholder: 'Cari nama atau email…',
};

const employeeFilters: FilterConfig[] = [
    {
        key: 'employment_type',
        type: 'select',
        label: 'Tipe Kerja',
        options: [
            { value: 'full-time', label: 'Full-time' },
            { value: 'part-time', label: 'Part-time' },
        ],
    },
];

export default function Index() {
    const [open, setOpen] = useState(false);
    const [localEmployees, setLocalEmployees] = useState(loadLocalEmployees);
    const [validationErrors, setValidationErrors] = useState<FieldErrors>({});
    const { data, setData, processing, reset } = useForm<EmployeeFormData>(initialEmployeeFormData);

    const allEmployees = useMemo(() => [...employee, ...localEmployees], [localEmployees]);

    const latestJoinYear = useMemo(() => Math.max(...allEmployees.map((e) => new Date(e.join_date).getFullYear())), [allEmployees]);

    const overviewStats = useMemo(
        () => [
            { label: 'Total Karyawan Aktif', value: allEmployees.filter((e) => e.is_active).length, icon: UserCheck },
            { label: 'Karyawan Non Aktif', value: allEmployees.filter((e) => !e.is_active).length, icon: UserX },
            {
                label: 'Karyawan Baru',
                value: allEmployees.filter((e) => new Date(e.join_date).getFullYear() === latestJoinYear).length,
                icon: UserPlus,
            },
        ],
        [allEmployees, latestJoinYear],
    );

    const close = () => {
        setOpen(false);
        reset();
        setValidationErrors({});
    };

    const steps: Step[] /*  */= [
        { label: 'Personal', content: <PersonalStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pendidikan', content: <EducationStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pengalaman', content: <ExperienceStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Ketentuan', content: <ProvisionStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Gaji & Bank', content: <FinancialStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pratinjau', content: <PreviewStep data={data} /> },
    ];

    const finish = () => {
        const nextErrors = validateEmployeeForm(data);
        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi seluruh field yang wajib diisi sebelum menyimpan.');
            return;
        }

        setValidationErrors({});
        setLocalEmployees(saveLocalEmployee(data));
        toast.success(`${data.full_name} berhasil ditambahkan.`);
        close();
    };

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <OverviewCard title={`Overview of ${latestJoinYear}`} stats={overviewStats} />
                <DataTable
                    columns={employeeColumns}
                    data={allEmployees}
                    search={employeeSearch}
                    filters={employeeFilters}
                    actions={
                        <Dialog
                            open={open}
                            onOpenChange={(open) => {
                                setOpen(open);
                                if (!open) {
                                    reset();
                                    setValidationErrors({});
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm" className="font-poppins bg-[#1980C0] hover:bg-[#1668a0]">
                                    Tambah Karyawan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="flex max-w-4xl flex-col gap-0" onInteractOutside={(e) => e.preventDefault()}>
                                <StepForm
                                    steps={steps}
                                    title="Tambah Karyawan"
                                    processing={processing}
                                    onCancel={close}
                                    onFinish={finish}
                                />
                            </DialogContent>
                        </Dialog>
                    }
                />
            </div>
        </AppLayout>
    );
}
