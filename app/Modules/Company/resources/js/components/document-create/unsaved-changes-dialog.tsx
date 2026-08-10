import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface UnsavedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Leave without saving — the blocked navigation resumes as-is. */
    onDiscard: () => void;
    /** Save first, then the blocked navigation resumes. */
    onSave: () => void;
}

/** Shown when navigating away from Buat Template while it has unsaved content — see useUnsavedChangesGuard. */
export function UnsavedChangesDialog({ open, onOpenChange, onDiscard, onSave }: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-5 rounded-2xl p-8" showCloseButton={false}>
                <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Template Perubahan Belum Disimpan?</DialogTitle>
                <DialogDescription className="font-poppins text-sm leading-relaxed text-[#4F4F4F]">
                    Anda memiliki perubahan yang belum disimpan. Simpan terlebih dahulu untuk menghindari kehilangan data.
                </DialogDescription>
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onDiscard}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                    >
                        Tetap Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
