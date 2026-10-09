import { Stepper, type StepperStep } from '@/components/design-system/stepper/stepper';
import { FileTypeIcon, FileUploadField, fileToStoredFile } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { organization } from '@/data/Organization/organization';
import { jobLevel } from '@/data/Position/jobLevel';
import { jobPosition } from '@/data/Position/jobPosition';
import { Info } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { PerubahanCard } from '../../../components/approve/perubahan-card';
import { loadDummyEmployees, type DummyEmployee } from '../../Data/employees-dummy';
import { type PengajuanPerubahan } from '../../Data/pengajuan-dummy';
import { isValidCareerContractFile } from '../storage';
import { type CareerRequestInput } from '../types';

const steps: StepperStep[] = [{ label: 'Perubahan' }, { label: 'Kontrak' }, { label: 'Kompensasi' }, { label: 'Preview' }];
const mutationChangeType = 'Mutasi';
const positionChangeType = 'Perubahan Jabatan';
const combinedChangeType = 'Mutasi & Perubahan Jabatan';

interface SelectOption {
    label: string;
    value: string;
}

const organizationOptions: SelectOption[] = organization
    .filter((unit) => unit.unit_type !== 'COMPANY')
    .map((unit) => ({ label: unit.name, value: unit.name }));

const positionOptions: SelectOption[] = jobPosition.map((position) => ({ label: position.title, value: position.title }));
const levelOptions: SelectOption[] = jobLevel.map((level) => ({ label: level.name, value: level.name }));
const contractOptions: SelectOption[] = [
    { label: 'PKWT', value: 'PKWT' },
    { label: 'PKWTT', value: 'PKWTT' },
];
const allowanceOptions: SelectOption[] = [
    { label: 'BPJS Kesehatan, Makan, Internet', value: 'BPJS Kesehatan, Makan, Internet' },
    { label: 'BPJS Kesehatan dan Makan', value: 'BPJS Kesehatan dan Makan' },
    { label: 'BPJS Kesehatan', value: 'BPJS Kesehatan' },
];
type ChangeChoice = 'no' | 'yes';

function RequiredMark() {
    return <span className="text-destructive">*</span>;
}

function formatInputDate(date: string) {
    const [year, month, day] = date.split('-');
    return year && month && day ? `${day}-${month}-${year}` : date;
}

function FieldLabel({ htmlFor, children, required = true }: { htmlFor: string; children: string; required?: boolean }) {
    return (
        <Label htmlFor={htmlFor} className="font-poppins text-xs font-semibold text-[#121212]">
            {children} {required && <RequiredMark />}
        </Label>
    );
}

function CareerSelectField({
    id,
    label,
    value,
    placeholder,
    options,
    onValueChange,
    required = true,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    options: SelectOption[];
    onValueChange: (value: string) => void;
    required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <FieldLabel htmlFor={id} required={required}>
                {label}
            </FieldLabel>
            <Select value={value} onValueChange={onValueChange} required={required}>
                <SelectTrigger id={id} className="h-11 rounded-xl">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

function ChangeChoiceGroup({
    id,
    label,
    value,
    onValueChange,
}: {
    id: string;
    label: string;
    value: ChangeChoice;
    onValueChange: (value: ChangeChoice) => void;
}) {
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="font-poppins text-xs font-semibold text-[#121212]">
                {label} <RequiredMark />
            </legend>
            <RadioGroup
                value={value}
                onValueChange={(nextValue) => onValueChange(nextValue as ChangeChoice)}
                className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2"
            >
                <Label
                    htmlFor={`${id}-no`}
                    className="font-poppins flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#C9CED6] bg-white px-3 text-xs font-normal text-[#121212] has-[[data-state=checked]]:border-[#8DD3FF] has-[[data-state=checked]]:bg-[#F0FAFF]"
                >
                    <RadioGroupItem id={`${id}-no`} value="no" className="size-4 border-[#1980C0] text-[#1980C0]" />
                    Tidak Ada
                </Label>
                <Label
                    htmlFor={`${id}-yes`}
                    className="font-poppins flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#C9CED6] bg-white px-3 text-xs font-normal text-[#121212] has-[[data-state=checked]]:border-[#8DD3FF] has-[[data-state=checked]]:bg-[#F0FAFF]"
                >
                    <RadioGroupItem id={`${id}-yes`} value="yes" className="size-4 border-[#1980C0] text-[#1980C0]" />
                    Ya, ada perubahan
                </Label>
            </RadioGroup>
        </fieldset>
    );
}

function FieldHint({ children }: { children: ReactNode }) {
    return (
        <p className="font-poppins flex items-center gap-1.5 text-[11px] text-[#667085]">
            <Info className="size-3.5 shrink-0" aria-hidden="true" />
            {children}
        </p>
    );
}

function PreviewSection({ title, rows, children }: { title: string; rows: Array<{ label: string; value: string }>; children?: ReactNode }) {
    return (
        <section className="rounded-xl border border-[#E7E7E7] p-4">
            <h3 className="font-poppins text-sm font-semibold text-[#121212]">{title}</h3>
            <dl className="mt-3 flex flex-col gap-2">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="grid min-w-0 grid-cols-1 gap-0.5 text-xs leading-5 min-[400px]:grid-cols-[120px_minmax(0,1fr)] min-[400px]:gap-3"
                    >
                        <dt className="text-[#667085]">{row.label}</dt>
                        <dd className="break-words text-[#344054]">: {row.value}</dd>
                    </div>
                ))}
            </dl>
            {children}
        </section>
    );
}

