import { SelectField, TextField, type SelectFieldOption } from '@/components/form/form-field';
import { employee } from '@/data/Employee/employee';
import { organization } from '@/data/Organization/organization';
import { jobLevel } from '@/data/Position/jobLevel';
import { jobPosition } from '@/data/Position/jobPosition';
import { useMemo } from 'react';
import { type EmployeeFormData } from '../../types/employee-form';

export const branchOptions: SelectFieldOption[] = [
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'bandung', label: 'Bandung' },
];

export const departmentOptions: SelectFieldOption[] = organization
    .filter((unit) => unit.unit_type === 'DEPARTMENT')
    .map((unit) => ({ value: unit.id, label: unit.name }));

// Mirrors ContractType in @/data/Employee/employmentContract.
export const contractOptions: SelectFieldOption[] = [
    { value: 'permanent', label: 'Permanent (PKWTT)' },
    { value: 'contract', label: 'Contract (PKWT)' },
    { value: 'internship', label: 'Internship' },
    { value: 'outsource', label: 'Outsource' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'other', label: 'Lainnya' },
];

export const directManagerOptions: SelectFieldOption[] = [...employee]
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((e) => ({ value: e.id, label: e.full_name }));

/**
 * There is no independent "job level" selection in the real schema —
 * EmployeeAssignment has no job_level_id column, only job_position_id. Level
 * is always read through JobPosition.job_level_id, so it is derived here
 * rather than stored as its own form field.
 */
export function jobLevelNameForPosition(jobPositionId: string): string | null {
    const position = jobPosition.find((p) => p.id === jobPositionId);
    if (!position) return null;
    return jobLevel.find((level) => level.id === position.job_level_id)?.name ?? null;
}

interface ProvisionStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: Partial<Record<keyof EmployeeFormData, string>>;
}

export function ProvisionStep({ data, setData, errors }: ProvisionStepProps) {
    const divisionOptions = useMemo<SelectFieldOption[]>(
        () =>
            organization
                .filter((unit) => unit.unit_type === 'DIVISION' && unit.parent_id === data.department_id)
                .map((unit) => ({ value: unit.id, label: unit.name })),
        [data.department_id],
    );

    // Positions are attached to whichever unit is most specific — the division
    // if one was picked, otherwise the department itself (departments without
    // divisions, e.g. Finance/Operasional, hold their positions directly).
    const selectedUnitId = data.division_id || data.department_id;

    const jobPositionOptions = useMemo<SelectFieldOption[]>(
        () => jobPosition.filter((p) => p.organization_unit_id === selectedUnitId).map((p) => ({ value: p.id, label: p.title })),
        [selectedUnitId],
    );

    const levelName = jobLevelNameForPosition(data.job_position_id);

    // A division belongs to exactly one department, and a position to exactly
    // one unit — clear the dependent selections whenever their parent changes.
    const selectDepartment = (value: string) => {
        setData('department_id', value);
        setData('division_id', '');
        setData('job_position_id', '');
    };

    const selectDivision = (value: string) => {
        setData('division_id', value);
        setData('job_position_id', '');
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
                label="Divisi"
                htmlFor="division_id"
                required
                options={divisionOptions}
                value={data.division_id}
                onValueChange={selectDivision}
                error={errors.division_id}
                placeholder={data.department_id ? 'Pilih Divisi' : 'Pilih departemen dulu'}
                disabled={!data.department_id}
            />
            <SelectField
                label="Jabatan"
                htmlFor="job_position_id"
                required
                options={jobPositionOptions}
                value={data.job_position_id}
                onValueChange={(v) => setData('job_position_id', v)}
                error={errors.job_position_id}
                placeholder={selectedUnitId ? 'Pilih Jabatan' : 'Pilih departemen dulu'}
                disabled={!selectedUnitId}
            />

            <SelectField
                label="Level"
                htmlFor="level_derived"
                options={levelName ? [{ value: data.job_position_id, label: levelName }] : []}
                value={data.job_position_id}
                onValueChange={() => {}}
                placeholder={levelName ?? 'Pilih jabatan dulu'}
                disabled
            />
            <SelectField
                label="Atasan Langsung"
                htmlFor="direct_manager_id"
                required
                options={directManagerOptions}
                value={data.direct_manager_id}
                onValueChange={(v) => setData('direct_manager_id', v)}
                error={errors.direct_manager_id}
                placeholder="Pilih atasan langsung"
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
