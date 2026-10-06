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
            <div className="flex min-w-0 items-start font-poppins text-sm">
                <span className="w-40 shrink-0 text-[#6B6B6B]">{label}</span>
                <span className="mr-2 text-[#6B6B6B]">:</span>
                <span className="truncate font-medium text-[#121212]">{uploaded ? uploaded.name : '—'}</span>
            </div>
            {uploaded ? (
                <>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-label={`Lihat ${uploaded.name}`}
                        className="shrink-0 cursor-pointer text-[#4F4F4F] hover:text-[#1980C0]"
                    >
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