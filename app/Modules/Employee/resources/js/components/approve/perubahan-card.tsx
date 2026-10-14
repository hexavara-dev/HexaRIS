
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { PengajuanPerubahan } from '../../pages/Data/pengajuan-dummy';

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

interface PerubahanDetail {
    label: string;
    value: string;
}

interface PerubahanCardProps {
    pengajuan: PengajuanPerubahan;
    details?: PerubahanDetail[];
    showChangeType?: boolean;
}

export function PerubahanCard({ pengajuan, details = [], showChangeType = false }: PerubahanCardProps) {
    return (
        <div className="rounded-2xl border border-[#E7E7E7] bg-white p-4 sm:p-5">
            {/* Employee Information */}
            <div className="flex flex-col gap-4 rounded-xl border border-[#E7E7E7] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-11 shrink-0">
                        <AvatarImage src={pengajuan.avatarUrl} alt={pengajuan.name} />
                        <AvatarFallback className="bg-[#0B659E] text-sm font-medium text-white">
                            {initials(pengajuan.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-sm font-semibold text-[#121212]">{pengajuan.name}</p>
                        <p className="text-xs text-[#6B7280]">{pengajuan.role}</p>
                    </div>
                </div>

                {showChangeType && (
                    <div className="flex min-w-0 flex-col text-xs text-[#667085]">
                        <span>Pengajuan</span>
                        <span className="max-w-44 break-words text-[#121212]">{pengajuan.changes}</span>
                    </div>
                )}

                <div className="flex shrink-0 flex-col sm:items-end">
                    <p className="text-xs text-[#9CA3AF]">Tgl Pengajuan</p>
                    <p className="text-sm font-medium text-[#374151]">{pengajuan.submittedAt}</p>
                </div>
            </div>

            {/* Before / After Comparison */}
            <div className="mt-5 grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)]">
                {/* Data Sebelumnya */}
                <div className="h-full min-w-0 rounded-xl bg-[#F8F9FB] p-4">
                    <h3 className="mb-4 text-sm font-semibold text-[#121212]">Data Sebelumnya</h3>

                    <dl className="flex flex-col gap-3">
                        {pengajuan.fields.map((field, index) => (
                            <div key={`${field.label}-${index}`} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                                <dt className="min-w-0 flex-1 text-[#6B7280]">{field.label}</dt>
                                <dd className="min-w-0 flex-1 break-words text-right font-medium text-[#374151]">{field.before}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#374151]">
                        <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
                    </span>
                </div>

                {/* Data Yang Diubah */}
                <div className="h-full min-w-0 rounded-xl bg-[#F8F9FB] p-4">
                    <h3 className="mb-4 text-sm font-semibold text-[#121212]">Data Yang Diubah</h3>

                    <dl className="flex flex-col gap-3">
                        {pengajuan.fields.map((field, index) => (
                            <div key={`${field.label}-${index}`} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                                <dt className="min-w-0 flex-1 text-[#6B7280]">{field.label}</dt>
                                <dd className="min-w-0 flex-1 break-words text-right font-medium text-[#374151]">{field.after}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            {/* Additional Details */}
            {details.length > 0 && (
                <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-[#E7E7E7] pt-4 sm:grid-cols-2">
                    {details.map((detail) => (
                        <div key={detail.label} className="flex min-w-0 flex-col gap-1">
                            <dt className="text-xs font-medium text-[#6B7280]">{detail.label}</dt>
                            <dd className="break-words text-sm leading-6 text-[#121212]">{detail.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
