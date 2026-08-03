// A type alias, not an interface: it is stored in EmployeeFormData, which
// Inertia's useForm constrains to FormDataType (an index-signature type) —
// interfaces have no implicit one.
export type WorkExperience = {
    company_name: string;
    employment_type: string;
    position: string;
    description: string;
    start_date: string;
    end_date: string;
    /** Optional — 'wfh' | 'wfo' | 'hybrid'. */
    work_location: string;
    /** Optional — kept as free text since past salaries may be a range or "confidential". */
    last_salary: string;
    reference_letter: File | null;
};

export function createEmptyWorkExperience(): WorkExperience {
    return {
        company_name: '',
        employment_type: '',
        position: '',
        description: '',
        start_date: '',
        end_date: '',
        work_location: '',
        last_salary: '',
        reference_letter: null,
    };
}

/** Last completed education only — one entry per employee, no add/remove. */
export type EducationEntry = {
    level: string;
    institution: string;
    major: string;
    start_date: string;
    end_date: string;
    final_score: string;
    certificate: File | null;
};

export function createEmptyEducationEntry(): EducationEntry {
    return {
        level: '',
        institution: '',
        major: '',
        start_date: '',
        end_date: '',
        final_score: '',
        certificate: null,
    };
}

/**
 * Keyed by field name for flat steps (e.g. 'full_name'), and by dotted path
 * for nested/array ones (e.g. 'education.level', 'work_experiences.0.start_date')
 * so a validation error on one entry never bleeds into another same-named field.
 */
export type FieldErrors = Partial<Record<string, string>>;

// A type alias, not an interface: Inertia's useForm constrains its generic to
// FormDataType (an index-signature type), and interfaces have no implicit one.
export type EmployeeFormData = {
    full_name: string;
    phone_number: string;
    gender: string;
    religion: string;
    birth_date: string;
    province_id: string;
    regency_id: string;
    /** Mirrors Employee.is_married directly — boolean, not a 'menikah'/'lajang' string. */
    is_married: boolean;
    address: string;
    ktp: File | null;
    npwp: File | null;
    contract: File | null;
    education: EducationEntry;
    work_experiences: WorkExperience[];
    /** Optional — free-text branch name (no dedicated branch/location module yet). */
    branch: string;
    /** References OrganizationUnit.id (unit_type 'DEPARTMENT') in @/data/Organization/organization. */
    department_id: string;
    /** References OrganizationUnit.id (unit_type 'DIVISION'), scoped to department_id via parent_id. */
    division_id: string;
    /** Fixed set (Manajer/Direksi/Senior/Junior) picked directly — not derived from a job position. */
    job_level: string;
    /** Mirrors ContractType in @/data/Employee/employmentContract. */
    contract_type: string;
    join_date: string;
    bank_name: string;
    bank_account_holder: string;
    bank_account_number: string;
    basic_salary: string;
    /** Optional — mirrors EmployeeInsurance where type === 'health'. Digits only. */
    bpjs_health_number: string;
    /** Optional — mirrors EmployeeInsurance where type === 'employment'. Digits only. */
    bpjs_employment_number: string;
};

export const initialEmployeeFormData: EmployeeFormData = {
    full_name: '',
    phone_number: '',
    gender: '',
    religion: '',
    birth_date: '',
    province_id: '',
    regency_id: '',
    is_married: false,
    address: '',
    ktp: null,
    npwp: null,
    contract: null,
    education: createEmptyEducationEntry(),
    work_experiences: [createEmptyWorkExperience()],
    branch: '',
    department_id: '',
    division_id: '',
    job_level: '',
    contract_type: '',
    join_date: '',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    basic_salary: '',
    bpjs_health_number: '',
    bpjs_employment_number: '',
};
