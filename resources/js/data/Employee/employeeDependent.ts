import { employee } from './employee';

const empId = (employeeNumber: string) => employee.find((e) => e.employee_number === employeeNumber)!.id;

export type DependentRelation = 'spouse' | 'child' | 'parent';

export interface EmployeeDependent {
    id: string;
    name: string;
    relation: DependentRelation;
    birth_date: string;
    is_tax_dependent: boolean;
    is_bpjs_dependent: boolean;
    employee_id: string;
}

export const employeeDependent: EmployeeDependent[] = [
    // Bambang Wijaya — istri bekerja & lapor pajak terpisah, jadi tidak dihitung tanggungan pajak.
    {
        id: 'f7a8b9c0-0001-4f7a-8b9c-234567890456',
        name: 'Ratna Wijaya',
        relation: 'spouse',
        birth_date: '1982-06-10',
        is_tax_dependent: false,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0001'),
    },
    {
        id: 'f7a8b9c0-0002-4f7a-8b9c-234567890456',
        name: 'Aditya Wijaya',
        relation: 'child',
        birth_date: '2009-04-18',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0001'),
    },
    {
        id: 'f7a8b9c0-0003-4f7a-8b9c-234567890456',
        name: 'Kirana Wijaya',
        relation: 'child',
        birth_date: '2012-09-02',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0001'),
    },
    // Siti Rahayu
    {
        id: 'f7a8b9c0-0004-4f7a-8b9c-234567890456',
        name: 'Agus Prasetyo',
        relation: 'spouse',
        birth_date: '1983-02-14',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0002'),
    },
    {
        id: 'f7a8b9c0-0005-4f7a-8b9c-234567890456',
        name: 'Naila Prasetyo',
        relation: 'child',
        birth_date: '2014-11-25',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0002'),
    },
    // Herman Susanto — belum menikah, menanggung biaya hidup ibu kandung.
    // Dihitung tanggungan BPJS Kesehatan, tapi bukan tanggungan pajak (PTKP tidak mencakup orang tua).
    {
        id: 'f7a8b9c0-0006-4f7a-8b9c-234567890456',
        name: 'Sri Wahyuni',
        relation: 'parent',
        birth_date: '1958-03-30',
        is_tax_dependent: false,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0003'),
    },
    // I Made Suryawan
    {
        id: 'f7a8b9c0-0007-4f7a-8b9c-234567890456',
        name: 'Ni Luh Kartini',
        relation: 'spouse',
        birth_date: '1990-07-08',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0005'),
    },
    {
        id: 'f7a8b9c0-0008-4f7a-8b9c-234567890456',
        name: 'Kadek Arya',
        relation: 'child',
        birth_date: '2015-01-12',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0005'),
    },
    {
        id: 'f7a8b9c0-0009-4f7a-8b9c-234567890456',
        name: 'Komang Sari',
        relation: 'child',
        birth_date: '2018-05-20',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0005'),
    },
    // Dewi Lestari
    {
        id: 'f7a8b9c0-0010-4f7a-8b9c-234567890456',
        name: 'Hendra Pratama',
        relation: 'spouse',
        birth_date: '1992-10-05',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0007'),
    },
    {
        id: 'f7a8b9c0-0011-4f7a-8b9c-234567890456',
        name: 'Bilqis Pratama',
        relation: 'child',
        birth_date: '2021-08-14',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0007'),
    },
    // James Anderson — istri ikut menetap di Indonesia, belum memiliki anak.
    {
        id: 'f7a8b9c0-0012-4f7a-8b9c-234567890456',
        name: 'Emily Anderson',
        relation: 'spouse',
        birth_date: '1993-01-22',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0009'),
    },
    // Rina Kusuma (nonaktif — data tanggungan tetap tersimpan untuk riwayat)
    {
        id: 'f7a8b9c0-0013-4f7a-8b9c-234567890456',
        name: 'Budi Santoso',
        relation: 'spouse',
        birth_date: '1987-12-19',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0010'),
    },
    {
        id: 'f7a8b9c0-0014-4f7a-8b9c-234567890456',
        name: 'Zahra Santoso',
        relation: 'child',
        birth_date: '2016-03-09',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0010'),
    },
    // Nikolas Raharjo — menikah sejak lama, kedua anak sudah remaja.
    {
        id: 'f7a8b9c0-0015-4f7a-8b9c-234567890456',
        name: 'Melinda Raharjo',
        relation: 'spouse',
        birth_date: '1978-04-11',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0011'),
    },
    {
        id: 'f7a8b9c0-0016-4f7a-8b9c-234567890456',
        name: 'Kevin Raharjo',
        relation: 'child',
        birth_date: '2003-09-17',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0011'),
    },
    {
        id: 'f7a8b9c0-0017-4f7a-8b9c-234567890456',
        name: 'Michelle Raharjo',
        relation: 'child',
        birth_date: '2006-02-28',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0011'),
    },
    // Fitriani Wulandari
    {
        id: 'f7a8b9c0-0018-4f7a-8b9c-234567890456',
        name: 'Dedi Kurniawan',
        relation: 'spouse',
        birth_date: '1984-08-19',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0012'),
    },
    {
        id: 'f7a8b9c0-0019-4f7a-8b9c-234567890456',
        name: 'Alesha Kurniawan',
        relation: 'child',
        birth_date: '2017-06-30',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0012'),
    },
    // I Gede Wirawan — belum menikah, menanggung biaya hidup ibu kandung (BPJS saja, bukan tanggungan pajak).
    {
        id: 'f7a8b9c0-0020-4f7a-8b9c-234567890456',
        name: 'Ni Made Sukesih',
        relation: 'parent',
        birth_date: '1965-11-02',
        is_tax_dependent: false,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0013'),
    },
    // Yusuf Firmansyah
    {
        id: 'f7a8b9c0-0021-4f7a-8b9c-234567890456',
        name: 'Rina Firmansyah',
        relation: 'spouse',
        birth_date: '1996-12-01',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0015'),
    },
    {
        id: 'f7a8b9c0-0022-4f7a-8b9c-234567890456',
        name: 'Arka Firmansyah',
        relation: 'child',
        birth_date: '2021-10-08',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0015'),
    },
    // Wahyu Hidayat
    {
        id: 'f7a8b9c0-0023-4f7a-8b9c-234567890456',
        name: 'Siti Nurhaliza',
        relation: 'spouse',
        birth_date: '1994-05-23',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0019'),
    },
    {
        id: 'f7a8b9c0-0024-4f7a-8b9c-234567890456',
        name: 'Dimas Hidayat',
        relation: 'child',
        birth_date: '2018-07-15',
        is_tax_dependent: true,
        is_bpjs_dependent: true,
        employee_id: empId('EMP-0019'),
    },
];
