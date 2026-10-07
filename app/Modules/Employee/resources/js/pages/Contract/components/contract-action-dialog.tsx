import { Button } from '@/components/ui/button';
import { FileTypeIcon } from '@/components/form/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BriefcaseBusiness, CalendarDays, FileText, FileUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { type ContractAction, type EmployeeContractRow } from '../column';
import { saveContractActionDraft } from '../storage';
import { EmploymentChangeDialog } from './employment-change-dialog';
import { EmploymentChangePromptDialog } from './employment-change-prompt-dialog';

interface ContractActionDialogProps {
    action: ContractAction | null;
    contract: EmployeeContractRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const actionCopy: Record<ContractAction, { title: string; confirmLabel: string }> = {
    extend: {
        title: 'Perpanjang Kontrak',
        confirmLabel: 'Simpan',
    },
    'make-permanent': {
        title: 'Tetapkan Karyawan Tetap',
        confirmLabel: 'Simpan',
    },
    terminate: {
        title: 'Putus Kontrak',
        confirmLabel: 'Ya, Putus Kontrak',
    },
    edit: {
        title: 'Edit Kontrak',
        confirmLabel: 'Simpan',
    },
};

// Render ringkasan karyawan pada dialog aksi kontrak.
function ContractEmployeeSummary({ contract }: { contract: EmployeeContractRow }) {
    return (
        <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#111827] text-[11px] font-semibold text-white">
                {contract.full_name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
            </div>
            <div className="min-w-0">
                <p className="truncate font-poppins text-sm font-semibold text-[#121212]">{contract.full_name}</p>
                <p className="truncate font-poppins text-xs text-[#6B7280]">{contract.position}</p>
            </div>
        </div>
    );
}

// Render tanda wajib isi (*) pada label field.
function RequiredMark() {
    return <span className="text-[#E84A39]">*</span>;
}

// Render area upload kontrak:
// - kalau belum ada file, tampil dropzone.
// - kalau sudah ada file, tampil ringkasan file + tombol hapus.
function ContractUploadField({ selectedFile, onFileChange }: { selectedFile: File | null; onFileChange: (file: File | null) => void }) {
    if (selectedFile) {
        return (
            <div className="flex min-h-[62px] items-center justify-between rounded-lg border border-[#8DD3FF] bg-[#F0FAFF] px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#1980C0] shadow-sm">
                        <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-poppins text-xs font-semibold text-[#121212]">{selectedFile.name}</p>
                        <p className="font-poppins text-[10px] text-[#6B7280]">{Math.max(1, Math.ceil(selectedFile.size / 1024))} KB • siap diunggah</p>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 shrink-0 rounded-full p-0 text-[#667085] hover:bg-white hover:text-[#E84A39]"
                    onClick={() => onFileChange(null)}
                >
                    <X className="size-4" />
                    <span className="sr-only">Hapus file</span>
                </Button>
            </div>
        );
    }

    return (
        <label className="flex min-h-[62px] cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-[#B8B8B8] bg-white px-4 py-3 text-center transition-colors hover:bg-[#F8FAFC]">
            <FileUp className="mb-1 size-5 text-[#D1D5DB]" />
            <span className="font-poppins text-[10px] leading-4 text-[#6B7280]">
                Seret file ke sini atau klik untuk mengunggah,
                <br />
                atau <span className="text-[#1980C0]">telusuri</span>.
            </span>
            <Input type="file" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
        </label>
    );
}

// Render row dokumen kontrak existing pada mode Edit Kontrak.
// Reuse FileTypeIcon supaya icon PDF sama dengan komponen dokumen lain di app.
function ExistingContractDocumentRow() {
    return (
        <div className="flex min-h-[58px] items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2">
            <FileTypeIcon name="Kontrak.PDF" className="h-9 w-9" />
            <div className="min-w-0">
                <p className="truncate font-poppins text-xs font-semibold text-[#121212]">Kontrak.PDF</p>
                <p className="font-poppins text-[10px] text-[#6B7280]">0.8 Mb</p>
            </div>
        </div>
    );
}

// Dialog utama yang muncul setelah user klik action dari dropdown tabel kontrak.
// Tugasnya hanya menyimpan aksi kontrak, lalu membuka flow perubahan kepegawaian lanjutan.
export function ContractActionDialog({ action, contract, open, onOpenChange }: ContractActionDialogProps) {
    const copy = action ? actionCopy[action] : actionCopy.extend;
    const isEditAction = action === 'edit';
    const isPermanentAction = action === 'make-permanent';
    const isTerminateAction = action === 'terminate';
    const isContractFormAction = action === 'extend' || action === 'make-permanent';

    const [contractType, setContractType] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string | null>('2026-09-12');
    const [endDate, setEndDate] = useState<string | null>('2027-09-12');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [stopContractResponsibility, setStopContractResponsibility] = useState(true);
    const [savedContract, setSavedContract] = useState<EmployeeContractRow | null>(null);

    // Flow setelah kontrak disimpan:
    // 1. Tutup dialog kontrak ini.
    // 2. Buka prompt kecil "Ada Perubahan Kepegawaian Lainnya?".
    // 3. Dari prompt itu user masuk ke wizard Perubahan Lainnya.
    const [employmentChangePromptOpen, setEmploymentChangePromptOpen] = useState(false);
    const [employmentChangeDialogOpen, setEmploymentChangeDialogOpen] = useState(false);

    // Nilai awal step Mutasi di wizard:
    // - klik "Tidak ada" pada prompt kecil => wizard tetap dibuka, tapi radio "Tidak Ada" aktif.
    // - klik "Ya, ada perubahan" pada prompt kecil => wizard dibuka dengan radio "Ya" aktif.
    const [employmentChangeInitialBranchChange, setEmploymentChangeInitialBranchChange] = useState<'no' | 'yes'>('yes');

    // Reset field dialog setiap kali dialog dibuka untuk row kontrak baru.
    useEffect(() => {
        if (!open || !contract) return;

        setContractType(isEditAction ? 'PKWT 1 Tahun' : isPermanentAction ? 'PKWTT' : contract.contract_type === 'PKWTT' ? 'PKWTT' : 'PKWT');
        setStartDate('2026-09-12');
        setEndDate('2027-09-12');
        setSelectedFile(null);
        setStopContractResponsibility(true);
    }, [isEditAction, isPermanentAction, open, contract]);

    // Simpan perubahan kontrak, tampilkan toast,
    // lalu buka prompt "Ada Perubahan Kepegawaian Lainnya?".
    const saveAction = () => {
        if (!action || !contract) return;

        saveContractActionDraft({
            action,
            contract,
            values: {
                contractType,
                startDate,
                endDate,
                uploadedFile: selectedFile,
            },
        });

        setSavedContract(contract);
        toast.success('Data kontrak berhasil disimpan.');
        onOpenChange(false);

        if (action === 'terminate') return;

        // Radix dialog butuh jeda 1 tick supaya dialog kontrak benar-benar unmount
        // sebelum dialog prompt berikutnya dibuka.
        window.setTimeout(() => setEmploymentChangePromptOpen(true), 0);
    };

    // Buka wizard Perubahan Lainnya dengan nilai awal step Mutasi.
    const openEmploymentChangeDialog = (initialBranchChange: 'no' | 'yes') => {
        setEmploymentChangeInitialBranchChange(initialBranchChange);
        setEmploymentChangePromptOpen(false);

        // Urutannya harus prompt kecil tutup dulu, baru wizard besar buka.
        // Ini mencegah dua dialog Radix berebut focus trap.
        window.setTimeout(() => setEmploymentChangeDialogOpen(true), 0);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={[
                        'gap-0 overflow-hidden rounded-xl border-0 bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.22)]',
                        isTerminateAction ? 'max-w-[430px]' : 'max-w-xl',
                    ].join(' ')}
                    showCloseButton={!isTerminateAction}
                >
                    {isTerminateAction ? (
                        <>
                            <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
                                <div className="mb-5 grid size-10 place-items-center rounded-full bg-[#F1F5F9] text-[#1980C0]">
                                    <BriefcaseBusiness className="size-4" />
                                </div>
                                <DialogTitle className="max-w-[280px] font-poppins text-base font-semibold leading-6 text-[#121212]">
                                    Apakah Anda yakin ingin memutus kontrak karyawan ini?
                                </DialogTitle>
                                <p className="mt-5 max-w-[330px] font-poppins text-xs leading-5 text-[#64748B]">
                                    Jika diputus kontrak, status karyawan akan otomatis dinonaktifkan setelah masa kontrak terakhir berakhir.
                                </p>
                            </div>

                            <DialogFooter className="grid grid-cols-2 gap-2 px-6 pb-6 sm:space-x-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-lg border-[#1980C0] font-poppins text-xs font-semibold text-[#1980C0] hover:bg-[#EAF7FF] hover:text-[#1980C0]"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="button" className="h-10 rounded-lg bg-[#1980C0] font-poppins text-xs font-semibold hover:bg-[#1668A0]" onClick={saveAction}>
                                    {copy.confirmLabel}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader className="border-b border-[#E7E7E7] px-4 py-3 text-left">
                                <DialogTitle className="font-poppins text-sm font-semibold text-[#121212]">{copy.title}</DialogTitle>
                            </DialogHeader>

                            {contract && (
                                <div className="space-y-5 px-4 py-5">
                                    <ContractEmployeeSummary contract={contract} />

                                    {isEditAction ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                    Kontrak <RequiredMark />
                                                </Label>
                                                <Select defaultValue="PKWT 1 Tahun" value={contractType ?? undefined} onValueChange={setContractType}>
                                                    <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                                        <SelectValue placeholder="Pilih kontrak" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PKWT 1 Tahun">PKWT 1 Tahun</SelectItem>
                                                        <SelectItem value="PKWT">PKWT</SelectItem>
                                                        <SelectItem value="PKWTT">PKWTT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                    Upload Kontrak <RequiredMark />
                                                </Label>
                                                <ExistingContractDocumentRow />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                    Alasan Perubahan <RequiredMark />
                                                </Label>
                                                <Textarea
                                                    defaultValue="Kesesuaian penentuan kontrak diawal."
                                                    className="min-h-[88px] resize-none rounded-xl border-[#C9CED6] font-poppins text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#1980C0] focus-visible:ring-offset-0"
                                                />
                                            </div>

                                            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#F7F7F7] px-3 py-2.5">
                                                <Checkbox
                                                    checked={stopContractResponsibility}
                                                    onCheckedChange={(checked) => setStopContractResponsibility(checked === true)}
                                                    className="size-4"
                                                />
                                                <span className="font-poppins text-[11px] text-[#4B5563]">
                                                    Stop tertanggung jawab untuk proses administrasi data kontrak ini
                                                </span>
                                            </label>
                                        </div>
                                    ) : isContractFormAction ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                    Jenis Kontrak <RequiredMark />
                                                </Label>
                                                <Select defaultValue="PKWT" value={contractType ?? undefined} onValueChange={setContractType}>
                                                    <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                                        <SelectValue placeholder="Pilih jenis kontrak" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PKWT">PKWT</SelectItem>
                                                        <SelectItem value="PKWTT">PKWTT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                        Tgl Mulai Kontrak Baru <RequiredMark />
                                                    </Label>
                                                    <div className="relative">
                                                        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#667085]" />
                                                        <Input
                                                            type="date"
                                                            disabled
                                                            value={startDate ?? undefined}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="h-10 rounded-xl border-[#C9CED6] bg-[#F3F4F6] pl-9 font-poppins text-xs text-[#4B5563] shadow-none disabled:cursor-not-allowed disabled:opacity-100"
                                                        />
                                                    </div>

                                                    <label className="mt-2 flex items-center gap-2 font-poppins text-[11px] text-[#4B5563]">
                                                        <Checkbox checked={isPermanentAction} disabled className="size-3.5 rounded-[3px]" />
                                                        <span>Seterusnya</span>
                                                    </label>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                        Tgl Berakhir Kontrak Baru <RequiredMark />
                                                    </Label>
                                                    <div className="relative">
                                                        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#667085]" />
                                                        <Input
                                                            type="date"
                                                            disabled
                                                            value={endDate ?? undefined}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            className="h-10 rounded-xl border-[#C9CED6] bg-[#F3F4F6] pl-9 font-poppins text-xs text-[#4B5563] shadow-none disabled:cursor-not-allowed disabled:opacity-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                                                    Upload Kontrak Baru <RequiredMark />
                                                </Label>
                                                <ContractUploadField selectedFile={selectedFile} onFileChange={setSelectedFile} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-[#E7E7E7] bg-[#FAFBFD] p-4 font-poppins text-sm text-[#4B5563]">
                                            Aksi ini sudah siap dibuka dari dropdown. Form detailnya bisa kamu lengkapi mengikuti kebutuhan state dan validasi.
                                        </div>
                                    )}
                                </div>
                            )}

                            <DialogFooter className="grid grid-cols-2 gap-2 border-t border-[#E7E7E7] px-4 py-4 sm:space-x-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-xl border-[#1980C0] font-poppins text-xs font-semibold text-[#1980C0] hover:bg-[#EAF7FF] hover:text-[#1980C0]"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="button" className="h-10 rounded-xl bg-[#1980C0] font-poppins text-xs font-semibold hover:bg-[#1668a0]" onClick={saveAction}>
                                    {copy.confirmLabel}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <EmploymentChangePromptDialog
                open={employmentChangePromptOpen}
                onOpenChange={setEmploymentChangePromptOpen}
                // Tidak berhenti di sini; tetap masuk wizard agar user bisa cek step berikutnya:
                // Mutasi -> Perubahan Jabatan -> Kompensasi -> Preview.
                onNoChanges={() => openEmploymentChangeDialog('no')}
                onContinue={() => openEmploymentChangeDialog('yes')}
            />
            <EmploymentChangeDialog
                contract={savedContract}
                initialBranchChange={employmentChangeInitialBranchChange}
                open={employmentChangeDialogOpen}
                onOpenChange={setEmploymentChangeDialogOpen}
            />
        </>
    );
}
