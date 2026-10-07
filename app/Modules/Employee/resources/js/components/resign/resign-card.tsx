import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import type { ResignRecord } from '../../pages/Resign/resign-dummy';

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

interface ResignCardProps {
    record: ResignRecord;
    /** The Approve/Tolak dialogs show avatar+name inside the card; Detail Karyawan puts those in the dialog header instead. */
    showIdentity?: boolean;
    /** Inline Approve button (Detail Karyawan) — only wired up while the request is still awaiting approval. */
    onApprove?: () => void;
}

/**
 * The pink-gradient pengajuan card shared by the Approve, Tolak and Detail
 * dialogs — every decision reviews the same resign request before committing.
 */
export function ResignCard({ record, showIdentity = true, onApprove }: ResignCardProps) {
    return (
        <div className="rounded-2xl border border-[#F0A0A0] bg-[linear-gradient(115deg,#FDECEC_0%,#FBDEDE_50%,#F8CFCF_100%)] px-5 py-4">
            {showIdentity && (
                <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-[#1980C0] text-base font-semibold text-white">{initials(record.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <p className="text-lg font-semibold text-[#121212]">{record.name}</p>
                        <p className="text-sm text-[#374151]">{record.position}</p>
                    </div>
                </div>
            )}

            <div className={`flex items-center gap-4 ${showIdentity ? 'mt-4' : ''}`}>
                <div className="min-w-0 flex-1 space-y-1 text-sm text-[#374151]">
                    <p>Tgl Pengajuan : {record.submittedAt}</p>
                    <p>Tgl Resign : {record.resignDate ?? record.submittedAt}</p>
                    <p>Alasan : {record.reason}</p>
                    <p>Doc Pendukung: {record.doc ?? '–'}</p>
                    {record.accDate && <p>Tgl ACC : {record.accDate}</p>}
                    {record.rejectReason && <p>Alasan Tolak : {record.rejectReason}</p>}
                </div>

                {onApprove && (
                    <Button
                        type="button"
                        onClick={onApprove}
                        className="h-11 shrink-0 rounded-xl bg-[#1980C0] px-6 text-sm font-semibold hover:bg-[#1673AD]"
                    >
                        Approve
                    </Button>
                )}
            </div>
        </div>
    );
}
