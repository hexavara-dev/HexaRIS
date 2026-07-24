import { FileText } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface LeavePolicySection {
    title: string;
    points: string[];
}

interface DialogLeavePolicyProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    sections: LeavePolicySection[];
}

export function DialogLeavePolicy({
    open,
    onOpenChange,
    title = 'Kebijakan Cuti',
    description = 'Informasi hak dan kewajiban cuti karyawan',
    sections,
}: DialogLeavePolicyProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <div className="flex flex-col items-start gap-1">
                        <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                        <p className="font-poppins text-xs text-[#4F4F4F]">{description}</p>
                    </div>
                    <FileText className="h-[18px] w-[18px] shrink-0 text-[#4F4F4F]" />
                </DialogHeader>

                <div className="flex flex-col items-start gap-5 px-5 pt-4 pb-5">
                    {sections.map((section) => (
                        <div key={section.title} className="flex w-full flex-col items-start gap-3">
                            <p className="font-poppins text-sm font-semibold tracking-[0.01em] text-[#121212]">{section.title}</p>
                            <ul className="flex w-full flex-col items-start gap-1.5">
                                {section.points.map((point) => (
                                    <li key={point} className="flex w-full items-start gap-3">
                                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#1980C0]" />
                                        <p className="font-poppins w-full text-sm text-[#4F4F4F]">{point}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
