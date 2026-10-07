interface DetailFieldProps {
    label: string;
    value: string;
}

/** The "Label : value" read-only row every Detail tab is built from. */
export function DetailField({ label, value }: DetailFieldProps) {
    return (
        <div className="flex items-start font-poppins text-sm">
            <span className="w-40 shrink-0 text-[#6B6B6B]">{label}</span>
            <span className="mr-2 text-[#6B6B6B]">:</span>
            <span className="font-medium break-words text-[#121212]">{value || '—'}</span>
        </div>
    );
}