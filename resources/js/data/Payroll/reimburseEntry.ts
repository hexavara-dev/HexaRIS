import { employee } from '@/data/Employee/employee';
import { branch, type Branch } from './branch';

export interface ReimburseEntry {
    id: string;
    employee_id: string;
    branch_id: string;
    tanggal_pengeluaran: string; // ISO date
    tanggal_reimburse: string; // ISO date
    keperluan: string;
    nominal: number;
    metode_bayar: 'tunai' | 'transfer';
    bukti: { name: string; type: string; dataUrl: string };
}

const KEPERLUAN = ['Print Berkas', 'Transportasi Klien', 'Makan Siang Tim', 'Beli ATK', 'Parkir & Tol', 'Konsumsi Rapat'];

function branchFor(index: number): Branch {
    return branch[index % branch.length];
}

function pad(day: number): string {
    return String(day).padStart(2, '0');
}

const activeEmployees = employee.filter((e) => e.is_active);

export const reimburseEntry: ReimburseEntry[] = activeEmployees.map((emp, index) => {
    const pengeluaranDay = 1 + (index % 27);
    const reimburseDay = Math.min(pengeluaranDay + 2, 28);

    return {
        id: `RB-${pad(index + 1)}`,
        employee_id: emp.id,
        branch_id: branchFor(index).id,
        tanggal_pengeluaran: `2026-07-${pad(pengeluaranDay)}`,
        tanggal_reimburse: `2026-07-${pad(reimburseDay)}`,
        keperluan: KEPERLUAN[index % KEPERLUAN.length],
        nominal: 50_000 + (index % 6) * 25_000,
        metode_bayar: index % 2 === 0 ? 'tunai' : 'transfer',
        bukti: { name: 'bukti-pembayaran.jpg', type: 'image/jpeg', dataUrl: '' },
    };
});
