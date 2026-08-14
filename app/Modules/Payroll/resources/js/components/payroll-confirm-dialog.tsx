import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PayrollConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

/**
 * Module-styled, not the shared confirm-dialog.tsx — matches the Payroll design reference
 * (bordered header, full-width primary-outlined Cancel, outside-click-blocked) without leaking
 * that styling onto Iam/docs, which still use the shared component's default look.
 */
export function PayrollConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
}: PayrollConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg gap-4" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="border-b border-[#E7E7E7] pb-4">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {description && <DialogDescription className="whitespace-pre-line text-[#121212]">{description}</DialogDescription>}
                <DialogFooter className="pt-4 sm:justify-start">
                    <Button variant="outline" className="flex-1 border-primary px-6 py-3 text-primary hover:text-primary" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button
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
