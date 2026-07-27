import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export type ShiftType = 'pagi' | 'siang' | 'malam' | 'off';

const SHIFT_STYLES: Record<Exclude<ShiftType, 'off'>, { label: string; time: string; border: string; bg: string; text: string }> = {
    pagi: { label: 'Shift Pagi', time: '08:00 - 16:00', border: '#46B52B', bg: '#F4FFE9', text: '#46B52B' },
    siang: { label: 'Shift Siang', time: '16:00 - 00:00', border: '#B7A222', bg: '#FFFDE5', text: '#B7A222' },
    malam: { label: 'Shift Malam', time: '00:00 - 08:00', border: '#41B4F2', bg: '#D9FAFE', text: '#41B4F2' },
};

export interface DayColumn {
    label: string;
    date: string;
    isActive?: boolean;
}

export interface EmployeeSchedule {
    name: string;
    role: string;
    avatarUrl?: string;
    shifts: ShiftType[];
}

interface WeeklyShiftScheduleProps {
    weekLabel: string;
    dateRange: string;
    branches: string[];
    departments: string[];
    days: DayColumn[];
    employeeVariants: EmployeeSchedule[][];
    onPrevWeek?: () => void;
    onNextWeek?: () => void;
}

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function ShiftCell({ shift }: { shift: ShiftType }) {
    if (shift === 'off') {
        return (
            <button type="button" className="flex h-full w-full flex-col items-center justify-center p-2 text-nowrap">
                <p className="w-fit text-xs leading-[1.4em] text-[#9CA3AF]">Off</p>
            </button>
        );
    }

    const style = SHIFT_STYLES[shift];

    return (
        <div
            className="flex h-full w-full flex-col items-start gap-0.5 rounded-md border p-2"
            style={{ borderColor: style.border, backgroundColor: style.bg }}
        >
            <p className="w-fit text-[11px] font-bold" style={{ color: style.text }}>
                {style.label}
            </p>
            <p className="w-fit text-[10px]" style={{ color: style.text }}>
                {style.time}
            </p>
        </div>
    );
}

