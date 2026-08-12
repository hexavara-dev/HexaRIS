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
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
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
