export type OrganizationUnitType = 'COMPANY' | 'DIRECTORATE' | 'DIVISION' | 'DEPARTMENT' | 'SECTION';

export interface OrganizationUnit {
    id: string;
    parent_id: string | null;
    unit_type: OrganizationUnitType;
    code: string;
    name: string;
    path: string;
    cost_center: string;
}

export const organization: OrganizationUnit[] = [
    {
        id: 'ou-00',
        parent_id: null,
        unit_type: 'COMPANY',
        code: 'SM',
        name: 'PT Abadi Jaya',
        path: '/ou-00/',
        cost_center: 'CC-000',
    },
    {
        id: 'ou-01',
        parent_id: 'ou-00',
        unit_type: 'DEPARTMENT',
        code: 'DEPT-CRT',
        name: 'Departemen Kreatif',
        path: '/ou-00/ou-01/',
        cost_center: 'CC-100',
    },
    {
        id: 'ou-02',
        parent_id: 'ou-00',
        unit_type: 'DEPARTMENT',
        code: 'DEPT-OPS',
        name: 'Departemen Operasional',
        path: '/ou-00/ou-02/',
        cost_center: 'CC-200',
    },
    {
        id: 'ou-03',
        parent_id: 'ou-00',
        unit_type: 'DEPARTMENT',
        code: 'DEPT-FIN',
        name: 'Departemen Finance',
        path: '/ou-00/ou-03/',
        cost_center: 'CC-300',
    },
    {
        id: 'ou-04',
        parent_id: 'ou-00',
        unit_type: 'DEPARTMENT',
        code: 'DEPT-IT',
        name: 'Departemen IT',
        path: '/ou-00/ou-04/',
        cost_center: 'CC-400',
    },
    {
        id: 'ou-05',
        parent_id: 'ou-01',
        unit_type: 'DIVISION',
        code: 'DIV-DSN',
        name: 'Divisi Desain',
        path: '/ou-00/ou-01/ou-05/',
        cost_center: 'CC-110',
    },
    {
        id: 'ou-06',
        parent_id: 'ou-01',
        unit_type: 'DIVISION',
        code: 'DIV-MKT',
        name: 'Divisi Marketing',
        path: '/ou-00/ou-01/ou-06/',
        cost_center: 'CC-120',
    },
    {
        id: 'ou-07',
        parent_id: 'ou-04',
        unit_type: 'DIVISION',
        code: 'DIV-DEV',
        name: 'Divisi Developer',
        path: '/ou-00/ou-04/ou-07/',
        cost_center: 'CC-410',
    },
    {
        id: 'ou-08',
        parent_id: 'ou-04',
        unit_type: 'DIVISION',
        code: 'DIV-UIUX',
        name: 'Divisi UI/UX',
        path: '/ou-00/ou-04/ou-08/',
        cost_center: 'CC-420',
    },
];
