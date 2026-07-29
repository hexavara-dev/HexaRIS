import { employee } from './employee';

const empId = (employeeNumber: string) => employee.find((e) => e.employee_number === employeeNumber)!.id;

export type InsuranceType = 'health' | 'employment';

export interface EmployeeInsurance {
    id: string;
    type: InsuranceType;
    provider_name: string;
    policy_number: string;
    coverage_note: string;
    employee_id: string;
}

const bpjsPair = (
    idPrefix: string,
    employeeNumber: string,
    healthPolicy: string,
    employmentPolicy: string,
    coverageNote = 'Aktif, tanggungan karyawan + 1 pasangan + 2 anak.',
): EmployeeInsurance[] => [
    {
        id: `${idPrefix}-h`,
        type: 'health',
        provider_name: 'BPJS Kesehatan',
        policy_number: healthPolicy,
        coverage_note: coverageNote,
        employee_id: empId(employeeNumber),
    },
    {
        id: `${idPrefix}-e`,
        type: 'employment',
        provider_name: 'BPJS Ketenagakerjaan',
        policy_number: employmentPolicy,
        coverage_note: 'Mencakup JHT, JKK, JKM, dan JP.',
        employee_id: empId(employeeNumber),
    },
];

export const employeeInsurance: EmployeeInsurance[] = [
    ...bpjsPair('e6f7a8b9-0001-4e6f-8a7b-123456789345', 'EMP-0001', '0001234567801', '11BU0001234501'),
    ...bpjsPair('e6f7a8b9-0002-4e6f-8a7b-123456789345', 'EMP-0002', '0001234567802', '11BU0001234502'),
    ...bpjsPair(
        'e6f7a8b9-0003-4e6f-8a7b-123456789345',
        'EMP-0003',
        '0001234567803',
        '11BU0001234503',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0004-4e6f-8a7b-123456789345',
        'EMP-0004',
        '0001234567804',
        '11BU0001234504',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair('e6f7a8b9-0005-4e6f-8a7b-123456789345', 'EMP-0005', '0001234567805', '11BU0001234505'),
    ...bpjsPair(
        'e6f7a8b9-0006-4e6f-8a7b-123456789345',
        'EMP-0006',
        '0001234567806',
        '11BU0001234506',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair('e6f7a8b9-0007-4e6f-8a7b-123456789345', 'EMP-0007', '0001234567807', '11BU0001234507'),
    ...bpjsPair(
        'e6f7a8b9-0008-4e6f-8a7b-123456789345',
        'EMP-0008',
        '0001234567808',
        '11BU0001234508',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0009-4e6f-8a7b-123456789345',
        'EMP-0009',
        '0001234567809',
        '11BU0001234509',
        'Aktif, tanggungan karyawan + 1 pasangan. Terdaftar sebagai pekerja asing (KITAS).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0010-4e6f-8a7b-123456789345',
        'EMP-0010',
        '0001234567810',
        '11BU0001234510',
        'Nonaktif sejak resign 2025-11-30, saldo JHT dapat dicairkan.',
    ),
    ...bpjsPair('e6f7a8b9-0011-4e6f-8a7b-123456789345', 'EMP-0011', '0001234567811', '11BU0001234511'),
    ...bpjsPair('e6f7a8b9-0012-4e6f-8a7b-123456789345', 'EMP-0012', '0001234567812', '11BU0001234512'),
    ...bpjsPair(
        'e6f7a8b9-0013-4e6f-8a7b-123456789345',
        'EMP-0013',
        '0001234567813',
        '11BU0001234513',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0014-4e6f-8a7b-123456789345',
        'EMP-0014',
        '0001234567814',
        '11BU0001234514',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair('e6f7a8b9-0015-4e6f-8a7b-123456789345', 'EMP-0015', '0001234567815', '11BU0001234515'),
    ...bpjsPair(
        'e6f7a8b9-0016-4e6f-8a7b-123456789345',
        'EMP-0016',
        '0001234567816',
        '11BU0001234516',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0017-4e6f-8a7b-123456789345',
        'EMP-0017',
        '0001234567817',
        '11BU0001234517',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair(
        'e6f7a8b9-0018-4e6f-8a7b-123456789345',
        'EMP-0018',
        '0001234567818',
        '11BU0001234518',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
    ...bpjsPair('e6f7a8b9-0019-4e6f-8a7b-123456789345', 'EMP-0019', '0001234567819', '11BU0001234519'),
    ...bpjsPair(
        'e6f7a8b9-0020-4e6f-8a7b-123456789345',
        'EMP-0020',
        '0001234567820',
        '11BU0001234520',
        'Aktif, tanggungan karyawan sendiri (belum menikah).',
    ),
];
