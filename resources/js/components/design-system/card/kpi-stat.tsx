import type { ReactNode } from 'react';

interface KpiStatCardProps {
    label: string;
    icon: ReactNode;
    iconBackground: string;
    children: ReactNode;
}

export function KpiStatCard({ label, icon, iconBackground, children }: KpiStatCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-[#E2E8F0] p-[18px]">
            <div className="flex w-full items-center justify-between">
                <div className="flex w-fit flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-xs font-medium text-[#4F4F4F]">{label}</p>
                    {children}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBackground }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ActiveEmployeesIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0">
            <path
                d="M13.3336 17.5V15.8333C13.3336 14.9493 12.9824 14.1014 12.3572 13.4763C11.7321 12.8512 10.8841 12.5 10 12.5H4.99962C4.11549 12.5 3.26758 12.8512 2.6424 13.4763C2.01723 14.1014 1.66602 14.9493 1.66602 15.8333V17.5M13.3336 2.60661C14.0485 2.79192 14.6816 3.20933 15.1335 3.79333C15.5854 4.37733 15.8306 5.09485 15.8306 5.83327C15.8306 6.5717 15.5854 7.28922 15.1335 7.87322C14.6816 8.45722 14.0485 8.87463 13.3336 9.05994M18.334 17.4999V15.8332C18.3335 15.0947 18.0876 14.3772 17.6351 13.7935C17.1826 13.2098 16.549 12.7929 15.8338 12.6082M10.8334 5.83333C10.8334 7.67428 9.34091 9.16667 7.49982 9.16667C5.65872 9.16667 4.16622 7.67428 4.16622 5.83333C4.16622 3.99238 5.65872 2.5 7.49982 2.5C9.34091 2.5 10.8334 3.99238 10.8334 5.83333Z"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function PayrollStatusIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0">
            <path
                d="M18.4375 2.5C18.6523 2.5 18.8542 2.53906 19.043 2.61719C19.2318 2.69531 19.3978 2.80924 19.541 2.95898C19.6842 3.10872 19.7949 3.27474 19.873 3.45703C19.9512 3.63932 19.9935 3.84115 20 4.0625V14.6875C20 14.9023 19.9609 15.1042 19.8828 15.293C19.8047 15.4818 19.6908 15.6478 19.541 15.791C19.3913 15.9342 19.2253 16.0449 19.043 16.123C18.8607 16.2012 18.6589 16.2435 18.4375 16.25H1.5625C1.34766 16.25 1.14583 16.2109 0.957031 16.1328C0.768229 16.0547 0.602214 15.9408 0.458984 15.791C0.315755 15.6413 0.205078 15.4753 0.126953 15.293C0.0488281 15.1107 0.00651042 14.9089 0 14.6875V4.0625C0 3.84766 0.0390625 3.64583 0.117188 3.45703C0.195312 3.26823 0.309245 3.10221 0.458984 2.95898C0.608724 2.81576 0.77474 2.70508 0.957031 2.62695C1.13932 2.54883 1.34115 2.50651 1.5625 2.5H18.4375ZM1.5625 3.75C1.47135 3.75 1.39648 3.7793 1.33789 3.83789C1.2793 3.89648 1.25 3.97135 1.25 4.0625V6.25H18.75V4.0625C18.75 3.97135 18.7207 3.89648 18.6621 3.83789C18.6035 3.7793 18.5286 3.75 18.4375 3.75H1.5625ZM18.4375 15C18.5286 15 18.6035 14.9707 18.6621 14.9121C18.7207 14.8535 18.75 14.7786 18.75 14.6875V7.5H1.25V14.6875C1.25 14.7786 1.2793 14.8535 1.33789 14.9121C1.39648 14.9707 1.47135 15 1.5625 15H18.4375ZM13.75 11.25H16.25V12.5H13.75V11.25Z"
                fill="#1980C0"
            />
        </svg>
    );
}

export function ActiveEmployeesKpiCardDemo() {
    return (
        <KpiStatCard label="Total Semua Karyawan Aktif" iconBackground="rgba(139,92,246,0.10)" icon={<ActiveEmployeesIcon />}>
            <p className="font-poppins w-fit text-2xl font-semibold text-black">125</p>
        </KpiStatCard>
    );
}

export function PayrollStatusKpiCardDemo() {
    return (
        <KpiStatCard label="Status Pembayaran Gaji" iconBackground="rgba(25,128,192,0.10)" icon={<PayrollStatusIcon />}>
            <div className="flex w-fit items-start gap-2">
                <p className="font-poppins w-fit text-sm text-black">500 Selesai</p>
                <p className="font-poppins w-fit text-sm text-black">40 Belum</p>
            </div>
        </KpiStatCard>
    );
}
