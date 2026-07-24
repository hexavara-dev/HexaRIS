function DocumentFileIcon({ fileType }: { fileType: string }) {
    return (
        <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden">
            <div className="relative h-[39px] w-9">
                <svg
                    width="28"
                    height="40"
                    viewBox="0 0 28 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-0 left-0 h-[39px] w-7"
                >
                    <path
                        d="M27.794 10.6083L18.0325 0.231066C17.8936 0.0834531 17.702 0 17.5016 0H2.95278C1.32459 0 0 1.35156 0 3.01281V36.1872C0 37.8484 1.32451 39.2 2.95278 39.2H25.0472C26.6754 39.2 28 37.8484 28 36.1872V11.131C28 10.9361 27.9262 10.7488 27.794 10.6083ZM17.6842 2.03511L25.6975 10.5538H17.6842V2.03511ZM26.5263 36.1872C26.5263 37.0171 25.8629 37.6923 25.0473 37.6923H2.95278C2.13715 37.6923 1.47374 37.0172 1.47374 36.1872V3.01281C1.47374 2.18287 2.13715 1.50767 2.95278 1.50767H16.2106V11.3077C16.2106 11.724 16.5405 12.0615 16.9474 12.0615H26.5263V36.1872Z"
                        fill="#E84A39"
                    />
                </svg>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-[#E84A39] px-0.5 text-center text-[8px] leading-4 tracking-[0.01em] text-nowrap text-white">
                    {fileType}
                </span>
            </div>
        </div>
    );
}

export interface DocumentEntry {
    name: string;
    size: string;
    fileType: string;
}

interface DocumentListCardProps {
    title: string;
    documents: DocumentEntry[];
}

export function DocumentListCard({ title, documents }: DocumentListCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-xl border border-[#E7E7E7] bg-white px-4 py-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05),0px_1px_4px_0px_rgba(0,0,0,0.05)]">
            <p className="font-poppins w-fit text-sm font-semibold text-[#4F4F4F]">{title}</p>
            <div className="flex w-full flex-col items-start gap-2">
                {documents.map((doc) => (
                    <div
                        key={doc.name}
                        className="flex w-full flex-col items-start gap-2.5 rounded-2xl bg-white px-4 py-2 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05),0px_1px_8px_0px_rgba(0,0,0,0.10)]"
                    >
                        <div className="flex w-full items-center gap-4">
                            <DocumentFileIcon fileType={doc.fileType} />
                            <div className="flex w-full flex-col items-start">
                                <p className="w-full text-sm leading-6 tracking-[0.015em] text-[#353535]">{doc.name}</p>
                                <p className="w-full text-sm leading-6 tracking-[0.015em] text-[#808080]">{doc.size}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DocumentListCardDemo() {
    return (
        <DocumentListCard
            title="Dokumen Pendukung"
            documents={[
                { name: 'KTP.Jpeg', size: '0.8 Mb', fileType: 'Jpeg' },
                { name: 'NPWP.Jpeg', size: '0.8 Mb', fileType: 'Jpeg' },
                { name: 'Surat Kontrak.pdf', size: '0.8 Mb', fileType: 'PDF' },
                { name: 'Ijazah.pdf', size: '0.8 Mb', fileType: 'PDF' },
                { name: 'Surat Referensi.pdf', size: '0.8 Mb', fileType: 'PDF' },
            ]}
        />
    );
}
