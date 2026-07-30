import nothingIllustration from '@/assets/nothing.png';

interface OrgStructureEmptyStateProps {
    title?: string;
    description?: string;
}

export function OrgStructureEmptyState({
    title = 'Belum Ada Struktur Organisasi',
    description = 'Atur sekarang struktur organisasi perusahaan Anda agar tim dan divisi dapat terorganisir dengan baik.',
}: OrgStructureEmptyStateProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-[#E2E8F0] bg-white py-24">
            <img src={nothingIllustration} alt="" className="h-40 w-auto" />
            <div className="flex max-w-sm flex-col items-center gap-1 text-center">
                <p className="font-poppins text-base font-semibold text-black">{title}</p>
                <p className="text-sm text-[#64748B]">{description}</p>
            </div>
        </div>
    );
}
