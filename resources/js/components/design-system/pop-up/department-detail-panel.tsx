import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Pencil, Plus } from 'lucide-react';

export interface DepartmentStaff {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface DepartmentPositionStat {
    label: string;
    count: number;
}

interface DepartmentDetailPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departmentName: string;
    headName: string;
    headRole: string;
    headAvatarUrl?: string;
    positionStats: DepartmentPositionStat[];
    staff: DepartmentStaff[];
    onEdit?: () => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function shortName(name: string) {
    return name.replace(/^Dept\.\s*/, '');
}

export function DepartmentDetailPanel({
    open,
    onOpenChange,
    departmentName,
    headName,
    headRole,
    headAvatarUrl,
    positionStats,
    staff,
    onEdit,
}: DepartmentDetailPanelProps) {
    const displayName = shortName(departmentName);
    const visibleStaff = staff.filter((member) => member.name !== headName);
    const staffCount = visibleStaff.length;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-[360px] max-w-[calc(100vw-1rem)] flex-col gap-0 border-[#E2E8F0] bg-white p-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)] sm:max-w-[360px]"
                aria-label="Detail organisasi"
            >
                <SheetHeader className="border-b border-[#F1F5F9] px-5 py-4 pr-12 text-left">
                    <SheetTitle className="font-poppins text-[15px] leading-5 font-semibold text-[#0F172A]">Detail Organisasi</SheetTitle>
                    <SheetDescription className="text-[12px] leading-4 text-[#64748B]">Informasi unit dan tim</SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                    <div className="rounded-xl border border-[#70B7EA] bg-[#F8FCFF] p-3">
                        <p className="font-poppins text-[14px] leading-5 font-semibold text-[#0F172A]">{displayName}</p>
                        <div className="mt-3 flex items-center gap-3">
                            <Avatar className="size-9">
                                <AvatarImage src={headAvatarUrl} alt={headName} />
                                <AvatarFallback className="text-[11px]">{getInitials(headName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="font-poppins truncate text-[13px] leading-5 font-semibold text-[#0F172A]">{headName || '-'}</p>
                                <p className="truncate text-[11px] leading-4 text-[#64748B]">{headRole || 'Kepala Bagian'}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="h-9 w-full gap-2 rounded-lg border-[#1980C0] bg-white text-[12px] font-medium text-[#1980C0] hover:bg-[#EAF6FF] hover:text-[#1980C0]"
                        onClick={onEdit}
                    >
                        <Pencil />
                        Edit Organisasi
                    </Button>

                    {positionStats.length > 0 && (
                        <div className="rounded-xl border border-[#E2E8F0] p-3">
                            <p className="font-poppins text-[12px] font-semibold text-[#0F172A]">Ringkasan Posisi</p>
                            <div className="mt-2 flex flex-col gap-1.5">
                                {positionStats.map((stat) => (
                                    <div key={stat.label} className="flex items-center justify-between gap-3 text-[11px] leading-4">
                                        <span className="min-w-0 truncate text-[#64748B]">{stat.label}</span>
                                        <span className="shrink-0 font-medium text-[#0F172A]">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <p className="font-poppins text-[13px] font-semibold text-[#0F172A]">Staff ({staffCount})</p>
                        <div className="flex flex-col gap-3">
                            {visibleStaff.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-[#CBD5E1] px-3 py-4 text-center text-[12px] text-[#94A3B8]">
                                    Belum ada staff.
                                </p>
                            ) : (
                                visibleStaff.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <Avatar className="size-8">
                                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                                            <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-poppins truncate text-[12px] leading-4 font-semibold text-[#0F172A]">{member.name}</p>
                                            <p className="truncate text-[11px] leading-4 text-[#64748B]">{member.role}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button type="button" className="mt-1 flex items-center gap-2 text-left text-[12px] font-medium text-[#1980C0]">
                            <Plus className="size-3.5" />
                            Tambah Karyawan
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
