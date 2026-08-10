import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';

interface DeleteTemplateDialogProps {
    /** `null` closes the dialog — same on/off signal as TemplateDetailDialog. */
    template: DocumentTemplate | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (id: string) => void;
}

/** Confirmation before deleting a template — module-styled, matching ArchiveConfirmDialog's pattern rather than the generic shared ConfirmDialog. */
export function DeleteTemplateDialog({ template, onOpenChange, onConfirm }: DeleteTemplateDialogProps) {
    return (
        <Dialog open={template !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-5 rounded-2xl p-8" showCloseButton={false}>
                <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Hapus Template?</DialogTitle>
                <DialogDescription className="font-poppins text-sm leading-relaxed text-[#4F4F4F]">
                    Anda akan menghapus template "{template?.name}" secara permanen. Tindakan ini tidak dapat dibatalkan.
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
                            if (template) onConfirm(template.id);
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