export function CareerCreateDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (input: CareerRequestInput) => void;
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [employees, setEmployees] = useState<DummyEmployee[]>([]);
    const [changeType, setChangeType] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [effectiveDate, setEffectiveDate] = useState('');
    const [reason, setReason] = useState('');
    const [targetBranch, setTargetBranch] = useState('');
    const [targetOrganization, setTargetOrganization] = useState('');
    const [targetPosition, setTargetPosition] = useState('');
    const [newLevel, setNewLevel] = useState('');
    const [directSupervisorId, setDirectSupervisorId] = useState('');
    const [contractChange, setContractChange] = useState<ChangeChoice>('yes');
    const [contractType, setContractType] = useState('PKWT');
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [compensationChange, setCompensationChange] = useState<ChangeChoice>('yes');
    const [salary, setSalary] = useState('Rp. 10.000.000');
    const [allowance, setAllowance] = useState('BPJS Kesehatan, Makan, Internet');
    const [bpjsNumber, setBpjsNumber] = useState('092389391');
    const [isSaving, setIsSaving] = useState(false);

    const selectContractFile = (file: File | null) => {
        if (file && !isValidCareerContractFile(file)) {
            toast.error('Format kontrak harus PDF, DOC, atau DOCX.');
            return;
        }

        setContractFile(file);
    };

    useEffect(() => {
        if (!open) return;
        setEmployees(loadDummyEmployees().filter((employee) => !employee.is_archived));
        setCurrentStep(1);
        setChangeType('');
        setEmployeeId('');
        setEffectiveDate('');
        setReason('');
        setTargetBranch('');
        setTargetOrganization('');
        setTargetPosition('');
        setNewLevel('');
        setDirectSupervisorId('');
        setContractChange('yes');
        setContractType('PKWT');
        setContractFile(null);
        setCompensationChange('yes');
        setSalary('Rp. 10.000.000');
        setAllowance('BPJS Kesehatan, Makan, Internet');
        setBpjsNumber('092389391');
        setIsSaving(false);
    }, [open]);

    const selectedEmployee = useMemo(() => employees.find((employee) => employee.employee_id === employeeId) ?? null, [employeeId, employees]);
    const selectedSupervisor = useMemo(
        () => employees.find((employee) => employee.employee_id === directSupervisorId) ?? null,
        [directSupervisorId, employees],
    );
    const branchOptions = useMemo<SelectOption[]>(
        () =>
            [...new Set(employees.map((employee) => employee.branch))]
                .filter((branch) => branch && branch !== selectedEmployee?.branch)
                .map((branch) => ({ label: branch, value: branch })),
        [employees, selectedEmployee?.branch],
    );
    const supervisorOptions = useMemo<SelectOption[]>(
        () =>
            employees
                .filter((employee) => employee.employee_id !== employeeId)
                .map((employee) => ({ label: `${employee.full_name} — ${employee.position}`, value: employee.employee_id })),
        [employeeId, employees],
    );
    const includesMutation = changeType === mutationChangeType || changeType === combinedChangeType;
    const includesPositionChange = changeType === positionChangeType || changeType === combinedChangeType;
    const isCombinedChange = changeType === combinedChangeType;

    const changeChangeType = (value: string) => {
        setChangeType(value);

        if (value !== mutationChangeType && value !== combinedChangeType) {
            setTargetBranch('');
        }

        if (value !== positionChangeType && value !== combinedChangeType) {
            setTargetOrganization('');
            setTargetPosition('');
            setNewLevel('');
            setDirectSupervisorId('');
        }
    };

    const changeEmployee = (value: string) => {
        const employee = employees.find((item) => item.employee_id === value);
        setEmployeeId(value);
        setDirectSupervisorId((current) => (current === value ? '' : current));
        setTargetBranch((current) => (current === employee?.branch ? '' : current));
    };

    const hasValidMutation = !includesMutation || Boolean(targetBranch);
    const hasValidPositionChange =
        !includesPositionChange || Boolean(targetOrganization && targetPosition && directSupervisorId && (isCombinedChange || newLevel));
    const hasValidContractChange = contractChange === 'no' || Boolean(contractType && contractFile);
    const hasValidCompensationChange = compensationChange === 'no' || Boolean(salary.trim() && allowance.trim() && bpjsNumber.trim());
    const canProceed =
        currentStep === 1
            ? Boolean(changeType && employeeId && effectiveDate && reason.trim() && hasValidMutation && hasValidPositionChange)
            : currentStep === 2
              ? hasValidContractChange
              : currentStep === 3
                ? hasValidCompensationChange
                : selectedEmployee !== null;

    const formattedChangeType = changeType === mutationChangeType ? 'Mutasi Cabang' : changeType.replace('Mutasi &', 'Mutasi Cabang &');

    const previewRequest = useMemo<PengajuanPerubahan | null>(() => {
        if (!selectedEmployee) return null;

        return {
            id: 'career-preview',
            employeeId: selectedEmployee.employee_id,
            name: selectedEmployee.full_name,
            role: `${selectedEmployee.position} ${selectedEmployee.organization}`,
            avatarUrl: selectedEmployee.profile_picture_path ?? undefined,
            branch: selectedEmployee.branch,
            organization: selectedEmployee.organization,
            position: selectedEmployee.position,
            status: 'Aktif',
            changes: formattedChangeType,
            submittedAt: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                .format(new Date())
                .replaceAll('/', '-'),
            fields: [
                {
                    label: 'Cabang',
                    before: selectedEmployee.branch,
                    after: includesMutation ? targetBranch : selectedEmployee.branch,
                },
                {
                    label: 'Organisasi',
                    before: selectedEmployee.organization,
                    after: includesPositionChange ? targetOrganization : selectedEmployee.organization,
                },
                {
                    label: 'Posisi Jabatan',
                    before: selectedEmployee.position,
                    after: includesPositionChange ? targetPosition : selectedEmployee.position,
                },
                {
                    label: 'Level',
                    before: selectedEmployee.position,
                    after: includesPositionChange ? newLevel || selectedEmployee.position : selectedEmployee.position,
                },
                {
                    label: 'Atasan Langsung',
                    before: '-',
                    after: includesPositionChange ? (selectedSupervisor?.full_name ?? '-') : '-',
                },
            ],
        };
    }, [
        formattedChangeType,
        includesMutation,
        includesPositionChange,
        newLevel,
        selectedEmployee,
        selectedSupervisor?.full_name,
        targetBranch,
        targetOrganization,
        targetPosition,
    ]);

    const finish = async () => {
        if (!selectedEmployee) return;

        const storedContractFile = contractChange === 'yes' && contractFile ? await fileToStoredFile(contractFile) : undefined;

        onSubmit({
            employeeId: selectedEmployee.employee_id,
            name: selectedEmployee.full_name,
            changeType,
            currentBranch: selectedEmployee.branch,
            currentOrganization: selectedEmployee.organization,
            currentPosition: selectedEmployee.position,
            targetBranch: includesMutation ? targetBranch : undefined,
            targetOrganization: includesPositionChange ? targetOrganization : undefined,
            targetPosition: includesPositionChange ? targetPosition : undefined,
            newLevel: includesPositionChange ? newLevel || undefined : undefined,
            directSupervisor: includesPositionChange ? selectedSupervisor?.full_name : undefined,
            hasContractChange: contractChange === 'yes',
            contractType: contractChange === 'yes' ? contractType : undefined,
            contractDocument: storedContractFile
                ? {
                      ...storedContractFile,
                      size: contractFile?.size ?? 0,
                      lastModified: contractFile?.lastModified ?? 0,
                  }
                : undefined,
            hasCompensationChange: compensationChange === 'yes',
            effectiveDate,
            reason: reason.trim(),
            salary: compensationChange === 'yes' ? salary.trim() : undefined,
            allowance: compensationChange === 'yes' ? allowance.trim() : undefined,
            bpjsNumber: compensationChange === 'yes' ? bpjsNumber.trim() : undefined,
        });
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canProceed) return;
        if (currentStep === steps.length) {
            setIsSaving(true);

            try {
                await finish();
            } catch {
                toast.error('Pengajuan gagal diproses. Periksa kembali dokumen atau ruang penyimpanan browser.');
            } finally {
                setIsSaving(false);
            }

            return;
        }
        setCurrentStep((step) => step + 1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="font-poppins !max-w-[56rem] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
            >
                <DialogHeader className="flex-col items-stretch gap-3 border-b border-[#E7E7E7] px-4 py-4 text-left md:flex-row md:items-center md:gap-8 md:px-5">
                    <div className="shrink-0">
                        <DialogTitle className="text-base font-semibold">Tambah Pengajuan Perubahan</DialogTitle>
                        <DialogDescription className="sr-only">
                            Isi data perubahan, kontrak, kompensasi, lalu periksa preview sebelum menyimpan.
                        </DialogDescription>
                    </div>
                    <div className="w-full min-w-0 md:flex-1">
                        <Stepper steps={steps} currentStep={currentStep} compact />
                    </div>
                </DialogHeader>

                <form id="career-create-request-form" onSubmit={submit} className="contents">
                    <div className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 md:px-5">
                        {currentStep === 1 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="career-change-type">Pilih Perubahan</FieldLabel>
                                    <Select value={changeType} onValueChange={changeChangeType}>
                                        <SelectTrigger id="career-change-type" className="h-11 rounded-xl">
                                            <SelectValue placeholder="Pilih Perubahan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={mutationChangeType}>Mutasi Cabang</SelectItem>
                                                <SelectItem value="Perubahan Jabatan">Perubahan Jabatan</SelectItem>
                                                <SelectItem value={combinedChangeType}>Mutasi Cabang &amp; Perubahan Jabatan</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="career-employee">Pilih Karyawan</FieldLabel>
                                    <Select value={employeeId} onValueChange={changeEmployee}>
                                        <SelectTrigger id="career-employee" className="h-11 rounded-xl">
                                            <SelectValue placeholder="Pilih Karyawan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {employees.map((employee) => (
                                                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                                                        {employee.full_name} — {employee.employee_id}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="career-effective-change-date">Tgl Efektif Perubahan</FieldLabel>
                                    <Input
                                        id="career-effective-change-date"
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(event) => setEffectiveDate(event.target.value)}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="career-change-reason">Alasan Perubahan</FieldLabel>
                                    <Textarea
                                        id="career-change-reason"
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                        placeholder="Masukkan Alasan Mutasi"
                                        className="min-h-24 resize-none rounded-xl"
                                        required
                                    />
                                </div>

                                {includesMutation && (
                                    <CareerSelectField
                                        id="career-target-branch"
                                        label="Pindah ke Cabang mana?"
                                        value={targetBranch}
                                        placeholder="Pilih Cabang Tujuan"
                                        options={branchOptions}
                                        onValueChange={setTargetBranch}
                                    />
                                )}

                                {includesPositionChange && (
                                    <>
                                        <CareerSelectField
                                            id="career-target-organization"
                                            label="Organisasi Baru"
                                            value={targetOrganization}
                                            placeholder="Pilih Organisasi Baru"
                                            options={organizationOptions}
                                            onValueChange={setTargetOrganization}
                                        />
                                        <CareerSelectField
                                            id="career-target-position"
                                            label="Posisi Jabatan Baru"
                                            value={targetPosition}
                                            placeholder="Pilih Posisi Jabatan Baru"
                                            options={positionOptions}
                                            onValueChange={setTargetPosition}
                                        />
                                        {isCombinedChange ? (
                                            <>
                                                <CareerSelectField
                                                    id="career-direct-supervisor"
                                                    label="Atasan Langsung"
                                                    value={directSupervisorId}
                                                    placeholder="Pilih Atasan Langsung"
                                                    options={supervisorOptions}
                                                    onValueChange={setDirectSupervisorId}
                                                />
                                                <CareerSelectField
                                                    id="career-new-level"
                                                    label="Level Baru (Opsional)"
                                                    value={newLevel}
                                                    placeholder="Pilih Level Baru"
                                                    options={levelOptions}
                                                    onValueChange={setNewLevel}
                                                    required={false}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <CareerSelectField
                                                    id="career-new-level"
                                                    label="Level Baru"
                                                    value={newLevel}
                                                    placeholder="Pilih Level Baru"
                                                    options={levelOptions}
                                                    onValueChange={setNewLevel}
                                                />
                                                <CareerSelectField
                                                    id="career-direct-supervisor"
                                                    label="Atasan Langsung"
                                                    value={directSupervisorId}
                                                    placeholder="Pilih Atasan Langsung"
                                                    options={supervisorOptions}
                                                    onValueChange={setDirectSupervisorId}
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="flex flex-col gap-4">
                                <ChangeChoiceGroup
                                    id="career-contract-change"
                                    label="Apakah ada perubahan jenis kontrak?"
                                    value={contractChange}
                                    onValueChange={setContractChange}
                                />

                                {contractChange === 'yes' && (
                                    <>
                                        <CareerSelectField
                                            id="career-contract-type"
                                            label="Perubahan Jenis Kontrak?"
                                            value={contractType}
                                            placeholder="Pilih Jenis Kontrak"
                                            options={contractOptions}
                                            onValueChange={setContractType}
                                        />
                                        <FieldHint>Kontrak sebelumnya {selectedEmployee?.employment_status ?? '-'}</FieldHint>
                                        <FileUploadField
                                            label="Upload Kontrak Terbaru"
                                            required
                                            file={contractFile}
                                            onSelect={selectContractFile}
                                            onRemove={() => setContractFile(null)}
                                            accept=".pdf,.doc,.docx"
                                            dense
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="flex flex-col gap-4">
                                <ChangeChoiceGroup
                                    id="career-compensation-change"
                                    label="Apakah ada perubahan pada gaji dan tunjangan?"
                                    value={compensationChange}
                                    onValueChange={setCompensationChange}
                                />

                                {compensationChange === 'yes' && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <FieldLabel htmlFor="career-new-salary">Gaji Terbaru</FieldLabel>
                                            <Input
                                                id="career-new-salary"
                                                value={salary}
                                                onChange={(event) => setSalary(event.target.value)}
                                                placeholder="Contoh: Rp. 10.000.000"
                                                className="h-11 rounded-xl"
                                                required
                                            />
                                            <FieldHint>Gaji sebelumnya Rp. 8.000.000</FieldHint>
                                        </div>
                                        <CareerSelectField
                                            id="career-new-allowance"
                                            label="Tunjangan Terbaru"
                                            value={allowance}
                                            placeholder="Pilih Tunjangan Terbaru"
                                            options={allowanceOptions}
                                            onValueChange={setAllowance}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <FieldLabel htmlFor="career-bpjs-number">No. BPJS Kesehatan</FieldLabel>
                                            <Input
                                                id="career-bpjs-number"
                                                value={bpjsNumber}
                                                onChange={(event) => setBpjsNumber(event.target.value)}
                                                placeholder="Masukkan nomor BPJS Kesehatan"
                                                className="h-11 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {currentStep === 4 && selectedEmployee && previewRequest && (
                            <div className="flex flex-col gap-3">
                                <PerubahanCard
                                    pengajuan={previewRequest}
                                    details={[
                                        { label: 'Alasan Perubahan', value: reason },
                                        { label: 'Tgl Efektif Diajukan', value: formatInputDate(effectiveDate) },
                                    ]}
                                    showChangeType
                                />
                                <PreviewSection
                                    title="Data Kontrak"
                                    rows={
                                        contractChange === 'yes'
                                            ? [
                                                  { label: 'Jenis Kontrak', value: contractType },
                                                  { label: 'Alasan Perubahan', value: reason },
                                              ]
                                            : [{ label: 'Status', value: 'Tidak ada perubahan kontrak' }]
                                    }
                                >
                                    {contractChange === 'yes' && contractFile && (
                                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E7E7E7] bg-white p-3">
                                            <FileTypeIcon name={contractFile.name} className="size-9" />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-[#121212]">{contractFile.name}</p>
                                                <p className="mt-0.5 text-[11px] text-[#667085]">{(contractFile.size / 1024 / 1024).toFixed(1)} Mb</p>
                                            </div>
                                        </div>
                                    )}
                                </PreviewSection>
                                <PreviewSection
                                    title="Data Kompensasi"
                                    rows={
                                        compensationChange === 'yes'
                                            ? [
                                                  { label: 'Gaji Terbaru', value: salary },
                                                  { label: 'Tunjangan Baru', value: allowance },
                                                  { label: 'No. BPJS Kesehatan', value: bpjsNumber },
                                                  { label: 'Alasan Mutasi', value: reason },
                                              ]
                                            : [{ label: 'Status', value: 'Tidak ada perubahan kompensasi' }]
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="grid grid-cols-2 gap-2 border-t border-[#E7E7E7] px-4 py-4 sm:grid sm:space-x-0 md:px-5">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl border-[#1980C0] text-xs font-semibold text-[#1980C0] hover:bg-[#EAF7FF] hover:text-[#1980C0]"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" className="h-11 rounded-xl text-xs font-semibold" disabled={!canProceed || isSaving}>
                            {currentStep === steps.length ? (isSaving ? 'Menyimpan...' : 'Simpan') : 'Selanjutnya'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
