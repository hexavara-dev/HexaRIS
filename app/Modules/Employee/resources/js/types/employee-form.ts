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

/**
 * Mirrors EmployeeDocument in @/data/Employee/employeeDocument — that's the
 * entity ijazah actually live in (e.g. Nikolas Raharjo has two: "Ijazah S1
 * Manajemen" and "Ijazah S2 Magister Manajemen"). There is no separate
 * start_date/end_date/final_score column there; `level` + `institution` +
 * `major` only exist here to make the input structured, and get combined
 * into a single EmployeeDocument.name (e.g. "Ijazah S1 Teknik Industri") —
 * `number` maps straight to EmployeeDocument.number, `certificate` to
 * document_path.
 */
export type EducationEntry = {
    level: string;
    institution: string;
    major: string;
    number: string;
    certificate: File | null;
};

export function createEmptyEducationEntry(): EducationEntry {
    return {
        level: '',
        institution: '',
        major: '',
        number: '',
        certificate: null,
    };
}

// A type alias, not an interface: Inertia's useForm constrains its generic to
// FormDataType (an index-signature type), and interfaces have no implicit one.
export type EmployeeFormData = {
    full_name: string;
    /** Mirrors Employee.email_self — required. */
    email_self: string;
    /** Mirrors Employee.email_company — optional. */
    email_company: string;
    phone_number: string;
    gender: string;
    religion: string;
    birth_date: string;
    /** Mirrors Employee.identity_number (NIK) — plain text, not the KTP scan itself. */
    identity_number: string;
    /** Optional — mirrors Employee.npwp_number as plain text, not the NPWP scan itself. */
    npwp_number: string;
    province_id: string;
    regency_id: string;
    /** Mirrors Employee.is_married directly — boolean, not a 'menikah'/'lajang' string. */
    is_married: boolean;
    address: string;
    ktp: File | null;
    npwp: File | null;
    contract: File | null;
    educations: EducationEntry[];
    work_experiences: WorkExperience[];
    /** Optional — free-text branch name (no dedicated branch/location module yet). */
    branch: string;
    /** References OrganizationUnit.id (unit_type 'DEPARTMENT') in @/data/Organization/organization. */
    department_id: string;
    /** References OrganizationUnit.id (unit_type 'DIVISION'), scoped to department_id via parent_id. */
    division_id: string;
    /**
     * References JobPosition.id in @/data/Position/jobPosition. There is no
     * separate job_level_id here on purpose — EmployeeAssignment doesn't store
     * one either; level is only ever read via job_position_id -> JobPosition.job_level_id.
     */
    job_position_id: string;
    /** References Employee.id — mirrors EmployeeAssignment.direct_manager_id. */
    direct_manager_id: string;
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
    email_self: '',
    email_company: '',
    phone_number: '',
    gender: '',
    religion: '',
    birth_date: '',
    identity_number: '',
    npwp_number: '',
    province_id: '',
    regency_id: '',
    is_married: false,
    address: '',
    ktp: null,
    npwp: null,
    contract: null,
    educations: [createEmptyEducationEntry()],
    work_experiences: [createEmptyWorkExperience()],
    branch: '',
    department_id: '',
    division_id: '',
    job_position_id: '',
    direct_manager_id: '',
    contract_type: '',
    join_date: '',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    basic_salary: '',
    bpjs_health_number: '',
    bpjs_employment_number: '',
};
