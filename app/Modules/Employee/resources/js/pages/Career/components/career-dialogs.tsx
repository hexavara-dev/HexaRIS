import { FileTypeIcon, FileUploadField, fileToStoredFile } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PerubahanCard } from '../../../components/approve/perubahan-card';
import { type PengajuanPerubahan } from '../../Data/pengajuan-dummy';
import { isValidCareerContractFile } from '../storage';
import { type CareerDecisionInput, type CareerHistoryRow, type CareerRequestInput } from '../types';

export function CareerRequestDialog({
    open,
    onOpenChange,
    onSubmit,
    initialValue,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (input: CareerRequestInput) => void;
    initialValue?: CareerHistoryRow | null;
}) {
    const [name, setName] = useState('');
    const [changeType, setChangeType] = useState('Mutasi');
    const [branch, setBranch] = useState('Jakarta');
    const [organization, setOrganization] = useState('Creative');
    const [position, setPosition] = useState('Staff');

    useEffect(() => {
        if (!open) return;

        setName(initialValue?.name ?? '');
        setChangeType(initialValue?.changeType ?? 'Mutasi');
        setBranch(initialValue?.currentBranch ?? 'Jakarta');
        setOrganization(initialValue?.currentOrganization ?? 'Creative');
        setPosition(initialValue?.currentPosition ?? 'Staff');
    }, [initialValue, open]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;

        onSubmit({
            name: name.trim(),
            changeType,
            currentBranch: branch,
            currentOrganization: organization.trim(),
            currentPosition: position.trim(),
        });
        setName('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{initialValue ? 'Edit Pengajuan Karir' : 'Tambah Pengajuan Karir'}</DialogTitle>
                    <DialogDescription>
                        {initialValue ? 'Perbarui data perubahan karir karyawan.' : 'Masukkan perubahan karir yang diajukan untuk karyawan.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="career-employee-name">Nama Karyawan</Label>
                        <Input
                            id="career-employee-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Nama karyawan"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="career-change-type">Jenis Perubahan</Label>
                        <Select value={changeType} onValueChange={setChangeType}>
                            <SelectTrigger id="career-change-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="Mutasi">Mutasi</SelectItem>
                                    <SelectItem value="Perubahan Jabatan">Perubahan Jabatan</SelectItem>
                                    <SelectItem value="Mutasi & Perubahan Jabatan">Mutasi &amp; Perubahan Jabatan</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="career-current-branch">Cabang Saat Ini</Label>
                            <Select value={branch} onValueChange={setBranch}>
                                <SelectTrigger id="career-current-branch">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="Jakarta">Jakarta</SelectItem>
                                        <SelectItem value="Surabaya">Surabaya</SelectItem>
                                        <SelectItem value="Bandung">Bandung</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="career-organization">Organisasi Saat Ini</Label>
                            <Input id="career-organization" value={organization} onChange={(event) => setOrganization(event.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="career-position">Posisi Jabatan Saat Ini</Label>
                        <Input id="career-position" value={position} onChange={(event) => setPosition(event.target.value)} required />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" size="sm" className="h-11 sm:h-9" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" size="sm" className="h-11 sm:h-9">
                            {initialValue ? 'Perbarui Pengajuan' : 'Simpan Pengajuan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DetailLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 text-xs leading-5">
            <dt className="text-[#667085]">{label}</dt>
            <dd className="break-words text-[#344054]">: {value}</dd>
        </div>
    );
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Card className="rounded-xl border-[#E7E7E7] shadow-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm leading-5 font-semibold tracking-normal text-[#1B1B1B]">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-4 pt-0">{children}</CardContent>
        </Card>
    );
}

function toFullYearDate(date: string): string {
    const [day, month, year] = date.split('-');
    if (day?.length === 4 && month && year) return `${year}-${month}-${day}`;
    return day && month && year ? `${day}-${month}-${year.length === 2 ? `20${year}` : year}` : date;
}

function toInputDate(date: string): string {
    const [day, month, year] = date.split('-');
    if (!day || !month || !year) return '';
    return `${year.length === 2 ? `20${year}` : year}-${month}-${day}`;
}

function buildChangeRequest(row: CareerHistoryRow): PengajuanPerubahan {
    const includesMutation = row.changeType === 'Mutasi' || row.changeType === 'Mutasi & Perubahan Jabatan';
    const includesPositionChange = row.changeType === 'Perubahan Jabatan' || row.changeType === 'Mutasi & Perubahan Jabatan';

    return {
        id: row.id,
        employeeId: row.employeeId,
        name: row.name,
        role: `${row.currentPosition} ${row.currentOrganization}`,
        branch: row.currentBranch,
        organization: row.currentOrganization,
        position: row.currentPosition,
        status: 'Aktif',
        changes: row.changeType,
        submittedAt: toFullYearDate(row.submittedAt),
        fields: [
            ...(includesMutation
                ? [
                      {
                          label: 'Cabang',
                          before: row.currentBranch,
                          after: row.targetBranch ?? row.currentBranch,
                      },
                  ]
                : []),
            ...(includesPositionChange
                ? [
                      {
                          label: 'Organisasi',
                          before: row.currentOrganization,
                          after: row.targetOrganization ?? row.currentOrganization,
                      },
                      {
                          label: 'Posisi Jabatan',
                          before: row.currentPosition,
                          after: row.targetPosition ?? row.currentPosition,
                      },
                      ...(row.newLevel
                          ? [
                                {
                                    label: 'Level',
                                    before: '-',
                                    after: row.newLevel,
                                },
                            ]
                          : []),
                      ...(row.directSupervisor
                          ? [
                                {
                                    label: 'Atasan Langsung',
                                    before: '-',
                                    after: row.directSupervisor,
                                },
                            ]
                          : []),
                  ]
                : []),
        ],
    };
}

function CareerChangeSummary({ row }: { row: CareerHistoryRow }) {
    const changeRequest = buildChangeRequest(row);

    return (
        <>
            <PerubahanCard
                pengajuan={changeRequest}
                details={[
                    { label: 'Alasan Perubahan', value: row.reason ?? 'Kebijakan Perusahaan' },
                    { label: 'Tgl Efektif Diajukan', value: toFullYearDate(row.effectiveDate ?? row.submittedAt) },
                ]}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailCard title="Data Kontrak Terbaru">
                    <dl className="flex flex-col gap-1">
                        {row.hasContractChange === false ? (
                            <DetailLine label="Status" value="Tidak ada perubahan kontrak" />
                        ) : (
                            <>
                                <DetailLine label="Jenis Kontrak" value={row.contractType ?? 'PKWT'} />
                                <DetailLine label="Alasan Perubahan" value={row.reason ?? 'Performance bagus'} />
                            </>
                        )}
                    </dl>

                    {row.hasContractChange !== false && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E7E7E7] bg-white p-3 shadow-[0px_3px_10px_rgba(15,23,42,0.07)]">
                            <FileTypeIcon name={row.contractDocument?.name ?? 'Kontrak.PDF'} className="size-10" />
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#121212]">{row.contractDocument?.name ?? 'Kontrak.PDF'}</p>
                                <p className="mt-0.5 text-[11px] text-[#667085]">
                                    {row.contractDocument ? `${(row.contractDocument.size / 1024 / 1024).toFixed(1)} Mb` : '0.8 Mb'}
                                </p>
                            </div>
                        </div>
                    )}
                </DetailCard>

                <DetailCard title="Data Kompensasi Terbaru">
                    <dl className="flex flex-col gap-1">
                        {row.hasCompensationChange === false ? (
                            <DetailLine label="Status" value="Tidak ada perubahan kompensasi" />
                        ) : (
                            <>
                                <DetailLine label="Gaji Terbaru" value={row.salary ?? 'Rp. 10.000.000'} />
                                <DetailLine label="Tunjangan Baru" value={row.allowance ?? 'BPJS Kesehatan, Makan, Internet'} />
                                <DetailLine label="No. BPJS Kesehatan" value={row.bpjsNumber ?? '092389391'} />
                                <DetailLine label="Alasan Mutasi" value={row.reason ?? 'Kebijakan perusahaan'} />
                            </>
                        )}
                    </dl>
                </DetailCard>
            </div>
        </>
    );
}

export function CareerDetailDialog({ row, onOpenChange }: { row: CareerHistoryRow | null; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={row !== null} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogHeader className="border-b border-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="text-base">Detail Perubahan</DialogTitle>
                    <DialogDescription className="sr-only">Informasi lengkap perubahan karir karyawan.</DialogDescription>
                </DialogHeader>
                {row && (
                    <div className="flex flex-col gap-3 overflow-y-auto p-4">
                        <CareerChangeSummary row={row} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function CareerDecisionDialog({
    row,
    action,
    onOpenChange,
    onDecision,
}: {
    row: CareerHistoryRow | null;
    action: 'approve' | 'reject';
    onOpenChange: (open: boolean) => void;
    onDecision: (row: CareerHistoryRow, input: CareerDecisionInput) => boolean;
}) {
    const isApprove = action === 'approve';
    const actionLabel = isApprove ? 'Approve' : 'Tolak';
    const [effectiveDate, setEffectiveDate] = useState('');
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!row) return;
        setEffectiveDate(toInputDate(row.submittedAt));
        setContractFile(null);
        setRejectionReason('');
        setIsSubmitting(false);
    }, [row, isApprove]);

    const canSubmit = isApprove ? Boolean(effectiveDate && contractFile) : Boolean(rejectionReason.trim());

    const selectContractFile = (file: File | null) => {
        if (file && !isValidCareerContractFile(file)) {
            toast.error('Format kontrak harus PDF, DOC, atau DOCX.');
            return;
        }

        setContractFile(file);
    };

    const submitApproval = async (event: FormEvent) => {
        event.preventDefault();
        if (!row || !canSubmit) return;
        setIsSubmitting(true);

        try {
            if (isApprove && contractFile) {
                const storedFile = await fileToStoredFile(contractFile);
                const saved = onDecision(row, {
                    effectiveDate,
                    contractDocument: {
                        ...storedFile,
                        size: contractFile.size,
                        lastModified: contractFile.lastModified,
                    },
                });

                if (saved) onOpenChange(false);
            } else {
                const saved = onDecision(row, { rejectionReason: rejectionReason.trim() });
                if (saved) onOpenChange(false);
            }
        } catch {
            toast.error('Dokumen kontrak gagal diproses. Silakan pilih file kembali.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={row !== null} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogHeader className="border-b border-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="text-base">{actionLabel} Pengajuan Perubahan</DialogTitle>
                    <DialogDescription className="sr-only">
                        Periksa perubahan karyawan sebelum {isApprove ? 'menyetujui' : 'menolak'} pengajuan.
                    </DialogDescription>
                </DialogHeader>

                {row && (
                    <form onSubmit={submitApproval} className="contents">
                        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
                            <CareerChangeSummary row={row} />

                            {isApprove && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="career-effective-date">
                                        Tanggal Efektif Perubahan <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="career-effective-date"
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(event) => setEffectiveDate(event.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {isApprove ? (
                                <FileUploadField
                                    label="Upload Kontrak Baru"
                                    required
                                    file={contractFile}
                                    onSelect={selectContractFile}
                                    onRemove={() => setContractFile(null)}
                                    accept=".pdf,.doc,.docx"
                                    dense
                                />
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="career-rejection-reason">
                                        Alasan Tolak Pengajuan <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="career-rejection-reason"
                                        value={rejectionReason}
                                        onChange={(event) => setRejectionReason(event.target.value)}
                                        placeholder="Masukkan alasan penolakan pengajuan"
                                        className="min-h-24 resize-none rounded-xl"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 border-t border-[#E7E7E7] p-4 sm:gap-3">
                            <Button type="button" variant="outline" className="h-11 flex-1 sm:h-10" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="h-11 flex-1 sm:h-10" disabled={!canSubmit || isSubmitting}>
                                {isSubmitting ? 'Menyimpan...' : actionLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
