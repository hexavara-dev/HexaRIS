import { createEmptyFileFieldFlags, type EmployeeFormData, type FieldErrors, type FileFieldFlags } from '../types/employee-form';

const REQUIRED_MESSAGE = 'Wajib diisi.';

function requireText(errors: FieldErrors, key: string, value: string) {
    if (!value.trim()) errors[key] = REQUIRED_MESSAGE;
}

function requireFile(errors: FieldErrors, key: string, value: File | null, hadBefore: boolean) {
    if (!value && !hadBefore) errors[key] = REQUIRED_MESSAGE;
}

/** Client-side stand-in for backend validation — there is no employees.store route yet. */
export function validateEmployeeForm(data: EmployeeFormData, fileFlags: FileFieldFlags = createEmptyFileFieldFlags()): FieldErrors {
    const errors: FieldErrors = {};

    requireText(errors, 'full_name', data.full_name);
    requireText(errors, 'phone_number', data.phone_number);
    requireText(errors, 'gender', data.gender);
    requireText(errors, 'religion', data.religion);
    requireText(errors, 'birth_date', data.birth_date);
    requireText(errors, 'province_id', data.province_id);
    requireText(errors, 'regency_id', data.regency_id);
    requireText(errors, 'address', data.address);
    requireFile(errors, 'ktp', data.ktp, fileFlags.ktp);
    requireFile(errors, 'contract', data.contract, fileFlags.contract);

    requireText(errors, 'education.level', data.education.level);
    requireText(errors, 'education.institution', data.education.institution);
    requireText(errors, 'education.major', data.education.major);
    requireText(errors, 'education.start_date', data.education.start_date);
    requireText(errors, 'education.end_date', data.education.end_date);
    requireText(errors, 'education.final_score', data.education.final_score);
    requireFile(errors, 'education.certificate', data.education.certificate, fileFlags.educationCertificate);

    data.work_experiences.forEach((experience, index) => {
        requireText(errors, `work_experiences.${index}.company_name`, experience.company_name);
        requireText(errors, `work_experiences.${index}.employment_type`, experience.employment_type);
        requireText(errors, `work_experiences.${index}.position`, experience.position);
        requireText(errors, `work_experiences.${index}.description`, experience.description);
        requireText(errors, `work_experiences.${index}.start_date`, experience.start_date);
        requireText(errors, `work_experiences.${index}.end_date`, experience.end_date);
    });

    requireText(errors, 'department_id', data.department_id);
    requireText(errors, 'division_id', data.division_id);
    requireText(errors, 'contract_type', data.contract_type);
    requireText(errors, 'join_date', data.join_date);

    requireText(errors, 'bank_name', data.bank_name);
    requireText(errors, 'basic_salary', data.basic_salary);
    requireText(errors, 'bank_account_holder', data.bank_account_holder);
    requireText(errors, 'bank_account_number', data.bank_account_number);

    return errors;
}
