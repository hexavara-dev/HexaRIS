export type LeaveType = 'Cuti' | 'Izin';
export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface LeaveRequest {
    id: string;
    employeeId: string;
    name: string;
    organization: string;
    branch: string;
    requestedAt: string;
    type: LeaveType;
    period: string;
    days: number;
    reason: string;
    status: LeaveStatus;
}

export const leaveRequests: LeaveRequest[] = [
    { id: 'leave-1', employeeId: 'EM187', name: 'Saskya Ayu', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Menunggu' },
    { id: 'leave-2', employeeId: 'EM188', name: 'Rizky Pratama', organization: 'Produksi', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Izin', period: '4 Juni 2025', days: 1, reason: 'Acara Keluarga', status: 'Menunggu' },
    { id: 'leave-3', employeeId: 'EM189', name: 'Nadia Salsabila', organization: 'Finance', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Izin', period: '2 Juni 2025', days: 1, reason: 'Acara Keluarga', status: 'Disetujui' },
    { id: 'leave-4', employeeId: 'EM190', name: 'Bagus Setiawan', organization: 'IT', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Disetujui' },
    { id: 'leave-5', employeeId: 'EM191', name: 'Dinda Kirana', organization: 'HR', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Disetujui' },
    { id: 'leave-6', employeeId: 'EM192', name: 'Fajar Nugroho', organization: 'Marketing', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Izin', period: '2 Juni 2025', days: 1, reason: 'Acara Keluarga', status: 'Ditolak' },
    { id: 'leave-7', employeeId: 'EM193', name: 'Intan Permata', organization: 'Creatif', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Ditolak' },
    { id: 'leave-8', employeeId: 'EM194', name: 'Yusuf Maulana', organization: 'Produksi', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Izin', period: '4 Juni 2025', days: 1, reason: 'Acara Keluarga', status: 'Ditolak' },
    { id: 'leave-9', employeeId: 'EM195', name: 'Melati Kusuma', organization: 'Finance', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Ditolak' },
    { id: 'leave-10', employeeId: 'EM196', name: 'Reza Fauzan', organization: 'IT', branch: 'Jakarta', requestedAt: '12 Juni 2025', type: 'Cuti', period: '2 – 4 Juni 2025', days: 3, reason: 'Acara Keluarga', status: 'Ditolak' },
];
