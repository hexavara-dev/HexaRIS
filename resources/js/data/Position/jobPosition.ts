import { organization } from '@/data/Organization/organization';
import { jobLevel } from './jobLevel';

const orgUnitId = (code: string) => organization.find((unit) => unit.code === code)!.id;
const levelId = (code: string) => jobLevel.find((level) => level.code === code)!.id;

export interface JobPosition {
    id: string;
    code: string;
    title: string;
    headcount: number;
    is_managerial: boolean;
    reports_to_position_id: string | null;
    organization_unit_id: string;
    job_level_id: string;
}

const POS_PRES_DIR = 'd1e2f3a4-0001-4d1e-9f2a-456789012cde';
const POS_HEAD_IT = 'd1e2f3a4-0002-4d1e-9f2a-456789012cde';
const POS_HEAD_CRT = 'd1e2f3a4-0003-4d1e-9f2a-456789012cde';
const POS_HEAD_FIN = 'd1e2f3a4-0004-4d1e-9f2a-456789012cde';
const POS_HEAD_OPS = 'd1e2f3a4-0005-4d1e-9f2a-456789012cde';
const POS_LEAD_DEV = 'd1e2f3a4-0006-4d1e-9f2a-456789012cde';
const POS_LEAD_UIUX = 'd1e2f3a4-0007-4d1e-9f2a-456789012cde';
const POS_LEAD_DSN = 'd1e2f3a4-0008-4d1e-9f2a-456789012cde';
const POS_LEAD_MKT = 'd1e2f3a4-0009-4d1e-9f2a-456789012cde';

export const jobPosition: JobPosition[] = [
    // Puncak — langsung di bawah perusahaan, bukan departemen manapun.
    {
        id: POS_PRES_DIR,
        code: 'POS-PRES-DIR',
        title: 'Direktur Utama',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: null,
        organization_unit_id: orgUnitId('SM'),
        job_level_id: levelId('LVL-5'),
    },
    // Kepala departemen — masing-masing tepat 1 orang, lapor ke Direktur Utama.
    {
        id: POS_HEAD_IT,
        code: 'POS-HEAD-IT',
        title: 'Kepala Departemen IT',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_PRES_DIR,
        organization_unit_id: orgUnitId('DEPT-IT'),
        job_level_id: levelId('LVL-4'),
    },
    {
        id: POS_HEAD_CRT,
        code: 'POS-HEAD-CRT',
        title: 'Kepala Departemen Kreatif',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_PRES_DIR,
        organization_unit_id: orgUnitId('DEPT-CRT'),
        job_level_id: levelId('LVL-4'),
    },
    {
        id: POS_HEAD_FIN,
        code: 'POS-HEAD-FIN',
        title: 'Kepala Departemen Finance',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_PRES_DIR,
        organization_unit_id: orgUnitId('DEPT-FIN'),
        job_level_id: levelId('LVL-4'),
    },
    {
        id: POS_HEAD_OPS,
        code: 'POS-HEAD-OPS',
        title: 'Kepala Departemen Operasional',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_PRES_DIR,
        organization_unit_id: orgUnitId('DEPT-OPS'),
        job_level_id: levelId('LVL-4'),
    },
    // Kepala divisi — masing-masing tepat 1 orang, lapor ke kepala departemen induknya.
    {
        id: POS_LEAD_DEV,
        code: 'POS-LEAD-DEV',
        title: 'Kepala Divisi Developer',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_HEAD_IT,
        organization_unit_id: orgUnitId('DIV-DEV'),
        job_level_id: levelId('LVL-3'),
    },
    {
        id: POS_LEAD_UIUX,
        code: 'POS-LEAD-UIUX',
        title: 'Kepala Divisi UI/UX',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_HEAD_IT,
        organization_unit_id: orgUnitId('DIV-UIUX'),
        job_level_id: levelId('LVL-3'),
    },
    {
        id: POS_LEAD_DSN,
        code: 'POS-LEAD-DSN',
        title: 'Kepala Divisi Design',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_HEAD_CRT,
        organization_unit_id: orgUnitId('DIV-DSN'),
        job_level_id: levelId('LVL-3'),
    },
    {
        id: POS_LEAD_MKT,
        code: 'POS-LEAD-MKT',
        title: 'Kepala Divisi Marketing',
        headcount: 1,
        is_managerial: true,
        reports_to_position_id: POS_HEAD_CRT,
        organization_unit_id: orgUnitId('DIV-MKT'),
        job_level_id: levelId('LVL-3'),
    },
    // Staf pelaksana — tidak managerial, lapor ke kepala divisi/departemennya masing-masing.
    {
        id: 'd1e2f3a4-0010-4d1e-9f2a-456789012cde',
        code: 'POS-WEB-DEV',
        title: 'Web Developer',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_DEV,
        organization_unit_id: orgUnitId('DIV-DEV'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0011-4d1e-9f2a-456789012cde',
        code: 'POS-MOB-DEV',
        title: 'Mobile Developer',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_DEV,
        organization_unit_id: orgUnitId('DIV-DEV'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0012-4d1e-9f2a-456789012cde',
        code: 'POS-UIUX-DSG',
        title: 'UI/UX Designer',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_UIUX,
        organization_unit_id: orgUnitId('DIV-UIUX'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0013-4d1e-9f2a-456789012cde',
        code: 'POS-UX-ILL',
        title: 'UX Ilustrator',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_UIUX,
        organization_unit_id: orgUnitId('DIV-UIUX'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0014-4d1e-9f2a-456789012cde',
        code: 'POS-DSG-STF',
        title: 'Graphic Designer',
        headcount: 2,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_DSN,
        organization_unit_id: orgUnitId('DIV-DSN'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0015-4d1e-9f2a-456789012cde',
        code: 'POS-TALENT',
        title: 'Talent',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_LEAD_MKT,
        organization_unit_id: orgUnitId('DIV-MKT'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0016-4d1e-9f2a-456789012cde',
        code: 'POS-PAYROLL',
        title: 'Payroll',
        headcount: 1,
        is_managerial: false,
        reports_to_position_id: POS_HEAD_FIN,
        organization_unit_id: orgUnitId('DEPT-FIN'),
        job_level_id: levelId('LVL-1'),
    },
    {
        id: 'd1e2f3a4-0017-4d1e-9f2a-456789012cde',
        code: 'POS-OPS-STF',
        title: 'Staff Operasional',
        headcount: 2,
        is_managerial: false,
        reports_to_position_id: POS_HEAD_OPS,
        organization_unit_id: orgUnitId('DEPT-OPS'),
        job_level_id: levelId('LVL-1'),
    },
];
