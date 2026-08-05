import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface ArchiveConfirmDialogProps {
    employeeName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

/**
 * Module-styled, not the shared destructive-red confirm-dialog.tsx — archiving is explicitly
 * non-destructive (the employee's data is only hidden, never deleted), so it borrows the same
 * blue button classes StepForm already uses for this module instead of reading as alarming.
 */
export function ArchiveConfirmDialog({ employeeName, open, onOpenChange, onConfirm }: ArchiveConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">Arsipkan Karyawan?</DialogTitle>
                <DialogDescription className="font-poppins text-sm text-[#4F4F4F]">
                    Kamu yakin ingin mengarsipkan {employeeName}? Semua data yang sebelumnya terkait tidak lagi terhubung dengan karyawan ini.
                </DialogDescription>
                <div className="flex items-center gap-4 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Arsipkan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
