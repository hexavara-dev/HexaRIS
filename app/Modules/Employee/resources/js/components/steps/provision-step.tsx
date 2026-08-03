import { SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { organization } from '@/data/Organization/organization';
import { useMemo } from 'react';
import { type EmployeeFormData, type FieldErrors } from '../../types/employee-form';

export const branchOptions: SelectFieldOption[] = [
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'bandung', label: 'Bandung' },
];

export const departmentOptions: SelectFieldOption[] = organization
    .filter((unit) => unit.unit_type === 'DEPARTMENT')
    .map((unit) => ({ value: unit.id, label: unit.name }));

export const jobLevelOptions: SelectFieldOption[] = [
    { value: 'manajer', label: 'Manajer' },
    { value: 'direksi', label: 'Direksi' },
    { value: 'senior', label: 'Senior' },
    { value: 'junior', label: 'Junior' },
];

// Mirrors ContractType in @/data/Employee/employmentContract.
export const contractOptions: SelectFieldOption[] = [
    { value: 'permanent', label: 'Permanent (PKWTT)' },
    { value: 'contract', label: 'Contract (PKWT)' },
    { value: 'internship', label: 'Internship' },
    { value: 'outsource', label: 'Outsource' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'other', label: 'Lainnya' },
];

interface ProvisionStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function ProvisionStep({ data, setData, errors }: ProvisionStepProps) {
    const divisionOptions = useMemo<SelectFieldOption[]>(
        () =>
            organization
                .filter((unit) => unit.unit_type === 'DIVISION' && unit.parent_id === data.department_id)
                .map((unit) => ({ value: unit.id, label: unit.name })),
        [data.department_id],
    );

    const selectDepartment = (value: string) => {
        setData('department_id', value);
        setData('division_id', '');
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <SelectField
                label="Cabang (Opsional)"
                htmlFor="branch"
                options={branchOptions}
                value={data.branch}
                onValueChange={(v) => setData('branch', v)}
                error={errors.branch}
                placeholder="Pilih Cabang"
            />
            <SelectField
                label="Level (Opsional)"
                htmlFor="job_level"
                options={jobLevelOptions}
                value={data.job_level}
                onValueChange={(v) => setData('job_level', v)}
                error={errors.job_level}
                placeholder="Pilih Level"
            />

            <SelectField
                label="Departemen"
                htmlFor="department_id"
                required
                options={departmentOptions}
                value={data.department_id}
                onValueChange={selectDepartment}
                error={errors.department_id}
                placeholder="Pilih Departemen"
            />
            <SelectField
                label="Kontrak"
                htmlFor="contract_type"
                required
                options={contractOptions}
                value={data.contract_type}
                onValueChange={(v) => setData('contract_type', v)}
                error={errors.contract_type}
                placeholder="Pilih Kontrak"
            />

            <SelectField
                label="Divisi"
                htmlFor="division_id"
                required
                options={divisionOptions}
                value={data.division_id}
                onValueChange={(v) => setData('division_id', v)}
                error={errors.division_id}
                placeholder={data.department_id ? 'Pilih Divisi' : 'Pilih departemen dulu'}
                disabled={!data.department_id}
            />
            <TextField
                label="Tgl Gabung"
                htmlFor="join_date"
                required
                type="date"
                value={data.join_date}
                onChange={(v) => setData('join_date', v)}
                error={errors.join_date}
            />
        </div>
    );
}
