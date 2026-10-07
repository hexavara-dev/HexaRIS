import { ArrowRight } from 'lucide-react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';

import type { PengajuanPerubahan } from '../../pages/Data/pengajuan-dummy';

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * The employee card + before/after comparison shared by the Detail and Tolak
 * dialogs — both show the same pengajuan, only the action underneath differs.
 */
export function PerubahanCard({
    pengajuan,
}: {
    pengajuan: PengajuanPerubahan;
}) {
    return (
        <div className="rounded-xl border border-[#E7E7E7] bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#E7E7E7] pb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                        <AvatarImage
                            src={pengajuan.avatarUrl}
                            alt={pengajuan.name}
                        />

                        <AvatarFallback className="bg-[#1980C0] text-sm font-medium text-white">
                            {initials(pengajuan.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <p className="text-base font-semibold text-[#121212]">
                            {pengajuan.name}
                        </p>

                        <p className="text-sm text-[#6B7280]">
                            {pengajuan.role}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <p className="text-sm text-[#6B7280]">
                        Tgl Pengajuan
                    </p>

                    <p className="text-sm text-[#121212]">
                        {pengajuan.submittedAt}
                    </p>
                </div>
            </div>

            <div className="relative grid grid-cols-2 gap-x-14 gap-y-1.5 pt-4">

                {/* Data Sebelumnya */}
                <div className="flex flex-col gap-1.5">
                    <p className="mb-0.5 text-base font-semibold text-[#121212]">
                        Data Sebelumnya
                    </p>

                    {pengajuan.fields.map((field) => (
                        <p
                            key={field.label}
                            className="text-sm text-[#374151]"
                        >
                            {field.label} : {field.before}
                        </p>
                    ))}
                </div>

                {/* Data Yang Diubah */}
                <div className="flex flex-col gap-1.5 pl-20">
                    <p className="mb-0.5 text-base font-semibold text-[#121212]">
                        Data Yang Diubah
                    </p>

                    {pengajuan.fields.map((field) => (
                        <p
                            key={field.label}
                            className="text-sm text-[#374151]"
                        >
                            {field.label} : {field.after}
                        </p>
                    ))}
                </div>

                {/* Arrow */}
                <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F3F4F6]">
                    <ArrowRight className="h-4 w-4 text-[#374151]" />
                </span>
            </div>
        </div>
    );
}