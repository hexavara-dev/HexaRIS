export interface PersonalDataField {
    label: string;
    value: string;
}

interface PersonalDataCardProps {
    title: string;
    columns: PersonalDataField[][];
}

export function PersonalDataCard({ title, columns }: PersonalDataCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-xl border border-[#E7E7E7] bg-white px-4 py-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05),0px_1px_4px_0px_rgba(0,0,0,0.05)]">
            <p className="font-poppins w-fit text-sm font-semibold text-[#4F4F4F]">{title}</p>
            <div className="flex w-full items-start gap-[60px]">
                {columns.map((column, index) => (
                    <div key={index} className="flex w-fit flex-col items-start justify-center gap-1">
                        {column.map((field) => (
                            <p key={field.label} className="w-fit text-sm tracking-[0.01em] text-[#121212]">
                                {field.label} : {field.value}
                            </p>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PersonalDataCardDemo() {
    return (
        <PersonalDataCard
            title="Data Personal"
            columns={[
                [
                    { label: 'Nama Lengkap', value: 'Ayu Sasmita' },
                    { label: 'Jenis Kelamin', value: 'Perempuan' },
                    { label: 'Tgl Lahir', value: '01 Feb 2026' },
                ],
                [
                    { label: 'Status', value: 'Lajang' },
                    { label: 'Nomor WA', value: '089019281921' },
                    { label: 'Agama', value: 'Islam' },
                ],
                [
                    { label: 'Kab/Kota', value: 'Jombang' },
                    { label: 'Full Address', value: 'Jl KH Abdul 09' },
                ],
            ]}
        />
    );
}
