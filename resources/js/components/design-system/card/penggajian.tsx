export interface PayrollStatus {
    label: string;
    value: string | number;
}

interface PayrollSummaryCardProps {
    title: string;
    totalLabel: string;
    totalAmount: string;
    statusLabel: string;
    statuses: PayrollStatus[];
}

export function PayrollSummaryCard({ title, totalLabel, totalAmount, statusLabel, statuses }: PayrollSummaryCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            <p className="font-poppins w-fit text-sm font-semibold text-black">{title}</p>
            <div className="flex w-full flex-col items-start gap-3">
                <div className="flex w-full flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-xs font-medium text-[#4F4F4F]">{totalLabel}</p>
                    <p className="font-poppins w-fit text-2xl font-semibold text-black">{totalAmount}</p>
                </div>
                <div className="flex w-full flex-col items-start gap-2">
                    <p className="font-poppins w-fit text-xs font-medium text-[#4F4F4F]">{statusLabel}</p>
                    <div className="flex w-fit items-start gap-2">
                        {statuses.map((status) => (
                            <p key={status.label} className="font-poppins w-fit text-sm text-black">
                                {status.value} {status.label}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PayrollSummaryCardDemo() {
    return (
        <PayrollSummaryCard
            title="PENGAJIAN"
            totalLabel="Total Semua Gaji Yang Harus Dibayar"
            totalAmount="Rp870.000.000"
            statusLabel="Status Pembayaran Gaji"
            statuses={[
                { label: 'Selesai', value: 500 },
                { label: 'Belum', value: 40 },
            ]}
        />
    );
}
