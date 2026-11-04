import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageIcon } from 'lucide-react';
import { type AttendanceIssue } from './attendance-issue-data';

function initialsOf(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
            <span className="font-poppins text-[#6B7280]">{label}</span>
            <span className="font-poppins text-[#111827]">{value}</span>
        </div>
    );
}

export function AttendanceIssueConfirmDialog({
    issue,
    onOpenChange,
    onConfirm,
}: {
    issue: AttendanceIssue | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (issue: AttendanceIssue) => void;
}) {
    return (
        <Dialog open={issue !== null} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins max-w-md p-0">
                {issue && (
                    <>
                        <DialogHeader className="border-b border-[#E5E7EB] px-6 py-4">
                            <DialogTitle className="text-base font-semibold text-[#111827]">Konfirmasi</DialogTitle>
                            <DialogDescription className="sr-only">Konfirmasi penerimaan laporan masalah absensi</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 px-6 pb-2">
                            <div className="rounded-xl border border-[#E5E7EB] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarFallback className="bg-[#E8F3FB] text-xs font-semibold text-[#1980C0]">{initialsOf(issue.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold text-[#111827]">{issue.name}</p>
                                            <p className="text-xs text-[#6B7280]">{issue.position}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[#6B7280]">Tgl Laporan</p>
                                        <p className="text-xs font-semibold text-[#111827]">{issue.reportedAt}</p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <DetailRow label="Jam Kerja" value={issue.shift} />
                                    <DetailRow label="Lokasi" value={issue.location} />
                                    <DetailRow label="Check In/Out" value={`${issue.checkIn} - ${issue.checkOut}`} />
                                    <DetailRow label="Keterangan" value={issue.reason} />
                                </div>

                                <div className="mt-4 flex gap-2">
                                    {issue.attachments.map((file) => (
                                        <div key={file} className="grid h-20 w-24 place-items-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF]" title={file}>
                                            <ImageIcon className="size-6" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm leading-6 text-[#374151]">
                                Apakah Anda yakin ingin menerima laporan ini? Jika diterima, laporan akan tercatat dalam data absensi karyawan.
                            </p>
                        </div>

                        <DialogFooter className="grid grid-cols-2 gap-3 px-6 pt-2 pb-6">
                            <Button variant="outline" className="h-10 border-[#1980C0] text-[#1980C0] hover:bg-[#F0F7FC] hover:text-[#1980C0]" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button className="h-10 bg-[#1980C0] text-white hover:bg-[#1570AA]" onClick={() => onConfirm(issue)}>
                                Terima Laporan
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
