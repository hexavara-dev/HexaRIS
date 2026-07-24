import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DialogSendToProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    label?: string;
    placeholder?: string;
    value: string;
    onValueChange: (value: string) => void;
    error?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    onCancel?: () => void;
    onConfirm: () => void;
}

export function DialogSendTo({
    open,
    onOpenChange,
    title = 'Kirim Ke',
    label = 'Tambahkan Email',
    placeholder = 'Masukkan Email',
    value,
    onValueChange,
    error,
    cancelLabel = 'Batal',
    confirmLabel = 'Kirim',
    onCancel,
    onConfirm,
}: DialogSendToProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-7 py-5 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold tracking-[0.01em] text-[#121212]">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-9 px-7 pt-5 pb-5">
                    <div className="flex flex-col gap-2">
                        <label className={cn('font-poppins text-sm font-semibold tracking-[0.01em]', error ? 'text-[#E84A39]' : 'text-[#121212]')}>
                            {label} *
                        </label>
                        <Input
                            type="email"
                            value={value}
                            onChange={(event) => onValueChange(event.target.value)}
                            placeholder={placeholder}
                            className={cn(
                                'font-poppins h-auto rounded-2xl border px-4 py-4 text-sm placeholder:text-[#ACACAC]',
                                error ? 'border-[#E84A39]' : 'border-[#ACACAC]',
                            )}
                        />
                        {error && <p className="font-poppins text-xs text-[#E84A39]">{error}</p>}
                    </div>

                    <Separator className="bg-[#E7E7E7]" />

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
