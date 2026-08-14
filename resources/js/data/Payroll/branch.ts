export interface Branch {
    id: string;
    name: string;
}

// No branch/location module exists yet — this is a small dummy list purely so the
// Payroll list page's "Cabang" filter has something real to filter on.
export const branch: Branch[] = [
    { id: 'branch-jakarta', name: 'Jakarta' },
    { id: 'branch-bandung', name: 'Bandung' },
    { id: 'branch-surabaya', name: 'Surabaya' },
];
