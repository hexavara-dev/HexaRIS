import { ArrowRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
interface PerubahanDetail {
    label: string;
    value: string;
}

export function PerubahanCard({
    pengajuan,
    details = [],
    showChangeType = false,
}: {
    pengajuan: PengajuanPerubahan;
    details?: PerubahanDetail[];
    showChangeType?: boolean;
}) {
    return (
        <div className="rounded-xl border border-[#E7E7E7] bg-white px-5 py-4">
            <div className="flex flex-col gap-4 border-b border-[#E7E7E7] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="size-11">
                        <AvatarImage src={pengajuan.avatarUrl} alt={pengajuan.name} />

                        <AvatarFallback className="bg-[#0B659E] text-sm font-medium text-white">{initials(pengajuan.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-col">
                        <p className="truncate text-base font-semibold text-[#121212]">{pengajuan.name}</p>
                        <p className="text-sm text-[#6B7280]">{pengajuan.role}</p>
                    </div>
                </div>

                {showChangeType && (
                    <div className="flex min-w-0 flex-col text-xs text-[#667085] sm:items-center">
                        <span>Pengajuan</span>
                        <span className="max-w-44 text-[#121212] sm:text-center">{pengajuan.changes}</span>
                    </div>
                )}

                <div className="flex flex-col sm:items-end">
                    <p className="text-xs text-[#6B7280]">Tgl Pengajuan</p>
                    <p className="text-sm text-[#121212]">{pengajuan.submittedAt}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-5 pt-4 sm:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] sm:items-center">
                {/* Data Sebelumnya */}
                <div className="flex flex-col gap-1.5">
                    <p className="mb-0.5 text-sm font-semibold text-[#121212]">Data Sebelumnya</p>

                    {pengajuan.fields.map((field) => (
                        <p key={field.label} className="text-sm leading-6 text-[#374151]">
                            {field.label} : {field.before}
                        </p>
                    ))}
                </div>

                <span className="flex size-9 items-center justify-center justify-self-center rounded-full bg-[#F3F4F6] text-[#374151]">
                    <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
                </span>

                {/* Data Yang Diubah */}
                <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="mb-0.5 text-sm font-semibold text-[#121212]">Data Yang Diubah</p>
                    {pengajuan.fields.map((field) => (
                        <p key={field.label} className="text-sm leading-6 break-words text-[#374151]">
                            {field.label} : {field.after}
                        </p>
                    ))}
                </div>
            </div>

            {details.length > 0 && (
                <dl className="mt-4 grid grid-cols-1 border-t border-[#E7E7E7] pt-4 sm:grid-cols-2 sm:divide-x sm:divide-[#E7E7E7]">
                    {details.map((detail) => (
                        <div
                            key={detail.label}
                            className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0"
                        >
                            <dt className="text-xs font-medium text-[#6B7280]">{detail.label}</dt>
                            <dd className="text-sm leading-6 break-words text-[#121212]">{detail.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
