export type AttendanceStatus = 'On Time' | 'Terlambat' | 'Cuti' | 'Izin' | 'Alpha';

export interface AttendanceRow {
    id: string;
    employeeId: string;
    name: string;
    position?: string;
    organization: string;
    branch: string;
    date: string;
    shift: string;
    checkIn: string;
    checkOut: string;
    totalHours: string;
    location: string;
    status: AttendanceStatus;
}
