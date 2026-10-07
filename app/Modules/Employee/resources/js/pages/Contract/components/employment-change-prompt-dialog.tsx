import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BriefcaseBusiness } from 'lucide-react';

interface EmploymentChangePromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNoChanges: () => void;
    onContinue: () => void;
}

export function EmploymentChangePromptDialog({ open, onOpenChange, onNoChanges, onContinue }: EmploymentChangePromptDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[430px] gap-0 overflow-hidden rounded-xl border-0 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.22)]" showCloseButton={false}>
                <div className="flex flex-col items-center text-center">
                    <div className="mb-5 grid size-10 place-items-center rounded-full bg-[#F1F5F9] text-[#1980C0]">
                        <BriefcaseBusiness className="size-4" />
                    </div>

                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Ada Perubahan Kepegawaian Lainnya?</DialogTitle>
                    <DialogDescription className="mt-4 max-w-[340px] font-poppins text-xs leading-5 text-[#64748B]">
                        Kontrak dan kompensasi berhasil diperbarui. Apakah ada perubahan lain, seperti{' '}
                        <span className="font-semibold text-[#334155]">mutasi, perubahan jabatan, atau kompensasi</span> yang perlu diproses?
                    </DialogDescription>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-lg border-[#1980C0] font-poppins text-xs font-semibold text-[#1980C0] hover:bg-[#EAF7FF] hover:text-[#1980C0]"
                        onClick={onNoChanges}
                    >
                        Tidak ada
                    </Button>
                    <Button type="button" className="h-10 rounded-lg bg-[#1980C0] font-poppins text-xs font-semibold hover:bg-[#1668A0]" onClick={onContinue}>
                        Ya, ada perubahan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
