/**
 * Jadwal (Master Data)
 *
 * Jadwal (title, time start/end, color indicator) ---< employee_schedules (e_id, schedule_id, date) BULK CREATE DEPENDS ON DATE START END RANGE >--- Employee
 */

export interface Employee {
    id: number;
    name: string;
    dept: string;
}

export interface Jadwal {
    id: number;
    title: string;
    start: string; // HH:mm
    end: string; // HH:mm
    color: string; // hex
}

export interface EmployeeSchedule {
    e_id: number;
    schedule_id: number;
    date: string; // YYYY-MM-DD
}

// Local-time YYYY-MM-DD, so the date does not shift by a day in UTC+7.
export const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// BULK CREATE: one row per employee for every day from start to end, inclusive.
export function bulkCreateSchedule(employeeIds: number[], scheduleId: number, start: Date, end: Date): EmployeeSchedule[] {
    const rows: EmployeeSchedule[] = [];
    for (let d = new Date(start); toIsoDate(d) <= toIsoDate(end); d.setDate(d.getDate() + 1)) {
        employeeIds.forEach((e_id) => rows.push({ e_id, schedule_id: scheduleId, date: toIsoDate(d) }));
    }
    return rows;
}

// Mock data until the schedule API exists.
export const EMPLOYEES: Employee[] = [
    { id: 1, name: 'Rizky Pratama', dept: 'Sales' },
    { id: 2, name: 'Dinda Putri', dept: 'Product' },
    { id: 3, name: 'Arif Hidayat', dept: 'Marketing' },
    { id: 4, name: 'Siti Aisyah', dept: 'Customer Support' },
    { id: 5, name: 'Budi Santoso', dept: 'Finance' },
    { id: 6, name: 'Maya Lestari', dept: 'HR' },
    { id: 7, name: 'Fajar Nugroho', dept: 'Engineering' },
    { id: 8, name: 'Intan Permata', dept: 'Operations' },
];

export const JADWAL: Jadwal[] = [
    { id: 1, title: 'Shift Pagi', start: '08:00', end: '16:00', color: '#22C55E' },
    { id: 2, title: 'Shift Siang', start: '16:00', end: '00:00', color: '#F59E0B' },
    { id: 3, title: 'Shift Malam', start: '00:00', end: '08:00', color: '#0EA5E9' },
];

// Seed the current month so the calendar opens with data.
const now = new Date();
const MONTH_START = new Date(now.getFullYear(), now.getMonth(), 1);
const MONTH_END = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// "Seterusnya" in the date picker. Mock data has no open-ended rows, so it runs to the end of next year.
export const FOREVER = 'forever' as const;
export const FOREVER_END = new Date(new Date().getFullYear() + 1, 11, 31);

// Five working days a week, shift rotating every week, weekends off.
const shiftFor = (employee: Employee, date: Date) => {
    const weekday = (date.getDay() + 6) % 7; // Senin = 0
    if (weekday >= 5) return null;
    const week = Math.floor((date.getDate() - 1 + ((MONTH_START.getDay() + 6) % 7)) / 7);
    return JADWAL[(employee.id + week) % JADWAL.length].id;
};

export const EMPLOYEE_SCHEDULES: EmployeeSchedule[] = EMPLOYEES.flatMap((employee) => {
    const rows: EmployeeSchedule[] = [];
    for (let d = new Date(MONTH_START); d <= MONTH_END; d.setDate(d.getDate() + 1)) {
        const scheduleId = shiftFor(employee, d);
        if (scheduleId !== null) rows.push({ e_id: employee.id, schedule_id: scheduleId, date: toIsoDate(d) });
    }
    return rows;
});

// Jadwal on one day, each with the employees the relation rows assign to it.
export const getDaySchedules = (rows: EmployeeSchedule[], iso: string) =>
    JADWAL.map((jadwal) => ({
        jadwal,
        employees: EMPLOYEES.filter((e) => rows.some((r) => r.e_id === e.id && r.schedule_id === jadwal.id && r.date === iso)),
    }));

// Weekly roster: only employees with at least one shift in the given days; each day lists its Jadwal (empty = Off).
export const getWeekRoster = (rows: EmployeeSchedule[], days: Date[]) => {
    const isos = days.map(toIsoDate);
    return EMPLOYEES.map((employee) => ({
        employee,
        days: isos.map((iso) => JADWAL.filter((jadwal) => rows.some((r) => r.e_id === employee.id && r.schedule_id === jadwal.id && r.date === iso))),
    })).filter((row) => row.days.some((jadwal) => jadwal.length > 0));
};

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// A block is the consecutive days one employee holds the same Jadwal; edit and delete work on the whole block.
export const getAssignmentRange = (rows: EmployeeSchedule[], employeeId: number, scheduleId: number, date: Date) => {
    const has = (d: Date) => rows.some((r) => r.e_id === employeeId && r.schedule_id === scheduleId && r.date === toIsoDate(d));
    let start = date;
    while (has(addDays(start, -1))) start = addDays(start, -1);
    let end = date;
    while (has(addDays(end, 1))) end = addDays(end, 1);
    return { start, end };
};

export const removeAssignment = (rows: EmployeeSchedule[], employeeId: number, scheduleId: number, start: Date, end: Date) => {
    const from = toIsoDate(start);
    const to = toIsoDate(end);
    return rows.filter((r) => !(r.e_id === employeeId && r.schedule_id === scheduleId && r.date >= from && r.date <= to));
};

export const PREVIEW_LIMIT = 3;

const AVATAR_TONES = ['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700'];

// Soft per-employee tint so the avatars do not all look like one placeholder.
export const avatarTone = (id: number) => AVATAR_TONES[id % AVATAR_TONES.length];

export const initials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2);
