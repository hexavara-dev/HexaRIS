import { organization } from '@/data/Organization/organization';
import { type EmployeeFormData, type FieldErrors } from '../../types/employee-form';
import { SelectField, TextField, type SelectFieldOption } from './wizard-fields';

export const branchOptions: SelectFieldOption[] = [
    { value: 'none', label: 'Tidak Ada Cabang' },
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

/**
 * Posisi Jabatan — a fixed job-title list, matching the Level chips in the list
 * filter and the position column in the table. It no longer depends on the
 * picked Organisasi (division units in the ERD data were empty), so the select
 * always offers the same options on its own.
 */
export const positionOptions: SelectFieldOption[] = [
    { value: 'Kepala Bagian', label: 'Kepala Bagian' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Senior Staff', label: 'Senior Staff' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Staff', label: 'Staff' },
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

/** How often a Permanent (PKWTT) contract is reviewed — only collected for that contract type. */
export const contractEvaluationOptions: SelectFieldOption[] = [
    { value: '6_months', label: '6 Bulan' },
    { value: '1_year', label: '1 Tahun' },
    { value: '2_years', label: '2 Tahun' },
];

interface ProvisionStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function ProvisionStep({ data, setData, errors }: ProvisionStepProps) {
    const selectDepartment = (value: string) => {
        setData('department_id', value);
    };

    // Evaluasi Kontrak only applies to Permanent (PKWTT) — drop a stale pick
    // when the contract type changes so it can't survive into Pratinjau.
    const selectContractType = (value: string) => {
        setData('contract_type', value);
        setData('contract_evaluation', '');
    };

    return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <SelectField
                label="Cabang"
                htmlFor="branch"
                required
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
                label="Organisasi (Opsional)"
                htmlFor="department_id"
                options={departmentOptions}
                value={data.department_id}
                onValueChange={selectDepartment}
                error={errors.department_id}
                placeholder="Pilih Organisasi"
            />
            <SelectField
                label="Kontrak"
                htmlFor="contract_type"
                required
                options={contractOptions}
                value={data.contract_type}
                onValueChange={selectContractType}
                error={errors.contract_type}
                placeholder="Pilih Kontrak"
            />

            <SelectField
                label="Posisi Jabatan (Opsional)"
                htmlFor="division_id"
                options={positionOptions}
                value={data.division_id}
                onValueChange={(v) => setData('division_id', v)}
                error={errors.division_id}
                placeholder="Pilih Posisi Jabatan"
            />
            {/* Tgl Gabung and Evaluasi Kontrak trade places: Evaluasi takes the
                right-hand cell of this row (PKWTT only) and Tgl Gabung sits
                directly below it. Both are pinned to column 2 — a bare grid
                item would fall into the empty left cell instead. */}
            {data.contract_type === 'permanent' && (
                <div className="col-start-2">
                    <SelectField
                        label="Evaluasi Kontrak"
                        htmlFor="contract_evaluation"
                        required
                        options={contractEvaluationOptions}
                        value={data.contract_evaluation}
                        onValueChange={(v) => setData('contract_evaluation', v)}
                        error={errors.contract_evaluation}
                        placeholder="Pilih Periode Evaluasi"
                    />
                </div>
            )}
            <div className="col-start-2">
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
        </div>
    );
}
