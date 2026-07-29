import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { OverviewCard } from '@/components/design-system/card/overview-card';
import { StepForm, type Step } from '@/components/step-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PersonalStep } from '../components/steps/personal-step';
import { initialEmployeeFormData, type EmployeeFormData } from '../types/employee-form';
import { employeeColumns } from './columns';

function ComingSoon({ label }: { label: string }) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-[#ACACAC]">
            <p className="font-poppins text-sm text-[#808080]">Field untuk step "{label}" belum didefinisikan.</p>
        </div>
    );
}

const latestJoinYear = Math.max(...employee.map((e) => new Date(e.join_date).getFullYear()));

const overviewStats = [
    { label: 'Total Karyawan Aktif', value: employee.filter((e) => e.is_active).length, icon: UserCheck },
    { label: 'Karyawan Non Aktif', value: employee.filter((e) => !e.is_active).length, icon: UserX },
    {
        label: 'Karyawan Baru',
        value: employee.filter((e) => new Date(e.join_date).getFullYear() === latestJoinYear).length,
        icon: UserPlus,
    },
];

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
    const { data, setData, errors, processing, reset } = useForm<EmployeeFormData>(initialEmployeeFormData);

    const close = () => {
        setOpen(false);
        reset();
    };

    const steps: Step[] = [
        { label: 'Personal', content: <PersonalStep data={data} setData={setData} errors={errors} /> },
        { label: 'Pendidikan', content: <ComingSoon label="Pendidikan" /> },
        { label: 'Pengalaman', content: <ComingSoon label="Pengalaman" /> },
        { label: 'Ketentuan', content: <ComingSoon label="Ketentuan" /> },
        { label: 'Gaji & Bank', content: <ComingSoon label="Gaji & Bank" /> },
        { label: 'Pratinjau', content: <ComingSoon label="Pratinjau" /> },
    ];

    const finish = () => {
        toast.info('Form belum tersambung ke backend — data tidak disimpan.');
        close();
    };

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <OverviewCard title={`Overview of ${latestJoinYear}`} stats={overviewStats} />
                <DataTable
                    columns={employeeColumns}
                    data={employee}
                    search={employeeSearch}
                    filters={employeeFilters}
                    actions={
                        <Dialog
                            open={open}
                            onOpenChange={(open) => {
                                setOpen(open);
                                if (!open) reset();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button className="font-poppins h-9 bg-[#1980C0] hover:bg-[#1668a0]">Tambah Karyawan</Button>
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
