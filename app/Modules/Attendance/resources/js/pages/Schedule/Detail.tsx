import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useState } from 'react';
import { PREVIEW_LIMIT, EMPLOYEE_SCHEDULES, getDaySchedules, initials } from './schedule-data';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Shift & Jadwal', href: '/attendance/schedule' },
    { title: 'Detail Jadwal', href: '#' },
];

interface Props {
    date: string; // YYYY-MM-DD, from the query string
}

export default function Detail({ date }: Props) {
    const [expanded, setExpanded] = useState<number[]>([]); // jadwal showing the full roster
    const selected = new Date(`${date}T00:00:00`);
    const shifts = getDaySchedules(EMPLOYEE_SCHEDULES, date);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-2xl space-y-4 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.get('/attendance/schedule')}>
                        <ChevronLeft />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {selected.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h1>
                        <p className="text-sm text-muted-foreground">Jadwal shift karyawan</p>
                    </div>
                </div>

                <Accordion type="single" collapsible defaultValue={String(shifts[0].jadwal.id)} className="space-y-3">
                    {shifts.map(({ jadwal, employees }) => (
                        <AccordionItem key={jadwal.id} value={String(jadwal.id)} className="overflow-hidden rounded-xl border data-[state=open]:border-green-500">
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
                                            setExpanded((prev) => (prev.includes(jadwal.id) ? prev.filter((id) => id !== jadwal.id) : [...prev, jadwal.id]))
                                        }
                                        className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-600"
                                    >
                                        {expanded.includes(jadwal.id) ? 'Tampilkan lebih sedikit' : `Lihat semua karyawan (${employees.length})`}
                                        <ChevronRight className={`size-4 transition-transform ${expanded.includes(jadwal.id) ? '-rotate-90' : ''}`} />
                                    </button>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </AppLayout>
    );
}
