import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DialogConfirmProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    cancelLabel?: string;
    confirmLabel?: string;
    onCancel?: () => void;
    onConfirm: () => void;
}

export function DialogConfirm({
    open,
    onOpenChange,
    title,
    description,
    cancelLabel = 'Batal',
    confirmLabel = 'Hapus',
    onCancel,
    onConfirm,
}: DialogConfirmProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-9 px-5 pt-4 pb-5">
                    <p className="font-poppins text-sm text-[#121212]">{description}</p>
                    <div className="flex items-start gap-2">
                        <Button
                            variant="outline"
                            className="w-full border-[#00B4BF] text-[#00B4BF] hover:bg-[#00B4BF]/10 hover:text-[#00B4BF]"
                            onClick={() => {
                                onCancel?.();
                                onOpenChange(false);
                            }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button className="w-full" onClick={onConfirm}>
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
