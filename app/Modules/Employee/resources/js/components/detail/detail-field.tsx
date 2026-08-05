interface DetailFieldProps {
    label: string;
    value: string;
}

/** The "Label : value" read-only row every Detail tab is built from. */
export function DetailField({ label, value }: DetailFieldProps) {
    return (
        <p className="font-poppins text-sm text-[#353535]">
            <span className="text-[#8F8F8F]">{label}</span> : {value || '—'}
        </p>
    );
}
