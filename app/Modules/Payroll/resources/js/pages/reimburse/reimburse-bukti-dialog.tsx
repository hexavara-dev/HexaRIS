import { FilePreviewDialog, useFilePreviewUrl } from '@/components/form/form-field';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { organization } from '@/data/Organization/organization';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import jsPDF from 'jspdf';
import { Download, Eye } from 'lucide-react';
import { useState } from 'react';
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

// Column widths (mm) for the rincian table, drawn manually with jsPDF's line/text
// primitives rather than a table plugin — a single-row table doesn't need one.
const TABLE_X = 15;
const TABLE_WIDTH = 180;
const COL_WIDTHS = [12, 58, 30, 30, 50]; // No. / Deskripsi / Tanggal / Jumlah / Bukti Pembayaran
const ROW_HEIGHT = 10;
const HEADER_HEIGHT = 14;

function buildBuktiPdf(entry: ReimburseEntry, empName: string, empNumber: string, department: string, position: string): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORM REIMBURSEMENT', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${formatDate(entry.tanggal_reimburse)}`, TABLE_X, y);
    y += 8;
    doc.text(`Nama Karyawan: ${empName}`, TABLE_X, y);
    y += 7;
    doc.text(`Nomor ID Karyawan: ${empNumber}`, TABLE_X, y);
    y += 7;
    doc.text(`Departemen: ${department}`, TABLE_X, y);
    y += 7;
    doc.text(`Jabatan: ${position}`, TABLE_X, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Pengeluaran:', TABLE_X, y);
    y += 4;

    const tableTop = y;
    const headers = ['No.', 'Deskripsi Pengeluaran', 'Tanggal', 'Jumlah (Rp)', 'Bukti Pembayaran'];
    const row = ['1.', entry.keperluan, formatDate(entry.tanggal_pengeluaran), entry.nominal.toLocaleString('id-ID'), entry.bukti.name || '-'];

    doc.rect(TABLE_X, tableTop, TABLE_WIDTH, HEADER_HEIGHT + ROW_HEIGHT);
    doc.line(TABLE_X, tableTop + HEADER_HEIGHT, TABLE_X + TABLE_WIDTH, tableTop + HEADER_HEIGHT);

    doc.setFontSize(9);
    let colX = TABLE_X;
    for (let i = 0; i < headers.length; i++) {
        if (i > 0) doc.line(colX, tableTop, colX, tableTop + HEADER_HEIGHT + ROW_HEIGHT);
        doc.setFont('helvetica', 'bold');
        const headerLines = doc.splitTextToSize(headers[i], COL_WIDTHS[i] - 4);
        doc.text(headerLines, colX + 2, tableTop + 6);
        doc.setFont('helvetica', 'normal');
        const cellLines = doc.splitTextToSize(row[i], COL_WIDTHS[i] - 4);
        doc.text(cellLines, colX + 2, tableTop + HEADER_HEIGHT + 6);
        colX += COL_WIDTHS[i];
    }

    y = tableTop + HEADER_HEIGHT + ROW_HEIGHT + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Pengeluaran: ${formatRupiah(entry.nominal)}`, TABLE_X, y);

    return doc;
}

interface ReimburseBuktiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: ReimburseEntry | null;
}

export function ReimburseBuktiDialog({ open, onOpenChange, entry }: ReimburseBuktiDialogProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const previewUrl = useFilePreviewUrl(entry?.bukti ?? null);

    const emp = entry ? employee.find((e) => e.id === entry.employee_id) : undefined;

    const downloadPdf = () => {
        if (!entry) return;
        const doc = buildBuktiPdf(entry, emp?.full_name ?? '-', emp?.employee_number ?? '-', departmentFor(entry.employee_id), positionTitleFor(entry.employee_id));
        doc.save(`bukti-reimburse-${entry.id}.pdf`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                {entry && (
                    <>
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
                                            <td className="p-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{entry.bukti.name || '-'}</span>
                                                    {entry.bukti.name && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewOpen(true)}
                                                            aria-label="Lihat bukti pembayaran"
                                                            className="cursor-pointer text-[#4F4F4F]"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="font-semibold">Total Pengeluaran: {formatRupiah(entry.nominal)}</p>
                            <button
                                type="button"
                                onClick={downloadPdf}
                                className="font-poppins flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1980C0] py-3 text-sm font-semibold text-[#1980C0]"
                            >
                                <Download className="size-4" />
                                Download
                            </button>
                        </div>
                        <FilePreviewDialog
                            open={previewOpen}
                            onOpenChange={setPreviewOpen}
                            name={entry.bukti.name}
                            type={entry.bukti.type}
                            previewUrl={previewUrl}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
