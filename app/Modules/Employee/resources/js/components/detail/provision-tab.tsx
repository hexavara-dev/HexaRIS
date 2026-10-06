import { formatDate, labelFor, orgUnitName } from '../../lib/format-employee-form';
import { branchOptions, contractEvaluationOptions, contractOptions, jobLevelOptions, positionOptions } from '../steps/provision-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

export function ProvisionTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Cabang" value={labelFor(branchOptions, data.branch)} />
            <DetailField label="Level" value={labelFor(jobLevelOptions, data.job_level)} />
            <DetailField label="Organisasi" value={orgUnitName(data.department_id)} />
            <DetailField label="Posisi Jabatan" value={labelFor(positionOptions, data.division_id)} />
            <DetailField label="Kontrak" value={labelFor(contractOptions, data.contract_type)} />
            {data.contract_type === 'permanent' && (
                <DetailField label="Evaluasi Kontrak" value={labelFor(contractEvaluationOptions, data.contract_evaluation)} />
            )}
            <DetailField label="Tgl Gabung" value={formatDate(data.join_date)} />
        </div>
    );
}
