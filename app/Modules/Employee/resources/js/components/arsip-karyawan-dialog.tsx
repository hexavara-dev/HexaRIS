import { MoreVertical } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type Employee } from '@/data/Employee/employee';

import { displayEmployeeId } from '../lib/employee-display';

import { type DummyEmployee } from '../pages/Data/employees-dummy';

export type ArsipEmployee = Employee | DummyEmployee;

interface ArsipKaryawanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Only the archived rows (`is_archived`), passed in by the page. */
    employees: ArsipEmployee[];
    onDetail: (employee: ArsipEmployee) => void;
    onRestore: (employee: ArsipEmployee) => void;
}

/**
 * "Arsip Karyawan" — the list behind the toolbar's Arsip button. It is a
 * read-only browser of archived rows: each row's menu either opens the usual
 * detail dialog or restores the employee back into the main table.
 */
export function ArsipKaryawanDialog({ open, onOpenChange, employees, onDetail, onRestore }: ArsipKaryawanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl gap-0 rounded-2xl p-0">
                <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">
                    <DialogTitle className="font-poppins pr-8 text-xl font-semibold text-[#121212]">
                        Arsip Karyawan
                    </DialogTitle>

                    <DialogDescription className="text-sm text-[#6B7280]">
                        Daftar karyawan yang sudah diarsipkan. Gunakan menu di setiap baris untuk melihat detail atau mengembalikannya.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                    <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#E5E7EB]">
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">ID</th>
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">Nama</th>
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">Cabang</th>
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">Organisasi</th>
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">Posisi Jabatan</th>
                                    <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">Status</th>
                                    <th className="px-5 py-4" />
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#EEF0F2]">
                                {employees.map((employee) => {
                                    const id = displayEmployeeId(employee);
                                    const branch = 'branch' in employee ? employee.branch : '-';
                                    const organization = 'organization' in employee ? employee.organization : '-';
                                    const position = 'position' in employee ? employee.position : '-';

                                    return (
                                        <tr key={String(employee.id)}>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">{id}</td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[#121212]">{employee.full_name}</td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">{branch}</td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">{organization}</td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">{position}</td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                                                        employee.is_active
                                                            ? 'border-[#45C33A] text-[#39B52A]'
                                                            : 'border-[#EF4938] text-[#EF4938]'
                                                    }`}
                                                >
                                                    {employee.is_active ? 'Aktif' : 'Non Aktif'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                aria-label={`Aksi ${employee.full_name}`}
                                                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => onDetail(employee)}>Detail</DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem onClick={() => onRestore(employee)}>Restore</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#9CA3AF]">
                                            Tidak ada karyawan yang diarsipkan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
