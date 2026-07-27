import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';

export type ApprovalCategoryKey = 'cuti' | 'izin' | 'lembur';

export interface ApprovalCategoryCount {
    key: ApprovalCategoryKey;
    label: string;
    value: number;
    color: string;
}

export interface ApprovalRequest {
    name: string;
    avatarUrl?: string;
    description: string;
    type: string;
    category: ApprovalCategoryKey;
}

interface ApprovalRequestListProps {
    title: string;
    counts: ApprovalCategoryCount[];
    viewAllLabel: string;
    viewAllCount: number;
    requests: ApprovalRequest[];
    allRequests: ApprovalRequest[];
}

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function approveRequest() {
    toast.success('Pengajuan berhasil disetujui');
}

function ApprovalRow({ request, avatarSize = 'size-8' }: { request: ApprovalRequest; avatarSize?: string }) {
    return (
        <div className="flex w-full items-center gap-3 py-3">
            <Avatar className={`${avatarSize} shrink-0`}>
                <AvatarImage src={request.avatarUrl} alt={request.name} />
                <AvatarFallback className="text-xs">{initials(request.name)}</AvatarFallback>
            </Avatar>
            <div className="flex w-full flex-col items-start gap-0.5">
                <p className="w-full text-sm font-medium text-[#0F172A]">{request.name}</p>
                <p className="w-full text-xs text-[#475569]">{request.description}</p>
            </div>
            <Button size="sm" className="h-auto w-fit shrink-0 rounded-lg px-3 py-1.5 text-xs" onClick={approveRequest}>
                Approve
            </Button>
        </div>
    );
}

export function ApprovalRequestList({ title, counts, viewAllLabel, viewAllCount, requests, allRequests }: ApprovalRequestListProps) {
    const [viewAllOpen, setViewAllOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<ApprovalCategoryKey>(counts[0]?.key ?? 'cuti');

    const filteredRequests = allRequests.filter((request) => request.category === activeCategory);

    return (
        <div className="flex w-full flex-col items-start gap-2 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex w-full items-center justify-between border-b border-b-[#E2E8F0] pb-4">
                <div className="flex flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-base font-semibold text-[#0F172A]">{title}</p>
                    <div className="flex items-center gap-3 py-1">
                        {counts.map((count, index) => (
                            <span key={count.key} className="flex items-center gap-3">
                                {index > 0 && <span className="h-[11px] w-px bg-[#E7E7E7]" />}
                                <span className="text-[13px] leading-[1.4em] font-bold" style={{ color: count.color }}>
                                    {count.label}: {count.value}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <button type="button" className="w-fit text-xs font-medium text-[#0D9488]" onClick={() => setViewAllOpen(true)}>
                    {viewAllLabel} ({viewAllCount}) →
                </button>
            </div>

            <div className="flex w-full flex-col items-start">
                {requests.map((request, index) => (
                    <div key={request.name} className={index < requests.length - 1 ? 'w-full border-b border-b-[#E2E8F0]' : 'w-full'}>
                        <ApprovalRow request={request} />
                    </div>
                ))}
            </div>

            <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
                <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                    <DialogHeader className="border-b border-b-[#E7E7E7] px-6 py-4 text-left">
                        <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 px-6 pt-4 pb-2">
                        <ToggleGroup
                            type="single"
                            className="items-stretch justify-start gap-3"
                            value={activeCategory}
                            onValueChange={(value) => value && setActiveCategory(value as ApprovalCategoryKey)}
                        >
                            {counts.map((count) => (
                                <ToggleGroupItem
                                    key={count.key}
                                    value={count.key}
                                    className={`h-auto w-fit rounded-lg border px-6 py-2.5 text-sm font-medium ${
                                        activeCategory === count.key
                                            ? 'border-[#1980C0] bg-transparent text-[#1980C0] data-[state=on]:bg-transparent'
                                            : 'border-[#E2E8F0] bg-transparent text-[#6B7280] data-[state=off]:bg-transparent'
                                    }`}
                                >
                                    {count.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <div className="flex max-h-[60vh] w-full flex-col items-start overflow-y-auto px-6 pb-6">
                        {filteredRequests.map((request, index) => (
                            <div key={request.name} className={index < filteredRequests.length - 1 ? 'w-full border-b border-b-[#E2E8F0]' : 'w-full'}>
                                <ApprovalRow request={request} avatarSize="size-10" />
                            </div>
                        ))}
                        {filteredRequests.length === 0 && <p className="w-full py-6 text-center text-sm text-[#94A3B8]">Tidak ada pengajuan.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function avatarFor(seed: string) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

export function ApprovalRequestListDemo() {
    const allRequests: ApprovalRequest[] = [
        {
            name: 'Aditya Wijaya',
            avatarUrl: avatarFor('Aditya Wijaya'),
            description: 'Cuti Sakit • Hari ini, 08:30',
            type: 'Cuti Sakit',
            category: 'cuti',
        },
        { name: 'Dewi Lestari', avatarUrl: avatarFor('Dewi Lestari'), description: 'Lembur • Kemarin, 19:40', type: 'Lembur', category: 'lembur' },
        {
            name: 'Rian Setiawan',
            avatarUrl: avatarFor('Rian Setiawan'),
            description: 'Cuti Tahunan • 24 Okt, 14:15',
            type: 'Cuti Tahunan',
            category: 'cuti',
        },
        {
            name: 'Putri Ayu',
            avatarUrl: avatarFor('Putri Ayu'),
            description: 'Cuti Melahirkan • 20 Okt, 09:00',
            type: 'Cuti Melahirkan',
            category: 'cuti',
        },
        {
            name: 'Galih Prakoso',
            avatarUrl: avatarFor('Galih Prakoso'),
            description: 'Cuti Tahunan • 18 Okt, 11:30',
            type: 'Cuti Tahunan',
            category: 'cuti',
        },
        {
            name: 'Yusuf Maulana',
            avatarUrl: avatarFor('Yusuf Maulana'),
            description: 'Izin Sakit • Hari ini, 07:45',
            type: 'Izin Sakit',
            category: 'izin',
        },
        {
            name: 'Melati Sari',
            avatarUrl: avatarFor('Melati Sari'),
            description: 'Izin Keperluan Keluarga • Kemarin, 10:20',
            type: 'Izin Keperluan Keluarga',
            category: 'izin',
        },
        {
            name: 'Hendra Gunawan',
            avatarUrl: avatarFor('Hendra Gunawan'),
            description: 'Izin Terlambat • Hari ini, 08:10',
            type: 'Izin Terlambat',
            category: 'izin',
        },
        { name: 'Sri Wahyuni', avatarUrl: avatarFor('Sri Wahyuni'), description: 'Izin Sakit • 22 Okt, 09:15', type: 'Izin Sakit', category: 'izin' },
        { name: 'Bagas Saputra', avatarUrl: avatarFor('Bagas Saputra'), description: 'Lembur • 23 Okt, 20:15', type: 'Lembur', category: 'lembur' },
    ];

    return (
        <ApprovalRequestList
            title="Pengajuan Menunggu Approval"
            counts={[
                { key: 'cuti', label: 'Cuti', value: 20, color: '#1E3A8A' },
                { key: 'izin', label: 'Izin', value: 30, color: '#065F46' },
                { key: 'lembur', label: 'Lembur', value: 5, color: '#92400E' },
            ]}
            viewAllLabel="Lihat Semua"
            viewAllCount={8}
            requests={allRequests.slice(0, 3)}
            allRequests={allRequests}
        />
    );
}
