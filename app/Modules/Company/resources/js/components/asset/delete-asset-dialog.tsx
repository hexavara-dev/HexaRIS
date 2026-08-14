import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DeleteAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

/** Confirmation before deleting a loaned asset — module-styled, matching DeleteTemplateDialog's pattern rather than the generic shared ConfirmDialog. */
export function DeleteAssetDialog({ open, onOpenChange, onConfirm }: DeleteAssetDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-5 rounded-2xl p-8" showCloseButton={false}>
                <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Hapus Aset Dipinjam?</DialogTitle>
                <DialogDescription className="font-poppins text-sm leading-relaxed text-[#4F4F4F]">
                    Anda akan menghapus data aset perusahaan secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh informasi terkait aset
                    akan hilang.
                </DialogDescription>
                <div className="flex items-center gap-4">
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
                            toast.success('Aset berhasil dihapus.');
                            onOpenChange(false);
                        }}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Hapus
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
