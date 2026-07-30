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
    /** 'menikah' | 'lajang' — converted to Employee.is_married on submit. */
    marital_status: string;
    address: string;
    ktp: File | null;
    npwp: File | null;
    contract: File | null;
};

export const initialEmployeeFormData: EmployeeFormData = {
    full_name: '',
    phone_number: '',
    gender: '',
    religion: '',
    birth_date: '',
    province_id: '',
    regency_id: '',
    marital_status: '',
    address: '',
    ktp: null,
    npwp: null,
    contract: null,
};
