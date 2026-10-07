type EmploymentStatus = {
    label: string;
    value: number;
};

const employmentStatuses: EmploymentStatus[] = [
    { label: 'Tetap', value: 72 },
    { label: 'PKWT', value: 31 },
    { label: 'Probation', value: 15 },
    { label: 'Intern', value: 10 },
    { label: 'Freelance', value: 8 },
];

interface StatCardProps {
    title: string;
    value: number;
    valueClassName?: string;
}

function StatCard({ title, value, valueClassName = '' }: StatCardProps) {
    return (
        <div className="min-w-0 rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-foreground sm:text-sm">{title}</p>
            <p className={`mt-2 text-xl leading-none font-semibold sm:text-2xl ${valueClassName}`}>{value}</p>
        </div>
    );
}

export default function ContractSummary() {
    return (
        <div className="w-full rounded-2xl border bg-muted/20 p-2 sm:p-3">
            <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_180px]">
                <div className="grid min-w-0 gap-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <StatCard title="Kontrak Habis ≤30 Hari" value={15} valueClassName="text-yellow-500" />
                        <StatCard title="Melewati Masa Kontrak" value={6} valueClassName="text-red-500" />
                    </div>

                    <div className="min-w-0 rounded-xl border bg-white p-3">
                        <p className="mb-3 text-xs font-medium text-foreground sm:text-sm">Total Aksi Kontrak</p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Kontrak Diperpanjang</p>
                                <p className="mt-1 text-xl leading-none font-semibold text-green-500 sm:text-2xl">115</p>
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Kontrak Diputus</p>
                                <p className="mt-1 text-xl leading-none font-semibold text-red-500 sm:text-2xl">8</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-w-0 rounded-xl border bg-white p-3">
                    <p className="mb-3 text-xs font-medium text-foreground sm:text-sm">Status Kepegawaian</p>

                    <div className="space-y-2">
                        {employmentStatuses.map((status) => (
                            <div key={status.label} className="flex min-w-0 items-center justify-between gap-3">
                                <span className="min-w-0 truncate text-xs text-muted-foreground">{status.label}</span>
                                <span className="shrink-0 text-xs font-semibold text-foreground">{status.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
