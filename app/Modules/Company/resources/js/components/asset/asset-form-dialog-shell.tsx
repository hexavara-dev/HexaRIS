import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type ReactNode } from 'react';

interface AssetFormDialogShellProps {
    open: boolean;
    title: string;
    onCancel: () => void;
    onSave: () => void;
    /** Widen the dialog for a two-column form layout instead of the default single-column max-w-lg. */
    wide?: boolean;
    children: ReactNode;
}

export function AssetFormDialogShell({ open, title, onCancel, onSave, wide, children }: AssetFormDialogShellProps) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent className={`flex max-h-[85vh] ${wide ? 'max-w-2xl' : 'max-w-lg'} flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0`}>
                <div className="border-b border-[#E2E8F0] px-6 py-5">
                    <p className="font-poppins text-lg font-bold text-[#0F172A]">{title}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

                <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] px-6 py-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="font-poppins h-10 rounded-lg border border-[#1980C0] px-6 text-sm font-semibold text-[#1980C0] transition-colors hover:bg-[#1980C0]/5"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="font-poppins h-10 rounded-lg bg-[#1980C0] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1980C0]/90"
                    >
                        Simpan
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
