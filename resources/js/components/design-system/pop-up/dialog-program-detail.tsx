import { Award, FileText, MoreVertical, X } from 'lucide-react';

import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface ProgramDetailRow {
    label: string;
    value: string;
}

export interface ProgramScheduleDay {
    label: string;
    date: string;
    time: string;
}

export interface ProgramDocument {
    id: string;
    name: string;
    size: string;
    fileType: string;
    tag: string;
    kind?: 'file' | 'certificate';
}

interface DialogProgramDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    mode: string;
    details: ProgramDetailRow[];
    schedule: ProgramScheduleDay[];
    participants: string[];
    documents: ProgramDocument[];
    onEdit?: () => void;
    onDelete?: () => void;
}

export function DialogProgramDetail({
    open,
    onOpenChange,
    title,
    mode,
    details,
    schedule,
    participants,
    documents,
    onEdit,
    onDelete,
}: DialogProgramDetailProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]"
            >
                <div className="flex w-full items-start gap-4 bg-[#1980C0] pt-8 pr-8 pb-6 pl-8">
                    <div className="flex w-full flex-col items-start">
                        <div className="flex items-center gap-2">
                            <p className="font-poppins text-2xl font-semibold text-white">{title}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="inline-flex items-center gap-3 rounded-md border border-[#E7E7E7] bg-white p-1">
                                        <MoreVertical className="h-3.5 w-3.5 text-[#1B1B1B]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={onEdit}>Edit Program</DropdownMenuItem>
                                    <DropdownMenuItem onClick={onDelete}>Hapus Program</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="font-poppins text-sm text-white/80">{mode}</p>
                    </div>
                    <DialogClose className="shrink-0" aria-label="Close">
                        <X className="h-5 w-5 text-white" />
                    </DialogClose>
                </div>

                <div className="flex w-full flex-col items-start gap-6 bg-white p-8">
                    <section className="flex w-full flex-col items-start gap-4">
                        <p className="font-poppins text-lg font-semibold text-[#121212]">Rincian</p>
                        <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-[#E7E7E7] bg-[#F8FAFC] p-5">
                            {details.map((row) => (
                                <div key={row.label} className="flex w-full items-start justify-between">
                                    <p className="font-poppins text-sm text-[#8F8F8F]">{row.label}</p>
                                    <p className="font-poppins text-sm font-semibold text-[#121212]">{row.value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex w-full flex-col items-start gap-4">
                        <p className="font-poppins text-lg font-semibold text-[#121212]">Jadwal</p>
                        <div className="flex w-full items-start gap-3">
                            {schedule.map((day) => (
                                <div
                                    key={day.label}
                                    className="flex w-full flex-col items-start gap-2 rounded-xl border border-[#E7E7E7] bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_4px_0_rgba(0,0,0,0.05)]"
                                >
                                    <p className="font-poppins text-xs font-semibold text-[#1980C0]">{day.label}</p>
                                    <p className="font-poppins text-sm text-[#121212]">{day.date}</p>
                                    <p className="font-poppins text-sm text-[#8F8F8F]">{day.time}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex w-full flex-col items-start gap-4">
                        <p className="font-poppins text-lg font-semibold text-[#121212]">Peserta</p>
                        <div className="flex w-full flex-wrap items-start gap-3">
                            {participants.map((name, index) => (
                                <div key={`${name}-${index}`} className="flex items-center gap-2 rounded-[100px] bg-[#F1F5F9] px-3 py-2">
                                    <p className="font-poppins text-sm text-[#121212]">{name}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex w-full flex-col items-start gap-4">
                        <p className="font-poppins text-lg font-semibold text-[#121212]">Dokumen</p>
                        <div className="flex w-full flex-col items-start gap-3">
                            {documents.map((doc) => {
                                const DocIcon = doc.kind === 'certificate' ? Award : FileText;
                                return (
                                    <div
                                        key={doc.id}
                                        className="flex w-full items-center gap-4 rounded-xl border border-[#E7E7E7] bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_4px_0_rgba(0,0,0,0.05)]"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F0]">
                                            <DocIcon className="h-6 w-6 text-[#E84A39]" strokeWidth={2} />
                                        </div>
                                        <div className="flex w-full flex-col items-start gap-0.5">
                                            <p className="font-poppins text-sm font-semibold text-[#121212]">{doc.name}</p>
                                            <p className="font-poppins text-xs text-[#8F8F8F]">
                                                {doc.size} • {doc.fileType}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-start rounded-md bg-[#F1F5F9] px-2.5 py-1.5">
                                            <p className="font-poppins text-xs font-semibold text-[#1980C0]">{doc.tag}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
