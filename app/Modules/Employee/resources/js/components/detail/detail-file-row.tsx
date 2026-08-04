import { FilePreviewDialog, toUploadedFile, useFilePreviewUrl, type StoredFile } from '@/components/form/form-field';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useState } from 'react';

interface DetailFileRowProps {
    label: string;
    file: File | StoredFile | null;
}

/** Read-only counterpart to FileUploadField's "uploaded" state — eye button only, no delete, "Belum ada" badge when nothing was ever attached. */
export function DetailFileRow({ label, file }: DetailFileRowProps) {
    const [open, setOpen] = useState(false);
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);

    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <p className="font-poppins text-sm text-[#353535]">
                <span className="text-[#8F8F8F]">{label}</span> : {uploaded ? uploaded.name : '-'}
            </p>
            {uploaded ? (
                <>
                    <button type="button" onClick={() => setOpen(true)} aria-label={`Lihat ${uploaded.name}`} className="shrink-0 cursor-pointer text-[#4F4F4F]">
                        <Eye className="h-4 w-4" />
                    </button>
                    <FilePreviewDialog open={open} onOpenChange={setOpen} name={uploaded.name} type={file?.type ?? ''} previewUrl={previewUrl} />
                </>
            ) : (
                <Badge variant="secondary" className="shrink-0">
                    Belum ada
                </Badge>
            )}
        </div>
    );
}
