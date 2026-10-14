import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, FileText, History } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { buildEmployeeContractColumns, type ContractAction, type EmployeeContractRow } from '../column';
import { contractApplicationHistory, contractData, contractFilters, contractSearch, type ContractApplicationHistoryRow } from '../data';
import { ContractActionDialog } from './contract-action-dialog';

export function ContractDataTable() {
    const [selectedAction, setSelectedAction] = useState<ContractAction | null>(null);
    const [selectedContract, setSelectedContract] = useState<EmployeeContractRow | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<ContractApplicationHistoryRow | null>(null);

    const openContractAction = useCallback((action: ContractAction, row: EmployeeContractRow) => {
        setSelectedAction(action);
        setSelectedContract(row);
    }, []);

    const closeContractAction = () => {
        setSelectedAction(null);
        setSelectedContract(null);
    };

    const columns = useMemo(() => buildEmployeeContractColumns(openContractAction), [openContractAction]);

    return (
        <>
            <DataTable
                columns={columns}
                data={contractData}
                search={contractSearch}
                filters={contractFilters}
                actions={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 border-[#1980C0] text-[#1980C0] hover:bg-[#F0FAFF]"
                        onClick={() => setHistoryOpen(true)}
                    >
                        <History />
                        Riwayat Pengajuan
                    </Button>
                }
            />
            <ContractActionDialog
                action={selectedAction}
                contract={selectedContract}
                open={selectedAction !== null && selectedContract !== null}
                onOpenChange={(open) => {
                    if (!open) closeContractAction();
                }}
            />
            <Dialog
                open={historyOpen}
                onOpenChange={(open) => {
                    setHistoryOpen(open);
                    if (!open) setSelectedHistory(null);
                }}
            >
                <DialogContent
                    className={`flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl p-0 ${selectedHistory ? 'max-w-2xl' : 'max-w-5xl'}`}
                >
                    <DialogHeader className="shrink-0 border-b px-5 py-4">
                        <div className="flex items-center gap-2">
                            {selectedHistory && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    aria-label="Kembali ke riwayat pengajuan"
                                    onClick={() => setSelectedHistory(null)}
                                >
                                    <ChevronLeft />
                                </Button>
                            )}
                            <DialogTitle className="font-poppins text-sm font-semibold">
                                {selectedHistory ? 'Detail Pengajuan kontrak' : 'Riwayat Pengajuan Kontrak'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            {selectedHistory ? 'Detail pengajuan kontrak karyawan.' : 'Daftar riwayat pengajuan kontrak karyawan.'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedHistory ? (
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                            <div className="space-y-3">
                                <HistoryDetailCard title="Data Kontrak Diajukan">
                                    <HistoryDetailRow label="Jenis Kontrak" value={selectedHistory.details.contract_type} />
                                    <HistoryDetailRow label="Tgl Mulai" value={selectedHistory.details.start_date} />
                                    <HistoryDetailRow label="Tgl Berakhir" value={selectedHistory.details.end_date} />
                                    <HistoryDetailRow label="Durasi masa kontrak" value={selectedHistory.details.duration} />
                                </HistoryDetailCard>
                                <HistoryDetailCard title="Data Mutasi">
                                    <HistoryDetailRow label="Cabang Sebelumnya" value={selectedHistory.details.previous_branch} />
                                    <HistoryDetailRow label="Cabang Saat Ini" value={selectedHistory.details.current_branch} />
                                    <HistoryDetailRow label="Alasan Mutasi" value={selectedHistory.details.transfer_reason} />
                                </HistoryDetailCard>
                                <HistoryDetailCard title="Data Perubahan Jabatan">
                                    <HistoryDetailRow label="Organisasi Baru" value={selectedHistory.details.new_organization} />
                                    <HistoryDetailRow label="Posisi Jabatan Baru" value={selectedHistory.details.new_position} />
                                    <HistoryDetailRow label="Alasan Perubahan" value={selectedHistory.details.position_change_reason} />
                                </HistoryDetailCard>
                                <HistoryDetailCard title="Data Kompensasi">
                                    <HistoryDetailRow label="Gaji Terbaru" value={selectedHistory.details.latest_salary} />
                                    <HistoryDetailRow label="Tunjangan Baru" value={selectedHistory.details.new_allowance} />
                                    <HistoryDetailRow label="No. BPJS Kesehatan" value={selectedHistory.details.bpjs_number} />
                                </HistoryDetailCard>
                                <HistoryDetailCard title="Dokumen Kontrak">
                                    <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FFF2F0] text-[#EF4444]">
                                            <FileText className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-poppins truncate text-xs font-semibold text-[#121212]">
                                                {selectedHistory.details.document_name}
                                            </p>
                                            <p className="font-poppins text-[11px] text-[#6B7280]">{selectedHistory.details.document_size}</p>
                                        </div>
                                    </div>
                                </HistoryDetailCard>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="overflow-hidden rounded-md border border-[#E7E7E7]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-[#E7E7E7] bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                                            {['Tgl', 'Nama', 'Cabang', 'Departemen', 'Divisi', 'Jabatan', 'Kontrak Diajukan', 'Status', ''].map(
                                                (label, index) => (
                                                    <TableHead
                                                        key={`${label}-${index}`}
                                                        className="font-poppins h-11 px-2 text-xs font-normal text-[#0A0A0A]"
                                                    >
                                                        {label}
                                                    </TableHead>
                                                ),
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contractApplicationHistory.map((application) => (
                                            <TableRow key={application.id} className="border-[#E7E7E7] hover:bg-transparent">
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">
                                                    {application.submitted_at}
                                                </TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">{application.name}</TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">{application.branch}</TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">
                                                    {application.department}
                                                </TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">
                                                    {application.division}
                                                </TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">
                                                    {application.position}
                                                </TableCell>
                                                <TableCell className="font-poppins px-2 py-2 text-xs text-[#424242]">
                                                    {application.requested_contract}
                                                </TableCell>
                                                <TableCell className="px-2 py-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={[
                                                            'font-poppins px-2 py-0.5 text-[11px] font-normal',
                                                            application.status === 'Menunggu'
                                                                ? 'border-[#E9B824] text-[#B58B00]'
                                                                : application.status === 'Ditolak'
                                                                  ? 'border-[#F04438] text-[#F04438]'
                                                                  : 'border-[#52C41A] text-[#52C41A]',
                                                        ].join(' ')}
                                                    >
                                                        {application.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-right">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-7 rounded-md bg-[#1980C0] px-3 text-xs text-white hover:bg-[#14699F]"
                                                        onClick={() => setSelectedHistory(application)}
                                                    >
                                                        Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function HistoryDetailCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-3">
            <h3 className="font-poppins mb-2 text-xs font-semibold text-[#121212]">{title}</h3>
            <div className="font-poppins space-y-1 text-[11px] leading-5 text-[#4B5563]">{children}</div>
        </section>
    );
}

function HistoryDetailRow({ label, value }: { label: string; value: string }) {
    return (
        <p>
            <span className="text-[#6B7280]">{label}: </span>
            <span className="font-medium text-[#121212]">{value}</span>
        </p>
    );
}
