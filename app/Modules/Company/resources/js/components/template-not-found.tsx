import { Link } from '@inertiajs/react';
import { FileX } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Templates are resolved from localStorage by the id in the URL, so a stale link,
 * a deleted template, or a different browser all land here — the server can't
 * 404 on something it doesn't store.
 */
export function TemplateNotFound() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                <FileX className="size-6" />
            </span>
            <div className="flex max-w-sm flex-col items-center gap-1 text-center">
                <p className="font-poppins text-base font-semibold text-black">Template Tidak Ditemukan</p>
                <p className="text-sm text-[#64748B]">Template ini mungkin sudah dihapus atau tautannya sudah tidak berlaku.</p>
            </div>
            <Button asChild variant="outline" className="rounded-lg border-[#1980C0] text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]">
                <Link href={route('company.document.index')}>Kembali ke Dokumen Center</Link>
            </Button>
        </div>
    );
}
