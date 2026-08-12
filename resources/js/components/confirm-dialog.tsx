import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    /** Blocks closing via an outside click — the dialog only closes via Batal/Confirm/the X button. */
    preventOutsideClose?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Are you sure?',
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = true,
    preventOutsideClose = false,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg gap-4" onInteractOutside={preventOutsideClose ? (e) => e.preventDefault() : undefined}>
                <DialogHeader className="border-b border-[#E7E7E7] pb-4">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {description && <DialogDescription className="whitespace-pre-line text-[#121212]">{description}</DialogDescription>}
                <DialogFooter className="pt-4 sm:justify-start">
                    <Button
                        variant="outline"
                        className="flex-1 border-[#00B4BF] px-6 py-3 text-[#00B4BF] hover:text-[#00B4BF]"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        className="flex-1 px-6 py-3"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
