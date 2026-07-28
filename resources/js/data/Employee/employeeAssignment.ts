import { organization } from '@/data/Organization/organization';
import { jobPosition } from '@/data/Position/jobPosition';
import { employee } from './employee';
import { employmentContract } from './employmentContract';

const empId = (employeeNumber: string) => employee.find((e) => e.employee_number === employeeNumber)!.id;
const orgUnitId = (code: string) => organization.find((unit) => unit.code === code)!.id;
const posId = (code: string) => jobPosition.find((p) => p.code === code)!.id;
const contractId = (employeeNumber: string) => employmentContract.find((c) => c.employee_id === empId(employeeNumber))!.id;

export type AssignmentChangeType = 'hire' | 'promotion' | 'rotation' | 'acting';

export interface EmployeeAssignment {
    id: string;
    change_type: AssignmentChangeType;
    period_start: string;
    period_end: string | null;
    is_active: boolean;
    contract_id: string | null;
    organization_unit_id: string;
    employee_id: string;
    direct_manager_id: string | null;
    job_position_id: string;
}

export const employeeAssignment: EmployeeAssignment[] = [
    // Bambang Wijaya — Kepala Departemen Operasional, lapor ke Direktur Utama.
    {
        id: 'a2b3c4d5-0001-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2010-03-01',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0001'),
        organization_unit_id: orgUnitId('DEPT-OPS'),
        employee_id: empId('EMP-0001'),
        direct_manager_id: empId('EMP-0011'),
        job_position_id: posId('POS-HEAD-OPS'),
    },
    // Siti Rahayu — Kepala Departemen Finance, lapor ke Direktur Utama.
    {
        id: 'a2b3c4d5-0002-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2012-06-15',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0002'),
        organization_unit_id: orgUnitId('DEPT-FIN'),
        employee_id: empId('EMP-0002'),
        direct_manager_id: empId('EMP-0011'),
        job_position_id: posId('POS-HEAD-FIN'),
    },
    // Herman Susanto — Kepala Departemen IT, lapor ke Direktur Utama.
    {
        id: 'a2b3c4d5-0003-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2015-01-10',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0003'),
        organization_unit_id: orgUnitId('DEPT-IT'),
        employee_id: empId('EMP-0003'),
        direct_manager_id: empId('EMP-0011'),
        job_position_id: posId('POS-HEAD-IT'),
    },
    // Maria Angelina Tampubolon — dipromosikan jadi Kepala Divisi UI/UX, lapor ke Kepala Departemen IT.
    {
        id: 'a2b3c4d5-0004-4a2b-9c3d-789012345f01',
        change_type: 'promotion',
        period_start: '2024-01-01',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0004'),
        organization_unit_id: orgUnitId('DIV-UIUX'),
        employee_id: empId('EMP-0004'),
        direct_manager_id: empId('EMP-0003'),
        job_position_id: posId('POS-LEAD-UIUX'),
    },
    // I Made Suryawan — Kepala Departemen Kreatif, lapor ke Direktur Utama.
    {
        id: 'a2b3c4d5-0005-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2013-11-20',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0005'),
        organization_unit_id: orgUnitId('DEPT-CRT'),
        employee_id: empId('EMP-0005'),
        direct_manager_id: empId('EMP-0011'),
        job_position_id: posId('POS-HEAD-CRT'),
    },
    // Andi Setiawan — dipromosikan jadi Kepala Divisi Marketing, lapor ke Kepala Departemen Kreatif.
    {
        id: 'a2b3c4d5-0006-4a2b-9c3d-789012345f01',
        change_type: 'promotion',
        period_start: '2024-01-01',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0006'),
        organization_unit_id: orgUnitId('DIV-MKT'),
        employee_id: empId('EMP-0006'),
        direct_manager_id: empId('EMP-0005'),
        job_position_id: posId('POS-LEAD-MKT'),
    },
    // Dewi Lestari — Payroll, lapor ke Kepala Departemen Finance.
    {
        id: 'a2b3c4d5-0007-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2019-08-05',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0007'),
        organization_unit_id: orgUnitId('DEPT-FIN'),
        employee_id: empId('EMP-0007'),
        direct_manager_id: empId('EMP-0002'),
        job_position_id: posId('POS-PAYROLL'),
    },
    // Fajar Nugroho — Web Developer, lapor ke Kepala Divisi Developer.
    {
        id: 'a2b3c4d5-0008-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2021-05-10',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0008'),
        organization_unit_id: orgUnitId('DIV-DEV'),
        employee_id: empId('EMP-0008'),
        direct_manager_id: empId('EMP-0009'),
        job_position_id: posId('POS-WEB-DEV'),
    },
    // James Anderson — dipromosikan jadi Kepala Divisi Developer, lapor ke Kepala Departemen IT.
    {
        id: 'a2b3c4d5-0009-4a2b-9c3d-789012345f01',
        change_type: 'promotion',
        period_start: '2024-01-01',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0009'),
        organization_unit_id: orgUnitId('DIV-DEV'),
        employee_id: empId('EMP-0009'),
        direct_manager_id: empId('EMP-0003'),
        job_position_id: posId('POS-LEAD-DEV'),
    },
    // Rina Kusuma — nonaktif, riwayat sebagai Graphic Designer, dulu lapor ke Kepala Departemen Kreatif.
    {
        id: 'a2b3c4d5-0010-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2011-07-11',
        period_end: '2025-11-30',
        is_active: false,
        contract_id: contractId('EMP-0010'),
        organization_unit_id: orgUnitId('DIV-DSN'),
        employee_id: empId('EMP-0010'),
        direct_manager_id: empId('EMP-0005'),
        job_position_id: posId('POS-DSG-STF'),
    },
    // Nikolas Raharjo — Direktur Utama, puncak struktur, tidak lapor ke siapa pun.
    {
        id: 'a2b3c4d5-0011-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2008-01-15',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0011'),
        organization_unit_id: orgUnitId('SM'),
        employee_id: empId('EMP-0011'),
        direct_manager_id: null,
        job_position_id: posId('POS-PRES-DIR'),
    },
    // Fitriani Wulandari — Kepala Divisi Design, lapor ke Kepala Departemen Kreatif.
    {
        id: 'a2b3c4d5-0012-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2016-05-09',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0012'),
        organization_unit_id: orgUnitId('DIV-DSN'),
        employee_id: empId('EMP-0012'),
        direct_manager_id: empId('EMP-0005'),
        job_position_id: posId('POS-LEAD-DSN'),
    },
    // I Gede Wirawan — Graphic Designer, lapor ke Kepala Divisi Design.
    {
        id: 'a2b3c4d5-0013-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2022-03-14',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0013'),
        organization_unit_id: orgUnitId('DIV-DSN'),
        employee_id: empId('EMP-0013'),
        direct_manager_id: empId('EMP-0012'),
        job_position_id: posId('POS-DSG-STF'),
    },
    // Clara Simanjuntak — Graphic Designer, lapor ke Kepala Divisi Design.
    {
        id: 'a2b3c4d5-0014-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2023-02-20',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0014'),
        organization_unit_id: orgUnitId('DIV-DSN'),
        employee_id: empId('EMP-0014'),
        direct_manager_id: empId('EMP-0012'),
        job_position_id: posId('POS-DSG-STF'),
    },
    // Yusuf Firmansyah — Mobile Developer, lapor ke Kepala Divisi Developer.
    {
        id: 'a2b3c4d5-0015-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2022-07-04',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0015'),
        organization_unit_id: orgUnitId('DIV-DEV'),
        employee_id: empId('EMP-0015'),
        direct_manager_id: empId('EMP-0009'),
        job_position_id: posId('POS-MOB-DEV'),
    },
    // Bella Anastasia — UI/UX Designer, lapor ke Kepala Divisi UI/UX.
    {
        id: 'a2b3c4d5-0016-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2023-01-09',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0016'),
        organization_unit_id: orgUnitId('DIV-UIUX'),
        employee_id: empId('EMP-0016'),
        direct_manager_id: empId('EMP-0004'),
        job_position_id: posId('POS-UIUX-DSG'),
    },
    // Nadia Puspita — UX Ilustrator, lapor ke Kepala Divisi UI/UX.
    {
        id: 'a2b3c4d5-0017-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2023-08-21',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0017'),
        organization_unit_id: orgUnitId('DIV-UIUX'),
        employee_id: empId('EMP-0017'),
        direct_manager_id: empId('EMP-0004'),
        job_position_id: posId('POS-UX-ILL'),
    },
    // Rizky Ramadhan — Talent, lapor ke Kepala Divisi Marketing.
    {
        id: 'a2b3c4d5-0018-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2022-10-03',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0018'),
        organization_unit_id: orgUnitId('DIV-MKT'),
        employee_id: empId('EMP-0018'),
        direct_manager_id: empId('EMP-0006'),
        job_position_id: posId('POS-TALENT'),
    },
    // Wahyu Hidayat — Staff Operasional, lapor ke Kepala Departemen Operasional.
    {
        id: 'a2b3c4d5-0019-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2017-04-17',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0019'),
        organization_unit_id: orgUnitId('DEPT-OPS'),
        employee_id: empId('EMP-0019'),
        direct_manager_id: empId('EMP-0001'),
        job_position_id: posId('POS-OPS-STF'),
    },
    // Lestari Handayani — Staff Operasional, lapor ke Kepala Departemen Operasional.
    {
        id: 'a2b3c4d5-0020-4a2b-9c3d-789012345f01',
        change_type: 'hire',
        period_start: '2019-11-25',
        period_end: null,
        is_active: true,
        contract_id: contractId('EMP-0020'),
        organization_unit_id: orgUnitId('DEPT-OPS'),
        employee_id: empId('EMP-0020'),
        direct_manager_id: empId('EMP-0001'),
        job_position_id: posId('POS-OPS-STF'),
    },
];
