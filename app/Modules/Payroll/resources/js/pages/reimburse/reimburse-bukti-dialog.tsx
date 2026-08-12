import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { organization } from '@/data/Organization/organization';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { Download } from 'lucide-react';
import { positionTitleFor } from '../../lib/payroll-row';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRupiah(nominal: number): string {
    return `Rp. ${nominal.toLocaleString('id-ID')}`;
}

function departmentFor(employeeId: string): string {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId && a.is_active);
    if (!assignment) return '-';
    return organization.find((o) => o.id === assignment.organization_unit_id)?.name ?? '-';
}

interface ReimburseBuktiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: ReimburseEntry | null;
}

export function ReimburseBuktiDialog({ open, onOpenChange, entry }: ReimburseBuktiDialogProps) {
    if (!entry) return null;

    const emp = employee.find((e) => e.id === entry.employee_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Bukti Reimburse</DialogTitle>
                <div className="flex flex-col gap-4 font-poppins text-sm text-[#121212]">
                    <p className="text-center text-lg font-bold uppercase">Form Reimbursement</p>
                    <p>Tanggal: {formatDate(entry.tanggal_reimburse)}</p>
                    <div className="flex flex-col gap-1">
                        <p>Nama Karyawan: {emp?.full_name ?? '-'}</p>
                        <p>Nomor ID Karyawan: {emp?.employee_number ?? '-'}</p>
                        <p>Departemen: {departmentFor(entry.employee_id)}</p>
                        <p>Jabatan: {positionTitleFor(entry.employee_id)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-semibold">Rincian Pengeluaran:</p>
                        <table className="w-full border border-[#E7E7E7] text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#E7E7E7]">
                                    <th className="border-r border-[#E7E7E7] p-2">No.</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Deskripsi Pengeluaran</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Tanggal</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Jumlah (Rp)</th>
                                    <th className="p-2">Bukti Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border-r border-[#E7E7E7] p-2">1.</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{entry.keperluan}</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{formatDate(entry.tanggal_pengeluaran)}</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{entry.nominal.toLocaleString('id-ID')}</td>
                                    <td className="p-2">{entry.bukti.name || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="font-semibold">Total Pengeluaran: {formatRupiah(entry.nominal)}</p>
                    <a
                        href={entry.bukti.dataUrl || undefined}
                        download={entry.bukti.name || undefined}
                        aria-disabled={!entry.bukti.dataUrl}
                        className="font-poppins flex w-full items-center justify-center gap-2 rounded-lg border border-[#1980C0] py-3 text-sm font-semibold text-[#1980C0] aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                        <Download className="size-4" />
                        Download
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
