import { Pencil, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
    onDelete?: () => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
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
    onDelete,
}: DepartmentDetailPanelProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-6 border-[#E2E8F0] p-6 shadow-[0_1px_4px_0_rgba(0,0,0,0.06),1px_7px_14px_-2px_rgba(0,0,0,0.12)] sm:max-w-[420px]"
            >
                {/* SheetContent already renders its own close (X) button — no second one here. */}
                <p className="font-poppins pr-8 text-base font-semibold text-black">{departmentName}</p>

                <div className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={headAvatarUrl} alt={headName} />
                        <AvatarFallback>{getInitials(headName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col items-start">
                        <p className="font-poppins truncate text-sm font-semibold text-black">{headName}</p>
                        <p className="truncate text-xs text-[#64748B]">{headRole}</p>
                    </div>
                </div>

                <div className="flex w-full justify-between">
                    <div className="flex flex-col items-start gap-1">
                        {positionStats.map((stat) => (
                            <p key={stat.label} className="text-xs text-[#64748B]">
                                {stat.label}
                            </p>
                        ))}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {positionStats.map((stat) => (
                            <p key={stat.label} className="text-xs text-black">
                                {stat.count} Staff
                            </p>
                        ))}
                    </div>
                </div>

                <div className="flex w-full items-start gap-2">
                    <Button
                        variant="outline"
                        className="w-full gap-2 rounded-lg border-[#1980C0] px-4 py-2 text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                        onClick={onEdit}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Departemen
                    </Button>
                    <Button
                        variant="outline"
                        className="w-fit shrink-0 rounded-lg border-[#E84A39] px-4 py-2 text-[#E84A39] hover:bg-[#E84A39]/10 hover:text-[#E84A39]"
                        onClick={onDelete}
                        aria-label="Hapus Departemen"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <Separator className="bg-[#E2E8F0]" />

                <div className="flex w-full flex-1 flex-col gap-4 overflow-y-auto">
                    <p className="font-poppins text-sm font-semibold text-black">Staff</p>
                    <div className="flex w-full flex-col items-start gap-3">
                        {staff.map((member) => (
                            <div key={member.id} className="flex w-full items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                    <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col items-start">
                                    <p className="font-poppins truncate text-sm font-semibold text-black">{member.name}</p>
                                    <p className="truncate text-xs text-[#64748B]">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