export function WeeklyShiftSchedule({
    weekLabel,
    dateRange,
    branches,
    departments,
    days,
    employeeVariants,
    onPrevWeek,
    onNextWeek,
}: WeeklyShiftScheduleProps) {
    const [activeDayIndex, setActiveDayIndex] = useState(() => {
        const initialActive = days.findIndex((day) => day.isActive);
        return initialActive === -1 ? 0 : initialActive;
    });
    const [selectedBranch, setSelectedBranch] = useState(branches[0]);
    const [selectedDepartment, setSelectedDepartment] = useState(departments[0]);
    const employees = employeeVariants[activeDayIndex] ?? employeeVariants[0];

    return (
        <div className="flex w-full flex-col items-start overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            {/* Toolbar: week navigation + filters */}
            <div className="flex w-full items-center justify-between border-b border-[#E2E8F0] p-5">
                <div className="flex w-fit items-center gap-3">
                    <button
                        type="button"
                        onClick={onPrevWeek}
                        className="flex w-fit items-center rounded-md border border-[#E2E8F0] p-1.5"
                        aria-label="Minggu sebelumnya"
                    >
                        <ChevronLeft className="size-4 text-[#6B7280]" />
                    </button>
                    <button
                        type="button"
                        onClick={onNextWeek}
                        className="flex w-fit items-center rounded-md border border-[#E2E8F0] p-1.5"
                        aria-label="Minggu berikutnya"
                    >
                        <ChevronRight className="size-4 text-[#6B7280]" />
                    </button>
                    <div className="flex w-fit flex-col items-start justify-center">
                        <p className="w-fit text-xs text-[#111827]">{weekLabel}</p>
                        <p className="font-poppins w-fit text-sm font-semibold text-[#111827]">{dateRange}</p>
                    </div>
                </div>

                <div className="flex w-fit items-start gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-full w-[175px] items-center justify-between rounded-lg border border-[#E7E7E7] px-3 py-2 outline-none">
                            <p className="w-fit text-xs text-black">Cabang: {selectedBranch}</p>
                            <ChevronDown className="size-4 shrink-0 text-[#4F4F4F]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {branches.map((branch) => (
                                <DropdownMenuItem key={branch} onSelect={() => setSelectedBranch(branch)}>
                                    {branch}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex w-[180px] items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2 outline-none">
                            <p className="line-clamp-1 w-fit overflow-hidden text-xs leading-[1.4em] text-ellipsis text-[#111827]">
                                {selectedDepartment}
                            </p>
                            <ChevronDown className="size-3.5 shrink-0 text-[#6B7280]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {departments.map((department) => (
                                <DropdownMenuItem key={department} onSelect={() => setSelectedDepartment(department)}>
                                    {department}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Day-of-week header */}
            <div className="grid h-[60px] w-full grid-cols-[220px_repeat(7,minmax(0,1fr))] items-center gap-2 border-b border-[#E2E8F0] px-2">
                <div className="flex flex-col items-start justify-center pl-3">
                    <p className="w-fit text-[11px] font-medium text-[#6B7280]">Nama Karyawan</p>
                </div>
                {days.map((day, index) => (
                    <button
                        type="button"
                        key={day.label}
                        onClick={() => setActiveDayIndex(index)}
                        className={`flex h-full w-full flex-col items-center justify-center gap-0.5 text-nowrap ${
                            index === activeDayIndex ? 'border-b-2 border-b-[#1066E0] bg-[#EFF6FF]' : ''
                        }`}
                    >
                        <p className={`w-fit text-[11px] ${index === activeDayIndex ? 'font-bold text-[#1066E0]' : 'font-medium text-[#6B7280]'}`}>
                            {day.label}
                        </p>
                        <p className={`w-fit text-[10px] ${index === activeDayIndex ? 'text-[#1066E0]' : 'text-[#9CA3AF]'}`}>{day.date}</p>
                    </button>
                ))}
            </div>

            {/* Employee rows */}
            {employees.map((employee) => (
                <div
                    key={employee.name}
                    className="grid h-20 w-full grid-cols-[220px_repeat(7,minmax(0,1fr))] items-stretch gap-2 border-b border-[#E2E8F0] px-2 py-2"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                            <AvatarFallback className="text-xs">{initials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col items-start gap-0.5">
                            <p className="w-full truncate text-sm font-semibold text-[#111827]">{employee.name}</p>
                            <p className="w-full truncate text-xs leading-[1.4em] text-[#6B7280]">{employee.role}</p>
                        </div>
                    </div>
                    {employee.shifts.map((shift, index) => (
                        <ShiftCell key={index} shift={shift} />
                    ))}
                </div>
            ))}

            {/* Legend */}
            <div className="flex w-full items-center gap-6 p-4">
                <div className="flex w-fit items-start gap-4">
                    {(Object.keys(SHIFT_STYLES) as Array<keyof typeof SHIFT_STYLES>).map((key) => (
                        <div key={key} className="flex w-fit items-center gap-1.5">
                            <div className="size-2 rounded-sm" style={{ backgroundColor: SHIFT_STYLES[key].text }} />
                            <p className="w-fit text-[11px] text-[#6B7280]">
                                {SHIFT_STYLES[key].label} ({SHIFT_STYLES[key].time})
                            </p>
                        </div>
                    ))}
                    <div className="flex w-fit items-center gap-1.5">
                        <div className="size-2 rounded-sm bg-[#9CA3AF]" />
                        <p className="w-fit text-[11px] text-[#6B7280]">Off</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function rotateShifts(shifts: ShiftType[], by: number): ShiftType[] {
    const length = shifts.length;
    const offset = ((by % length) + length) % length;
    return [...shifts.slice(offset), ...shifts.slice(0, offset)];
}

export function WeeklyShiftScheduleDemo() {
    const days: DayColumn[] = [
        { label: 'Sen', date: '16 Jun' },
        { label: 'Sel', date: '17 Jun' },
        { label: 'Rab', date: '18 Jun', isActive: true },
        { label: 'Kam', date: '19 Jun' },
        { label: 'Jum', date: '20 Jun' },
        { label: 'Sab', date: '21 Jun' },
        { label: 'Min', date: '22 Jun' },
    ];

    const baseEmployees: EmployeeSchedule[] = [
        { name: 'Rizky Pratama', role: 'Sales', shifts: ['pagi', 'pagi', 'pagi', 'siang', 'siang', 'off', 'off'] },
        { name: 'Dinda Putri', role: 'Product', shifts: ['pagi', 'pagi', 'siang', 'malam', 'malam', 'off', 'off'] },
        { name: 'Arif Hidayat', role: 'Marketing', shifts: ['pagi', 'pagi', 'pagi', 'off', 'siang', 'off', 'off'] },
        { name: 'Siti Aisyah', role: 'Customer Support', shifts: ['pagi', 'pagi', 'pagi', 'malam', 'malam', 'off', 'off'] },
        { name: 'Budi Santoso', role: 'Warehouse', shifts: ['pagi', 'pagi', 'pagi', 'malam', 'siang', 'off', 'off'] },
        { name: 'Fajar Nugroho', role: 'Sales', shifts: ['siang', 'siang', 'pagi', 'pagi', 'off', 'off', 'malam'] },
        { name: 'Nadia Ramadhani', role: 'Customer Support', shifts: ['pagi', 'off', 'pagi', 'siang', 'siang', 'malam', 'off'] },
    ];

    // Each day tab shows a distinct rotation of the shift data, so switching the active day
    // (Sen-Min) visibly changes what's displayed instead of only highlighting the column.
    const employeeVariants: EmployeeSchedule[][] = days.map((_, dayIndex) =>
        baseEmployees.map((employee) => ({ ...employee, shifts: rotateShifts(employee.shifts, dayIndex) })),
    );

    return (
        <WeeklyShiftSchedule
            weekLabel="Minggu ini"
            dateRange="16 - 22 Juni 2025"
            branches={['Jakarta', 'Surabaya', 'Bandung']}
            departments={['Semua Departemen', 'Sales', 'Marketing', 'Product', 'Customer Support', 'Warehouse']}
            days={days}
            employeeVariants={employeeVariants}
        />
    );
}
