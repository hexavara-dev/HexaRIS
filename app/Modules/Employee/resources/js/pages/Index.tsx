import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { OverviewCard } from '@/components/design-system/card/overview-card';
import { StepForm, type Step } from '@/components/step-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { employee, type Employee } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EducationStep } from '../components/steps/education-step';
import { ExperienceStep } from '../components/steps/experience-step';
import { FinancialStep } from '../components/steps/financial-step';
import { PersonalStep } from '../components/steps/personal-step';
import { PreviewStep } from '../components/steps/preview-step';
import { ProvisionStep } from '../components/steps/provision-step';
import { DetailDialog } from '../components/detail/detail-dialog';
import { hydrateEmployeeFormData, saveFormOverlay } from '../lib/employee-form-overlay';
import {
    applyFormDataToEmployee,
    loadEmployeeOverrides,
    loadLocalEmployees,
    saveEmployeeOverride,
    saveLocalEmployee,
    updateLocalEmployee,
    wizardEditableFields,
} from '../lib/employee-storage';
import { validateEmployeeForm } from '../lib/validate-employee-form';
import { createEmptyFileFieldFlags, initialEmployeeFormData, type EmployeeFormData, type FieldErrors, type FileFieldFlags } from '../types/employee-form';
import { ArchiveConfirmDialog } from '../components/archive-confirm-dialog';
import { buildEmployeeColumns } from './columns';

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
    const [overrides, setOverrides] = useState(loadEmployeeOverrides);
    const [validationErrors, setValidationErrors] = useState<FieldErrors>({});
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null);
    const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
    const [fileFlags, setFileFlags] = useState<FileFieldFlags>(createEmptyFileFieldFlags());
    const [saving, setSaving] = useState(false);
    const { data, setData, processing, reset } = useForm<EmployeeFormData>(initialEmployeeFormData);

    const allEmployees = useMemo(
        () => [...employee.map((e) => ({ ...e, ...overrides[e.id] })), ...localEmployees].filter((e) => !e.is_archived),
        [overrides, localEmployees],
    );

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
        setEditingEmployee(null);
        setFileFlags(createEmptyFileFieldFlags());
    };

    const openCreate = () => {
        setEditingEmployee(null);
        reset();
        setFileFlags(createEmptyFileFieldFlags());
        setValidationErrors({});
        setOpen(true);
    };

    const openEdit = useCallback(
        (row: Employee) => {
            const hydrated = hydrateEmployeeFormData(row);
            setEditingEmployee(row);
            setData(hydrated.data);
            setFileFlags(hydrated.fileFlags);
            setValidationErrors({});
            setOpen(true);
        },
        [setData],
    );

    const onArchive = useCallback((row: Employee) => setArchiveTarget(row), []);

    const confirmArchive = () => {
        if (!archiveTarget) return;
        if (localEmployees.some((e) => e.id === archiveTarget.id)) {
            setLocalEmployees(updateLocalEmployee(archiveTarget.id, { ...archiveTarget, is_archived: true }));
        } else {
            setOverrides(saveEmployeeOverride(archiveTarget.id, { is_archived: true }));
        }
        toast.success(`${archiveTarget.full_name} berhasil diarsipkan.`);
        setArchiveTarget(null);
    };

    const openDetail = useCallback((row: Employee) => setDetailEmployee(row), []);

    const columns = useMemo(
        () => buildEmployeeColumns(openEdit, openDetail, onArchive),
        [openEdit, openDetail, onArchive],
    );

    const steps: Step[] = [
        { label: 'Personal', content: <PersonalStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pendidikan', content: <EducationStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pengalaman', content: <ExperienceStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Ketentuan', content: <ProvisionStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Gaji & Bank', content: <FinancialStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pratinjau', content: <PreviewStep data={data} /> },
    ];

    const finish = async () => {
        const nextErrors = validateEmployeeForm(data, fileFlags);
        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi seluruh field yang wajib diisi sebelum menyimpan.');
            return;
        }

        if (saving) return;

        setValidationErrors({});
        setSaving(true);

        try {
            if (editingEmployee) {
                if (localEmployees.some((e) => e.id === editingEmployee.id)) {
                    setLocalEmployees(updateLocalEmployee(editingEmployee.id, applyFormDataToEmployee(editingEmployee, data)));
                } else {
                    // Only the wizard-editable subset, never the full merged Employee — otherwise this
                    // override would freeze every other column (email, NIK, blood type, ...) at whatever
                    // they happened to be on this one edit, hiding any later change to the seed fixture.
                    setOverrides(saveEmployeeOverride(editingEmployee.id, wizardEditableFields(data)));
                }
                await saveFormOverlay(editingEmployee.id, data, fileFlags);
                toast.success(`${data.full_name} berhasil diperbarui.`);
            } else {
                const { employees, created } = saveLocalEmployee(data);
                setLocalEmployees(employees);
                await saveFormOverlay(created.id, data, fileFlags);
                toast.success(`${data.full_name} berhasil ditambahkan.`);
            }

            close();
        } catch {
            toast.error('Gagal menyimpan — coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <OverviewCard title={`Overview of ${latestJoinYear}`} stats={overviewStats} />
                <DataTable
                    columns={columns}
                    data={allEmployees}
                    search={employeeSearch}
                    filters={employeeFilters}
                    actions={
                        <Dialog
                            open={open}
                            onOpenChange={(open) => {
                                setOpen(open);
                                if (!open) close();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm" className="font-poppins bg-[#1980C0] hover:bg-[#1668a0]" onClick={openCreate}>
                                    Tambah Karyawan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="flex max-w-4xl flex-col gap-0" onInteractOutside={(e) => e.preventDefault()}>
                                <StepForm
                                    steps={steps}
                                    title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                                    finishLabel={editingEmployee ? 'Perbarui' : 'Simpan'}
                                    processing={processing || saving}
                                    onCancel={close}
                                    onFinish={finish}
                                />
                            </DialogContent>
                        </Dialog>
                    }
                />
                <ArchiveConfirmDialog
                    employeeName={archiveTarget?.full_name ?? ''}
                    open={archiveTarget !== null}
                    onOpenChange={(open) => !open && setArchiveTarget(null)}
                    onConfirm={confirmArchive}
                />
                <Dialog open={detailEmployee !== null} onOpenChange={(open) => !open && setDetailEmployee(null)}>
                    <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogDescription className="sr-only">Detail data karyawan {detailEmployee?.full_name}</DialogDescription>
                        {detailEmployee && <DetailDialog employee={detailEmployee} />}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
