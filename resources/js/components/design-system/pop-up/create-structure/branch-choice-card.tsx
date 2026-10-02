import { ArrowRightLeft, CheckCircle2, GitBranch } from 'lucide-react';

interface BranchChoiceCardProps {
    icon: 'branch' | 'unit';
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}

export function BranchChoiceCard({ icon, title, description, selected, onClick }: BranchChoiceCardProps) {
    const Icon = icon === 'branch' ? GitBranch : ArrowRightLeft;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'group relative flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-3.5 rounded-xl border bg-white px-6 py-7 text-center transition-colors',
                'focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:ring-offset-2 focus-visible:outline-none',
                selected ? 'border-[#1980C0] bg-[#EAF6FF]' : 'border-[#E2E8F0] hover:border-[#70B7EA]',
            ].join(' ')}
            aria-pressed={selected}
        >
            <span className="absolute top-4 left-4">
                {selected ? (
                    <CheckCircle2 className="size-4 fill-[#1980C0] text-white" />
                ) : (
                    <span className="block size-4 rounded-full border border-[#CBD5E1] bg-white" />
                )}
            </span>
            <span
                className={['flex size-10 shrink-0 items-center justify-center rounded-full', selected ? 'bg-[#D8EEFF]' : 'bg-[#F1F5F9]'].join(' ')}
            >
                <Icon className={['size-4', selected ? 'text-[#1980C0]' : 'text-[#94A3B8]'].join(' ')} />
            </span>
            <span className="flex min-w-0 flex-col items-center gap-1">
                <span className="font-poppins block text-[16px] leading-6 font-semibold text-[#0F172A]">{title}</span>
                <span className="block max-w-[250px] text-[14px] leading-5 whitespace-normal text-[#64748B]">{description}</span>
            </span>
        </button>
    );
}
