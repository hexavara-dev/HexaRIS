import { DataTable, type Column, type FilterConfig, type SearchConfig } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, CalendarCheck, ChevronRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { type LeaveQuota, leaveQuotas } from './leave-quota-data';

const dialogShadow = 'shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]';

const columns: Column<LeaveQuota>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nama Karyawan' },
    { key: 'granted', label: 'Cuti Didapat' },
    { key: 'used', label: 'Cuti Terpakai' },
    { key: 'remaining', label: 'Cuti Tersisa' },
];

const search: SearchConfig = {
    keys: ['id', 'name'],
    placeholder: 'Search',
};

const filters: FilterConfig[] = [
    {
        key: 'branch',
        type: 'select',
        label: 'Cabang',
        options: [
            { value: 'Jakarta', label: 'Cabang: Jakarta' },
            { value: 'Surabaya', label: 'Cabang: Surabaya' },
            { value: 'Bandung', label: 'Cabang: Bandung' },
        ],
    },
];

const policies = [
    {
        title: 'Cuti Tahunan',
        items: [
            '12 hari kerja per tahun.',
            'Berlaku setelah minimal 12 bulan masa kerja berturut-turut.',
            'Pemberitahuan minimal 3-7 hari kerja sebelumnya.',
            'Memerlukan persetujuan tertulis dari atasan langsung.',
            'Sisa cuti tidak dapat diakumulasi ke tahun berikutnya.',
        ],
    },
    {
        title: 'Cuti Sakit',
        items: [
            'Diizinkan jika karyawan tidak mampu bekerja karena sakit.',
            'Surat keterangan dokter wajib dilampirkan jika lebih dari 1 hari.',
            'Prosedur klaim mengikuti peraturan internal perusahaan.',
        ],
    },
];

function StatCard({ label, value, change, positive }: { label: string; value: number; change: string; positive: boolean }) {
    const Trend = positive ? ArrowUp : ArrowDown;
    return (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-sm text-[#374151]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6B7280]">
                <Trend className={cn('size-3', positive ? 'text-[#16B89A]' : 'text-[#F47786]')} />
                <span className={positive ? 'text-[#16B89A]' : 'text-[#F47786]'}>{change}</span>
            </p>
        </div>
    );
}

function LeaveQuotaPolicyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('font-poppins gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-xl', dialogShadow)}>
                <DialogHeader className="flex-row items-start justify-between border-b border-[#E7E7E7] px-6 py-4 pr-12 text-left">
                    <div className="space-y-1">
                        <DialogTitle className="text-base font-semibold text-[#111827]">Kebijakan Cuti</DialogTitle>
                        <p className="text-xs text-[#6B7280]">Informasi hak dan kewajiban cuti karyawan</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Ubah kebijakan cuti">
                        <Pencil className="size-4 text-[#6B7280]" />
                    </Button>
                </DialogHeader>

                <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-6 py-5">
                    {policies.map((policy) => (
                        <section key={policy.title} className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-[#111827]">{policy.title}</h3>
                            <ul className="flex flex-col gap-2">
                                {policy.items.map((item) => (
                                    <li key={item} className="flex gap-2 text-sm text-[#374151]">
                                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1980C0]" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function LeaveQuotaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [policyOpen, setPolicyOpen] = useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn('font-poppins gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-2xl', dialogShadow)}>
                    <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">
                        <DialogTitle className="text-base font-semibold text-[#111827]">Cuti</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 px-6 py-5">
                        <button
                            type="button"
                            onClick={() => setPolicyOpen(true)}
                            className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F3F7FB] p-4 text-left hover:bg-[#EAF2FA]"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8F3FB]">
                                <CalendarCheck className="size-5 text-[#1980C0]" />
                            </span>
                            <span className="flex-1">
                                <span className="block text-sm font-semibold text-[#111827]">Ketentuan Cuti</span>
                                <span className="block text-xs text-[#6B7280]">Klik untuk lihat Ketentuan Selengkapnya</span>
                            </span>
                            <ChevronRight className="size-4 text-[#6B7280]" />
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <StatCard label="Total Cuti" value={487} change="12% dari bulan lalu" positive />
                            <StatCard label="Total Sedang Cuti" value={12} change="8% dari bulan lalu" positive={false} />
                        </div>

                        <DataTable
                            columns={columns}
                            data={leaveQuotas}
                            search={search}
                            filters={filters}
                            filtersFirst
                            initialFilters={{ branch: 'Jakarta' }}
                            perPage={10}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <LeaveQuotaPolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} />
        </>
    );
}
