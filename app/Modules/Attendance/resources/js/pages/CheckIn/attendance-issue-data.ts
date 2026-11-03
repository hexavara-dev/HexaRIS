export interface AttendanceIssue {
    id: string;
    employeeId: string;
    name: string;
    position: string;
    organization: string;
    reportedAt: string;
    shift: string;
    location: string;
    checkIn: string;
    checkOut: string;
    totalHours: string;
    attachments: string[];
    reason: string;
}

export const attendanceIssues: AttendanceIssue[] = [
    { id: 'issue-1', employeeId: 'EM187', name: 'Saskya Ayu', position: 'Staff Videographer', organization: 'Creatif', reportedAt: '16/02/2025 07:00', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.00', checkOut: '17.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-2', employeeId: 'EM188', name: 'Rizky Pratama', position: 'Operator Produksi', organization: 'Produksi', reportedAt: '16/02/2025 07:05', shift: '08.00 - 16.00', location: 'PT Indojaya', checkIn: '07.55', checkOut: '16.00', totalHours: '8jam 5mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-3', employeeId: 'EM189', name: 'Nadia Salsabila', position: 'Staff Finance', organization: 'Finance', reportedAt: '16/02/2025 07:10', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.18', checkOut: '17.00', totalHours: '7jam 42mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-4', employeeId: 'EM190', name: 'Bagus Setiawan', position: 'Software Engineer', organization: 'IT', reportedAt: '16/02/2025 07:12', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.12', checkOut: '17.00', totalHours: '7jam 48mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-5', employeeId: 'EM191', name: 'Dinda Kirana', position: 'HR Specialist', organization: 'HR', reportedAt: '16/02/2025 07:20', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.00', checkOut: '17.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-6', employeeId: 'EM192', name: 'Fajar Nugroho', position: 'Marketing Executive', organization: 'Marketing', reportedAt: '16/02/2025 07:25', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.00', checkOut: '17.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-7', employeeId: 'EM193', name: 'Intan Permata', position: 'Art Director', organization: 'Creatif', reportedAt: '16/02/2025 07:30', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.00', checkOut: '17.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-8', employeeId: 'EM194', name: 'Yusuf Maulana', position: 'Supervisor Produksi', organization: 'Produksi', reportedAt: '16/02/2025 07:35', shift: '08.00 - 16.00', location: 'PT Indojaya', checkIn: '08.00', checkOut: '16.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-9', employeeId: 'EM195', name: 'Melati Kusuma', position: 'Accounting Staff', organization: 'Finance', reportedAt: '16/02/2025 07:40', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.00', checkOut: '17.00', totalHours: '8jam 0mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
    { id: 'issue-10', employeeId: 'EM196', name: 'Reza Fauzan', position: 'QA Engineer', organization: 'IT', reportedAt: '16/02/2025 07:45', shift: '09.00 - 17.00', location: 'PT Indojaya', checkIn: '09.07', checkOut: '17.00', totalHours: '7jam 53mnt', attachments: ['Photo1.jpg', 'Photo2.jpg'], reason: 'Error waktu absensi' },
];
