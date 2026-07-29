import { COMPANY_ID } from '@/data/Employee/employee';

export interface JobLevel {
    id: string;
    code: string;
    name: string;
    rank_order: number;
    band_min: number | null;
    band_max: number | null;
    company_id: string;
}

export const jobLevel: JobLevel[] = [
    {
        id: 'c1d2e3f4-0001-4c1d-9e2f-345678901bcd',
        code: 'LVL-1',
        name: 'Staff',
        rank_order: 1,
        band_min: 5000000,
        band_max: 8000000,
        company_id: COMPANY_ID,
    },
    {
        id: 'c1d2e3f4-0002-4c1d-9e2f-345678901bcd',
        code: 'LVL-2',
        name: 'Senior Staff',
        rank_order: 2,
        band_min: 8000000,
        band_max: 12000000,
        company_id: COMPANY_ID,
    },
    {
        id: 'c1d2e3f4-0003-4c1d-9e2f-345678901bcd',
        code: 'LVL-3',
        name: 'Supervisor',
        rank_order: 3,
        band_min: 12000000,
        band_max: 16000000,
        company_id: COMPANY_ID,
    },
    {
        id: 'c1d2e3f4-0004-4c1d-9e2f-345678901bcd',
        code: 'LVL-4',
        name: 'Manager',
        rank_order: 4,
        band_min: 16000000,
        band_max: 25000000,
        company_id: COMPANY_ID,
    },
    {
        id: 'c1d2e3f4-0005-4c1d-9e2f-345678901bcd',
        code: 'LVL-5',
        name: 'Director',
        rank_order: 5,
        band_min: 25000000,
        band_max: null,
        company_id: COMPANY_ID,
    },
];
