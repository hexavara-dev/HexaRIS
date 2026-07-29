import { employee } from './employee';

const empId = (employeeNumber: string) => employee.find((e) => e.employee_number === employeeNumber)!.id;

export interface EmployeeDocument {
    id: string;
    name: string;
    number: string | null;
    document_path: string;
    is_expireable: boolean;
    valid_start: string | null;
    valid_end: string | null;
    employee_id: string;
}

export const employeeDocument: EmployeeDocument[] = [
    // Bambang Wijaya
    {
        id: 'a8b9c0d1-0001-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Teknik Industri',
        number: 'UNPAD/2003/TI/00214',
        document_path: '/storage/documents/emp-0001-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0001'),
    },
    {
        id: 'a8b9c0d1-0002-4a8b-9c0d-345678901567',
        name: 'Sertifikat Lean Six Sigma Green Belt',
        number: 'LSS-GB-2022-1145',
        document_path: '/storage/documents/emp-0001-lean-six-sigma.pdf',
        is_expireable: true,
        valid_start: '2022-03-01',
        valid_end: '2025-03-01',
        employee_id: empId('EMP-0001'),
    },
    // Siti Rahayu
    {
        id: 'a8b9c0d1-0003-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Akuntansi',
        number: 'UGM/2007/AK/00892',
        document_path: '/storage/documents/emp-0002-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0002'),
    },
    {
        id: 'a8b9c0d1-0004-4a8b-9c0d-345678901567',
        name: 'Brevet Pajak A & B',
        number: 'BP-AB-2021-3320',
        document_path: '/storage/documents/emp-0002-brevet-pajak.pdf',
        is_expireable: true,
        valid_start: '2021-09-15',
        valid_end: '2024-09-15',
        employee_id: empId('EMP-0002'),
    },
    // Herman Susanto
    {
        id: 'a8b9c0d1-0005-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Ilmu Komputer',
        number: 'ITS/2012/IK/00567',
        document_path: '/storage/documents/emp-0003-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0003'),
    },
    {
        id: 'a8b9c0d1-0006-4a8b-9c0d-345678901567',
        name: 'AWS Certified Solutions Architect – Associate',
        number: 'AWS-CSAA-88231045',
        document_path: '/storage/documents/emp-0003-aws-csaa.pdf',
        is_expireable: true,
        valid_start: '2023-06-10',
        valid_end: '2026-06-10',
        employee_id: empId('EMP-0003'),
    },
    // Maria Angelina Tampubolon
    {
        id: 'a8b9c0d1-0007-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Desain Komunikasi Visual',
        number: 'ITB/2015/DKV/00341',
        document_path: '/storage/documents/emp-0004-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0004'),
    },
    {
        id: 'a8b9c0d1-0008-4a8b-9c0d-345678901567',
        name: 'Google UX Design Professional Certificate',
        number: null,
        document_path: '/storage/documents/emp-0004-google-ux.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0004'),
    },
    // I Made Suryawan
    {
        id: 'a8b9c0d1-0009-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Desain Komunikasi Visual',
        number: 'ISI/2010/DKV/00128',
        document_path: '/storage/documents/emp-0005-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0005'),
    },
    // Andi Setiawan
    {
        id: 'a8b9c0d1-0010-4a8b-9c0d-345678901567',
        name: 'Ijazah D3 Manajemen Pemasaran',
        number: 'UNRI/2019/MP/00450',
        document_path: '/storage/documents/emp-0006-ijazah-d3.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0006'),
    },
    // Dewi Lestari
    {
        id: 'a8b9c0d1-0011-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Akuntansi',
        number: 'UNDIP/2016/AK/00775',
        document_path: '/storage/documents/emp-0007-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0007'),
    },
    // Fajar Nugroho
    {
        id: 'a8b9c0d1-0012-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Teknik Informatika',
        number: null,
        document_path: '/storage/documents/emp-0008-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0008'),
    },
    {
        id: 'a8b9c0d1-0013-4a8b-9c0d-345678901567',
        name: 'Sertifikat Kompetensi BNSP – Junior Web Developer',
        number: 'BNSP-JWD-2021-05512',
        document_path: '/storage/documents/emp-0008-bnsp-jwd.pdf',
        is_expireable: true,
        valid_start: '2021-06-01',
        valid_end: '2024-06-01',
        employee_id: empId('EMP-0008'),
    },
    // James Anderson
    {
        id: 'a8b9c0d1-0014-4a8b-9c0d-345678901567',
        name: 'Bachelor of Computer Science – University of Melbourne',
        number: null,
        document_path: '/storage/documents/emp-0009-degree.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0009'),
    },
    {
        id: 'a8b9c0d1-0015-4a8b-9c0d-345678901567',
        name: 'KITAS (Kartu Izin Tinggal Terbatas)',
        number: '2C21JE0912-K',
        document_path: '/storage/documents/emp-0009-kitas.pdf',
        is_expireable: true,
        valid_start: '2025-09-01',
        valid_end: '2026-09-01',
        employee_id: empId('EMP-0009'),
    },
    // Rina Kusuma (nonaktif — data dokumen tetap tersimpan untuk riwayat)
    {
        id: 'a8b9c0d1-0016-4a8b-9c0d-345678901567',
        name: 'Ijazah D3 Desain Grafis',
        number: 'ISI/2010/DG/00093',
        document_path: '/storage/documents/emp-0010-ijazah-d3.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0010'),
    },
    // Nikolas Raharjo
    {
        id: 'a8b9c0d1-0017-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Manajemen',
        number: 'UI/1998/MJ/00042',
        document_path: '/storage/documents/emp-0011-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0011'),
    },
    {
        id: 'a8b9c0d1-0018-4a8b-9c0d-345678901567',
        name: 'Ijazah S2 Magister Manajemen',
        number: 'UI/2004/MM/00891',
        document_path: '/storage/documents/emp-0011-ijazah-s2.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0011'),
    },
    // Fitriani Wulandari
    {
        id: 'a8b9c0d1-0019-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Desain Komunikasi Visual',
        number: 'ITB/2009/DKV/00276',
        document_path: '/storage/documents/emp-0012-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0012'),
    },
    // I Gede Wirawan
    {
        id: 'a8b9c0d1-0020-4a8b-9c0d-345678901567',
        name: 'Ijazah D3 Desain Grafis',
        number: 'ISI/2018/DG/00614',
        document_path: '/storage/documents/emp-0013-ijazah-d3.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0013'),
    },
    // Clara Simanjuntak
    {
        id: 'a8b9c0d1-0021-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Desain Komunikasi Visual',
        number: null,
        document_path: '/storage/documents/emp-0014-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0014'),
    },
    // Yusuf Firmansyah
    {
        id: 'a8b9c0d1-0022-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Teknik Informatika',
        number: 'UB/2017/TI/00728',
        document_path: '/storage/documents/emp-0015-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0015'),
    },
    {
        id: 'a8b9c0d1-0023-4a8b-9c0d-345678901567',
        name: 'Associate Android Developer Certification',
        number: 'AAD-2023-77021',
        document_path: '/storage/documents/emp-0015-aad-cert.pdf',
        is_expireable: true,
        valid_start: '2023-04-01',
        valid_end: '2026-04-01',
        employee_id: empId('EMP-0015'),
    },
    // Bella Anastasia
    {
        id: 'a8b9c0d1-0024-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Desain Komunikasi Visual',
        number: null,
        document_path: '/storage/documents/emp-0016-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0016'),
    },
    // Nadia Puspita
    {
        id: 'a8b9c0d1-0025-4a8b-9c0d-345678901567',
        name: 'Ijazah D4 Desain Grafis',
        number: 'PENS/2021/DG/00355',
        document_path: '/storage/documents/emp-0017-ijazah-d4.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0017'),
    },
    // Rizky Ramadhan
    {
        id: 'a8b9c0d1-0026-4a8b-9c0d-345678901567',
        name: 'Ijazah S1 Ilmu Komunikasi',
        number: null,
        document_path: '/storage/documents/emp-0018-ijazah-s1.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0018'),
    },
    // Wahyu Hidayat
    {
        id: 'a8b9c0d1-0027-4a8b-9c0d-345678901567',
        name: 'Ijazah SMA',
        number: null,
        document_path: '/storage/documents/emp-0019-ijazah-sma.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0019'),
    },
    {
        id: 'a8b9c0d1-0028-4a8b-9c0d-345678901567',
        name: 'SIM A',
        number: '901234567890',
        document_path: '/storage/documents/emp-0019-sim-a.pdf',
        is_expireable: true,
        valid_start: '2024-06-01',
        valid_end: '2029-06-01',
        employee_id: empId('EMP-0019'),
    },
    // Lestari Handayani
    {
        id: 'a8b9c0d1-0029-4a8b-9c0d-345678901567',
        name: 'Ijazah D3 Administrasi Bisnis',
        number: 'POLBAN/2016/AB/00187',
        document_path: '/storage/documents/emp-0020-ijazah-d3.pdf',
        is_expireable: false,
        valid_start: null,
        valid_end: null,
        employee_id: empId('EMP-0020'),
    },
];
