import { useState } from 'react';

import { DialogApproval } from '@/components/design-system/pop-up/dialog-approval';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface ApprovalCategoryCount {
    label: string;
    value: number;
    color: string;
}

export interface ApprovalRequest {
    name: string;
    avatarUrl?: string;
    description: string;
    type: string;
}

interface ApprovalRequestListProps {
    title: string;
    counts: ApprovalCategoryCount[];
    viewAllLabel: string;
    viewAllCount: number;
    requests: ApprovalRequest[];
}

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function ApprovalRequestList({ title, counts, viewAllLabel, viewAllCount, requests }: ApprovalRequestListProps) {
    const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
    const [decision, setDecision] = useState<'reject' | 'accept' | undefined>(undefined);

    function openApproval(request: ApprovalRequest) {
        setActiveRequest(request);
        setDecision(undefined);
    }

    function closeApproval() {
        setActiveRequest(null);
        setDecision(undefined);
    }

    return (
        <div className="flex w-full flex-col items-start gap-2 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex w-full items-center justify-between border-b border-b-[#E2E8F0] pb-4">
                <div className="flex flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-base font-semibold text-[#0F172A]">{title}</p>
                    <div className="flex items-center gap-3 py-1">
                        {counts.map((count, index) => (
                            <span key={count.label} className="flex items-center gap-3">
                                {index > 0 && <span className="h-[11px] w-px bg-[#E7E7E7]" />}
                                <span className="text-[13px] leading-[1.4em] font-bold" style={{ color: count.color }}>
                                    {count.label}: {count.value}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <p className="w-fit text-xs font-medium text-[#0D9488]">
                    {viewAllLabel} ({viewAllCount}) →
                </p>
            </div>

            <div className="flex w-full flex-col items-start">
                {requests.map((request, index) => (
                    <div
                        key={request.name}
                        className={`flex w-full items-center gap-3 py-3 ${index < requests.length - 1 ? 'border-b border-b-[#E2E8F0]' : ''}`}
                    >
                        <Avatar className="size-8 shrink-0">
                            <AvatarImage src={request.avatarUrl} alt={request.name} />
                            <AvatarFallback className="text-xs">{initials(request.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex w-full flex-col items-start gap-0.5">
                            <p className="w-full text-sm font-medium text-[#0F172A]">{request.name}</p>
                            <p className="w-full text-xs text-[#475569]">{request.description}</p>
                        </div>
                        <Button size="sm" className="h-auto w-fit shrink-0 rounded-lg px-3 py-1.5 text-xs" onClick={() => openApproval(request)}>
                            Approve
                        </Button>
                    </div>
                ))}
            </div>

            <DialogApproval
                open={activeRequest !== null}
                onOpenChange={(open) => !open && closeApproval()}
                title="Approve Pengajuan"
                details={
                    activeRequest
                        ? [
                              { label: 'Nama', value: activeRequest.name },
                              { label: 'Jenis', value: activeRequest.type },
                              { label: 'Keterangan', value: activeRequest.description },
                          ]
                        : []
                }
                decision={decision}
                onDecisionChange={setDecision}
                onSave={closeApproval}
            />
        </div>
    );
}

export function ApprovalRequestListDemo() {
    return (
        <ApprovalRequestList
            title="Pengajuan Menunggu Approval"
            counts={[
                { label: 'Cuti', value: 20, color: '#1E3A8A' },
                { label: 'Izin', value: 30, color: '#065F46' },
                { label: 'Lembur', value: 5, color: '#92400E' },
            ]}
            viewAllLabel="Lihat Semua"
            viewAllCount={8}
            requests={[
                { name: 'Aditya Wijaya', description: 'Cuti Sakit • Hari ini, 08:30', type: 'Cuti Sakit' },
                { name: 'Dewi Lestari', description: 'Lembur • Kemarin, 19:40', type: 'Lembur' },
                { name: 'Rian Setiawan', description: 'Cuti Tahunan • 24 Okt, 14:15', type: 'Cuti Tahunan' },
            ]}
        />
    );
}
