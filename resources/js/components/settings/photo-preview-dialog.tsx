import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    src: string | null;
    onClose: () => void;
    onChangePhoto: () => void;
    onConfirm: () => void;
}

export function PhotoPreviewDialog({ src, onClose, onChangePhoto, onConfirm }: Props) {
    return (
        <Dialog open={src !== null} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-base">Pratinjau</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center px-6 py-8">
                    {src && <img src={src} alt="Pratinjau foto" className="size-52 rounded-full object-cover" />}
                </div>
                <div className="flex items-center justify-between px-6 pb-6">
                    <button type="button" className="cursor-pointer text-sm text-[#0A84FF] hover:underline" onClick={onChangePhoto}>
                        Ubah Foto
                    </button>
                    <Button type="button" className="w-40 rounded-full" onClick={onConfirm}>
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
