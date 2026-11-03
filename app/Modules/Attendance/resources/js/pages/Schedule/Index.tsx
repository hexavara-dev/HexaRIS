import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CalendarDays, ChevronLeft, ChevronRight, ListFilter, Plus, Search, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { AssignScheduleDialog } from './assign-schedule-dialog';
import { EMPLOYEES, JADWAL, PREVIEW_LIMIT, EMPLOYEE_SCHEDULES, avatarTone, bulkCreateSchedule, getAssignmentRange, getDaySchedules, getWeekRoster, initials, removeAssignment, toIsoDate } from './schedule-data';
import { EditAssignScheduleDialog } from './edit-assign-schedule-dialog';
import { SettingScheduleDialog } from './setting-schedule-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Shift & Jadwal', href: '/attendance/schedule' }];

const DAY = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Index() {
    const [cursor, setCursor] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [assignments, setAssignments] = useState(EMPLOYEE_SCHEDULES);
    const [selected, setSelected] = useState<Date | null>(null);
    const [expanded, setExpanded] = useState<number[]>([]); // jadwal showing the full roster
    const [assignOpen, setAssignOpen] = useState(false);
    const [editing, setEditing] = useState<{ employeeId: number; scheduleId: number; start: Date; end: Date } | null>(null);
    const [settingOpen, setSettingOpen] = useState(false);
    const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    });
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Senin = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekCount = Math.ceil((offset + daysInMonth) / 7);
    // Date(year, month, 1 - offset + i) rolls over into the previous/next month by itself.
    const weeks = Array.from({ length: weekCount }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => new Date(year, month, 1 - offset + w * 7 + d)),
    );

    const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
    const weekEnd = weekDays[6];
    const weekFrom =
        weekStart.getMonth() === weekEnd.getMonth() ? `${weekStart.getDate()}` : weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
    const weekLabel = `${weekFrom} – ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const roster = getWeekRoster(assignments, weekDays);
    const todayIso = toIsoDate(new Date());

    const label = view === 'monthly' ? cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : weekLabel;
    const shift = (n: number) => {
        if (view === 'monthly') {
            setCursor(new Date(year, month + n, 1));
            return;
        }
        setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + n * 7));
    };
    const selectedShifts = selected ? getDaySchedules(assignments, toIsoDate(selected)).filter(({ employees }) => employees.length > 0) : [];

    const openEdit = (employeeId: number, scheduleId: number, date: Date) =>
        setEditing({ employeeId, scheduleId, ...getAssignmentRange(assignments, employeeId, scheduleId, date) });
    const saveEdit = (scheduleId: number, start: Date, end: Date) => {
        if (!editing) return;
        setAssignments((prev) => [
            ...removeAssignment(prev, editing.employeeId, editing.scheduleId, editing.start, editing.end),
            ...bulkCreateSchedule([editing.employeeId], scheduleId, start, end),
        ]);
        setEditing(null);
    };
    const deleteEdit = () => {
        if (!editing) return;
        setAssignments((prev) => removeAssignment(prev, editing.employeeId, editing.scheduleId, editing.start, editing.end));
        setEditing(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="text" placeholder="Search" className="pl-9" />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5 border-sky-400 text-sky-500 cursor-pointer" onClick={() => setSettingOpen(true)}>
                            <Settings className="size-3.5" /> Setting Jam Kerja
                        </Button>
                        <Button size="sm" variant="default" className="gap-1.5 cursor-pointer" onClick={() => setAssignOpen(true)}>
                            <Plus className="size-3.5" /> Assign Jadwal
                        </Button>
                    </div>
                </div>

                <Card className="gap-0 overflow-hidden p-0 m-0 rounded-3xl">
                    <Tabs value={view} onValueChange={(v) => setView(v as 'monthly' | 'weekly')}>
                        <div className="relative flex items-center justify-center p-3">
                            <div className="absolute left-3 flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => shift(-1)}>
                                    <ChevronLeft />
                                </Button>
                                <h3 className="min-w-28 text-center text-sm font-medium capitalize">{label}</h3>
                                <Button variant="outline" size="icon" onClick={() => shift(1)}>
                                    <ChevronRight />
                                </Button>
                                <Button variant="outline" size="icon">
                                    <ListFilter />
                                </Button>
                            </div>
                            <TabsList variant="button" className="h-auto gap-1 rounded-full border border-[#D6E6F5] bg-[#F3F8FE] p-1">
                                <TabsTrigger
                                    value="monthly"
                                    variant="button"
                                    className="gap-2 rounded-full px-8 py-2 data-[state=active]:bg-[#41B0F2] data-[state=active]:text-white data-[state=active]:shadow-none"
                                >
                                    <CalendarDays className="size-4" /> Perbulan
                                </TabsTrigger>
                                <TabsTrigger
                                    value="weekly"
                                    variant="button"
                                    className="gap-2 rounded-full px-8 py-2 data-[state=active]:bg-[#41B0F2] data-[state=active]:text-white data-[state=active]:shadow-none"
                                >
                                    <Users className="size-4" /> Mingguan
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="monthly">
                            <table className="w-full table-fixed border-collapse">
                                <thead>
                                    <tr>
                                        {DAY.map((d) => (
                                            <th key={d} className="border bg-[#F3F8FE] p-3 text-sm font-medium text-primary">
                                                {d}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {weeks.map((row, w) => (
                                        <tr key={w}>
                                            {row.map((date) => {
                                                const isSelected = selected?.getTime() === date.getTime();
                                                const dayShifts = getDaySchedules(assignments, toIsoDate(date)).filter(({ employees }) => employees.length > 0);
                                                return (
                                                    <td key={date.getTime()} className="border p-1 align-top text-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelected(date)}
                                                            className={`block w-full cursor-pointer space-y-1 rounded-xl border-2 p-1 text-left transition-colors ${
                                                                isSelected
                                                                    ? 'border-[#0A84FF] bg-[#EEF9FC]'
                                                                    : `border-transparent hover:bg-muted/50 ${date.getMonth() === month ? '' : 'text-muted-foreground/50'}`
                                                            }`}
                                                        >
                                                            <span
                                                                className={`flex size-8 items-center justify-center rounded-full font-medium ${isSelected ? 'bg-[#0A84FF] text-white' : ''}`}
                                                            >
                                                                {date.getDate()}
                                                            </span>
                                                            {dayShifts.map(({ jadwal, employees }) => (
                                                                <span
                                                                    key={jadwal.id}
                                                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                                                                    style={{ backgroundColor: `${jadwal.color}1A`, color: jadwal.color }}
                                                                >
                                                                    {jadwal.title} · {employees.length}
                                                                </span>
                                                            ))}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TabsContent>
                        <TabsContent value="weekly">
                            <div className="max-h-[520px] overflow-auto">
                                <table className="w-full min-w-[960px] table-fixed border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="w-52 border bg-white p-3 text-left text-sm font-medium text-primary">Nama Karyawan</th>
                                            {weekDays.map((date, i) => (
                                                <th
                                                    key={toIsoDate(date)}
                                                    className={`border p-3 text-sm font-medium ${
                                                        toIsoDate(date) === todayIso
                                                            ? 'border-b-2 border-b-[#0A84FF] bg-[#EEF6FF] text-[#0A84FF]'
                                                            : 'bg-white text-primary'
                                                    }`}
                                                >
                                                    <div>{DAY[i]}</div>
                                                    <div className={`text-xs font-normal ${toIsoDate(date) === todayIso ? '' : 'text-muted-foreground'}`}>
                                                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roster.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">
                                                    Tidak ada jadwal di minggu ini
                                                </td>
                                            </tr>
                                        )}
                                        {roster.map(({ employee, days }) => (
                                            <tr key={employee.id}>
                                                <td className="border p-3 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-10">
                                                            <AvatarFallback className={`font-semibold ${avatarTone(employee.id)}`}>
                                                                {initials(employee.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-medium">{employee.name}</div>
                                                            <div className="text-xs text-muted-foreground">{employee.dept}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {days.map((dayJadwal, i) => (
                                                    <td key={i} className="border p-1 align-top">
                                                        {dayJadwal.length === 0 ? (
                                                            <span className="block py-3 text-center text-xs text-muted-foreground">Off</span>
                                                        ) : (
                                                            dayJadwal.map((jadwal) => (
                                                                <button
                                                                    key={jadwal.id}
                                                                    type="button"
                                                                    onClick={() => openEdit(employee.id, jadwal.id, weekDays[i])}
                                                                    className="mb-1 block w-full cursor-pointer rounded-lg border px-2 py-1.5 text-left text-xs"
                                                                    style={{ backgroundColor: `${jadwal.color}1A`, borderColor: `${jadwal.color}55`, color: jadwal.color }}
                                                                >
                                                                    <div className="font-medium">{jadwal.title}</div>
                                                                    <div>
                                                                        {jadwal.start} – {jadwal.end}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
                <div className="flex flex-wrap items-center gap-4 p-3 text-xs text-muted-foreground">
                    {JADWAL.map((j) => (
                        <span key={j.id} className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: j.color }} />
                            {j.title}
                        </span>
                    ))}
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                        Off
                    </span>
                </div>
            </div>

            <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selected?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </SheetTitle>
                        <SheetDescription>Jadwal shift karyawan</SheetDescription>
                    </SheetHeader>
                    <Accordion type="single" collapsible defaultValue={String(JADWAL[0].id)} className="mt-4 space-y-3 pb-4">
                        {selectedShifts.map(({ jadwal, employees }) => (
                            <AccordionItem
                                key={jadwal.id}
                                value={String(jadwal.id)}
                                className="overflow-hidden rounded-xl border data-[state=open]:border-green-500"
                            >
                                <AccordionTrigger className="px-3 py-3 hover:no-underline data-[state=open]:bg-linear-to-b data-[state=open]:from-green-100 data-[state=open]:to-green-50">
                                    <div className="text-left">
                                        <div className="text-sm font-semibold">{jadwal.title}</div>
                                        <div className="text-xs font-normal text-muted-foreground">
                                            {jadwal.start} – {jadwal.end}
                                        </div>
                                    </div>
                                    <span className="ml-auto mr-2 flex items-center gap-2 text-xs font-normal text-muted-foreground">
                                        <Users className="size-4" /> {employees.length} karyawan
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 border-t p-3">
                                    {(expanded.includes(jadwal.id) ? employees : employees.slice(0, PREVIEW_LIMIT)).map((p) => (
                                        <div key={p.id} className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{initials(p.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-sm font-medium">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.dept}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {employees.length > PREVIEW_LIMIT && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpanded((prev) =>
                                                    prev.includes(jadwal.id) ? prev.filter((id) => id !== jadwal.id) : [...prev, jadwal.id],
                                                )
                                            }
                                            className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-600"
                                        >
                                            {expanded.includes(jadwal.id) ? 'Tampilkan lebih sedikit' : `Lihat semua karyawan (${employees.length})`}
                                            <ChevronRight
                                                className={`size-4 transition-transform ${expanded.includes(jadwal.id) ? '-rotate-90' : ''}`}
                                            />
                                        </button>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </SheetContent>
            </Sheet>

            <SettingScheduleDialog open={settingOpen} onOpenChange={setSettingOpen} />
            <AssignScheduleDialog
                open={assignOpen}
                onOpenChange={setAssignOpen}
                employees={EMPLOYEES.map((e) => ({ value: String(e.id), label: e.name, description: e.dept }))}
                schedules={JADWAL.map((j) => ({ value: String(j.id), label: `${j.title} (${j.start} – ${j.end})` }))}
                onSave={(employeeIds, scheduleId, start, end) =>
                    setAssignments((prev) => [...prev, ...bulkCreateSchedule(employeeIds, scheduleId, start, end)])
                }
            />
            {editing && (
                <EditAssignScheduleDialog
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    employee={EMPLOYEES.find((e) => e.id === editing.employeeId)!}
                    schedules={JADWAL.map((j) => ({ value: String(j.id), label: `${j.title} (${j.start} – ${j.end})` }))}
                    initial={{ scheduleId: editing.scheduleId, start: editing.start, end: editing.end }}
                    onSave={saveEdit}
                    onDelete={deleteEdit}
                />
            )}
        </AppLayout>
    );
}
