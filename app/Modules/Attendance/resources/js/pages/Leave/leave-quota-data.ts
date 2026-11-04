export type LeaveQuota = {
    id: string;
    name: string;
    branch: string;
    granted: number;
    used: number;
    remaining: number;
};

export const leaveQuotas: LeaveQuota[] = [
    { id: 'EM374', name: 'Rizky Pratama', branch: 'Jakarta', granted: 12, used: 10, remaining: 2 },
    { id: 'EM239', name: 'Nadia Putri', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM392', name: 'Fajar Ramadhan', branch: 'Jakarta', granted: 12, used: 3, remaining: 9 },
    { id: 'EM165', name: 'Dewi Anggraini', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM428', name: 'Arif Setiawan', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM405', name: 'Intan Permata', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM357', name: 'Bima Saputra', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM216', name: 'Rani Wulandari', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM402', name: 'Bagas Maulana', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM552', name: 'Ayu Lestari', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM546', name: 'Siti Aisyah', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
    { id: 'EM678', name: 'Ilham Fauzi', branch: 'Jakarta', granted: 12, used: 2, remaining: 10 },
];
