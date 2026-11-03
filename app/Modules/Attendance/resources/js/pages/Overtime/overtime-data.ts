export type OvertimeStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

// Estimated cost per overtime hour, in rupiah.
export const overtimeHourlyRate = 50000;

export interface OvertimeRequest {
    id: string;
    employeeId: string;
    name: string;
    organization: string;
    branch: string;
    requestedAt: string;
    startTime: string;
    endTime: string;
    hours: number;
    reason: string;
    cost: number;
    status: OvertimeStatus;
}

export const overtimeRequests: OvertimeRequest[] = [
    { id: 'ot-1', employeeId: 'EM187', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Menunggu' },
    { id: 'ot-2', employeeId: 'EM188', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Menunggu' },
    { id: 'ot-3', employeeId: 'EM189', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Ditolak' },
    { id: 'ot-4', employeeId: 'EM190', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Disetujui' },
    { id: 'ot-5', employeeId: 'EM191', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Disetujui' },
    { id: 'ot-6', employeeId: 'EM192', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Jan 2026', startTime: '22:00', endTime: '01:00', hours: 3, reason: 'Persiapan Meeting (Direksi)', cost: 3 * overtimeHourlyRate, status: 'Disetujui' },
];
