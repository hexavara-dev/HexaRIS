import { type StoredFile } from '@/components/form/form-field';
import { createEmptyFileFieldFlags, type EmployeeFormData, type FieldErrors, type FileFieldFlags } from '../types/employee-form';

const REQUIRED_MESSAGE = 'Wajib diisi.';

/** Letters (any script) plus name punctuation — digits and symbols are rejected. */
const NAME_PATTERN = /^[\p{L}][\p{L}' .-]*$/u;
/** Plain Indonesian numbers: 9–15 digits, separators stripped before testing. */
const PHONE_PATTERN = /^\d{9,15}$/;
const DIGITS_PATTERN = /^\d+$/;
const SCORE_PATTERN = /^\d+([.,]\d{1,2})?$/;

function requireText(errors: FieldErrors, key: string, value: string) {
    if (!value.trim()) errors[key] = REQUIRED_MESSAGE;
}

/**
 * Format check for a filled-in field — runs only when the value is present, so
 * the required message and the format message never fight over the same slot.
 */
function requireFormat(errors: FieldErrors, key: string, value: string, pattern: RegExp, message: string) {
    const trimmed = value.trim();

    if (trimmed && !pattern.test(trimmed)) errors[key] = message;
}

function requireFile(errors: FieldErrors, key: string, value: File | StoredFile | null, hadBefore: boolean) {
    if (!value && !hadBefore) errors[key] = REQUIRED_MESSAGE;
}

/**
 * Nomor WA: accepts the usual separators (spaces, dashes, brackets, leading +)
 * but the digits themselves must form a plausible 9–15 digit number, so a
 * placeholder like "ad" is flagged instead of passing as "filled in".
 */
function requirePhone(errors: FieldErrors, key: string, value: string) {
    const trimmed = value.trim();

    if (!trimmed) return;

    const digits = trimmed.replace(/\D/g, '');

    if (!digits || !PHONE_PATTERN.test(digits) || /^[\s()+-]+$/.test(trimmed)) {
        errors[key] = 'Nomor WA tidak valid.';
    }
}

type StepValidator = (data: EmployeeFormData, fileFlags: FileFieldFlags) => FieldErrors;

// One validator per wizard step (indexes match the steps array in
// EmployeeFormDialog), so "Selanjutnya" can block on just the visible step
// instead of reporting every empty field across the whole wizard at once.
const personal: StepValidator = (data, fileFlags) => {
    const errors: FieldErrors = {};

    requireText(errors, 'full_name', data.full_name);
    requireFormat(errors, 'full_name', data.full_name, NAME_PATTERN, 'Nama hanya boleh huruf.');
    requireText(errors, 'phone_number', data.phone_number);
    requirePhone(errors, 'phone_number', data.phone_number);
    requireText(errors, 'gender', data.gender);
    requireText(errors, 'religion', data.religion);
    requireText(errors, 'birth_date', data.birth_date);
    requireText(errors, 'province_id', data.province_id);
    requireText(errors, 'regency_id', data.regency_id);
    requireText(errors, 'address', data.address);
    requireFile(errors, 'ktp', data.ktp, fileFlags.ktp);
    requireFile(errors, 'contract', data.contract, fileFlags.contract);

    return errors;
};

const education: StepValidator = (data, fileFlags) => {
    const errors: FieldErrors = {};

    requireText(errors, 'education.level', data.education.level);
    requireText(errors, 'education.institution', data.education.institution);
    requireText(errors, 'education.major', data.education.major);
    requireText(errors, 'education.start_date', data.education.start_date);
    requireText(errors, 'education.end_date', data.education.end_date);
    requireText(errors, 'education.final_score', data.education.final_score);
    requireFormat(errors, 'education.final_score', data.education.final_score, SCORE_PATTERN, 'Nilai akhir tidak valid.');
    requireFile(errors, 'education.certificate', data.education.certificate, fileFlags.educationCertificate);

    return errors;
};

const experience: StepValidator = (data) => {
    const errors: FieldErrors = {};

    data.work_experiences.forEach((experienceEntry, index) => {
        requireText(errors, `work_experiences.${index}.company_name`, experienceEntry.company_name);
        requireText(errors, `work_experiences.${index}.employment_type`, experienceEntry.employment_type);
        requireText(errors, `work_experiences.${index}.position`, experienceEntry.position);
        requireText(errors, `work_experiences.${index}.description`, experienceEntry.description);
        requireText(errors, `work_experiences.${index}.start_date`, experienceEntry.start_date);
        requireText(errors, `work_experiences.${index}.end_date`, experienceEntry.end_date);
    });

    return errors;
};

const provision: StepValidator = (data) => {
    const errors: FieldErrors = {};

    // Organisasi & Posisi Jabatan are optional by design ("(Opsional)"),
    // so neither department_id nor its division_id is validated here.
    requireText(errors, 'branch', data.branch);
    requireText(errors, 'contract_type', data.contract_type);
    // Evaluasi Kontrak only exists for Permanent (PKWTT) — see ProvisionStep.
    if (data.contract_type === 'permanent') requireText(errors, 'contract_evaluation', data.contract_evaluation);
    requireText(errors, 'join_date', data.join_date);

    return errors;
};

const financial: StepValidator = (data) => {
    const errors: FieldErrors = {};

    requireText(errors, 'bank_name', data.bank_name);
    requireText(errors, 'basic_salary', data.basic_salary);
    requireText(errors, 'bank_account_holder', data.bank_account_holder);
    requireFormat(errors, 'bank_account_holder', data.bank_account_holder, NAME_PATTERN, 'Nama pemilik rekening hanya huruf.');
    requireText(errors, 'bank_account_number', data.bank_account_number);
    requireFormat(errors, 'bank_account_number', data.bank_account_number, DIGITS_PATTERN, 'Nomor rekening tidak valid.');
    requireText(errors, 'allowance', data.allowance);

    return errors;
};

// Pratinjau (the last step) carries no fields of its own — it only submits.
const STEP_VALIDATORS: StepValidator[] = [personal, education, experience, provision, financial, () => ({})];

function validateStepsUpTo(stepIndex: number, data: EmployeeFormData, fileFlags: FileFieldFlags): FieldErrors {
    const errors: FieldErrors = {};

    for (let step = 0; step <= stepIndex && step < STEP_VALIDATORS.length; step += 1) {
        Object.assign(errors, STEP_VALIDATORS[step](data, fileFlags));
    }

    return errors;
}

/** Client-side stand-in for backend validation — there is no employees.store route yet. */
export function validateEmployeeForm(data: EmployeeFormData, fileFlags: FileFieldFlags = createEmptyFileFieldFlags()): FieldErrors {
    return validateStepsUpTo(STEP_VALIDATORS.length - 1, data, fileFlags);
}

/**
 * Everything up to and including `stepIndex` — the wizard validates from the
 * start on every "Selanjutnya", so an error raised on an earlier step can
 * never be skipped by walking forward and back.
 */
export function validateEmployeeFormStep(stepIndex: number, data: EmployeeFormData, fileFlags: FileFieldFlags = createEmptyFileFieldFlags()): FieldErrors {
    return validateStepsUpTo(stepIndex, data, fileFlags);
}
