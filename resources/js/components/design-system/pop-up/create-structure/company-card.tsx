import logoPt from '@/assets/icons/logo_pt.png';
import { COMPANY_CEO_NAME, COMPANY_NAME } from './utils';

export function CompanyCard() {
    return (
        <div className="flex w-full items-center gap-3 rounded-xl border border-[#1980C0] px-4 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF8FF]">
                <img src={logoPt} alt="" className="size-5" />
            </div>
            <div className="flex flex-col items-start">
                <p className="font-poppins text-[16px] leading-6 font-semibold text-black">{COMPANY_NAME}</p>
                <p className="text-[14px] leading-5 text-[#64748B]">Direktur {COMPANY_CEO_NAME}</p>
            </div>
        </div>
    );
}
