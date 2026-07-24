import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type ReactNode, useState } from 'react';

export interface TemplateFormOption {
    label: string;
    value: string;
}

export type DocumentLayout = 'icon-left' | 'icon-right' | 'icon-center';

const fieldControlClassName = 'h-11 w-full rounded border-[#E7E7E7] px-3 py-2.5 text-sm tracking-[0.01em]';

function FieldLabel({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'required' }) {
    return <p className={cn('w-fit text-sm font-medium tracking-[0.01em]', tone === 'required' ? 'text-[#E84A39]' : 'text-[#121212]')}>{children}</p>;
}

function LayoutOptionButton({
    variant,
    label,
    selected,
    onSelect,
}: {
    variant: DocumentLayout;
    label: string;
    selected: boolean;
    onSelect: () => void;
}) {
    const iconBox = <div className="h-2.5 w-3 shrink-0 rounded-sm bg-[#E7E7E7]" />;
    const headerLines = (
        <div className={cn('flex w-fit flex-col gap-0.5', variant === 'icon-center' ? 'items-center' : 'items-end')}>
            <div className={cn('h-0.5 rounded-sm bg-[#ACACAC]', variant === 'icon-center' ? 'w-3' : 'w-6')} />
            <div className={cn('h-0.5 rounded-sm bg-[#E7E7E7]', variant === 'icon-center' ? 'w-[26px]' : 'w-[35px]')} />
            <div className={cn('h-0.5 rounded-sm bg-[#E7E7E7]', variant === 'icon-center' ? 'w-[22px]' : 'w-[29px]')} />
        </div>
    );

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={label}
            className={cn(
                'flex h-[100px] w-full flex-col items-start justify-between rounded border bg-white p-2',
                selected ? 'border-[#1980C0] ring-1 ring-[#1980C0]' : 'border-[#E7E7E7]',
            )}
        >
            {variant === 'icon-center' ? (
                <div className="flex w-full flex-col items-center gap-1">
                    {iconBox}
                    {headerLines}
                </div>
            ) : (
                <div className="flex w-full items-start justify-between">
                    {variant === 'icon-left' ? iconBox : headerLines}
                    {variant === 'icon-left' ? headerLines : iconBox}
                </div>
            )}
            <div className="h-10 w-full bg-[#F4F7F9]" />
            <div className="flex w-fit flex-col items-start gap-1">
                <div className="h-1 w-[21px] rounded-sm bg-[#E7E7E7]" />
                <div className="h-1 w-10 rounded-sm bg-[#E7E7E7]" />
            </div>
        </button>
    );
}

interface TemplateFormProps {
    name: string;
    onNameChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    descriptionMaxLength?: number;
    documentCategory?: string;
    onDocumentCategoryChange: (value: string) => void;
    documentCategoryOptions: TemplateFormOption[];
    templateType?: string;
    onTemplateTypeChange: (value: string) => void;
    templateTypeOptions: TemplateFormOption[];
    layout: DocumentLayout;
    onLayoutChange: (value: DocumentLayout) => void;
    signature?: string;
    onSignatureChange: (value: string) => void;
    signatureOptions: TemplateFormOption[];
}

export function TemplateForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    descriptionMaxLength = 80,
    documentCategory,
    onDocumentCategoryChange,
    documentCategoryOptions,
    templateType,
    onTemplateTypeChange,
    templateTypeOptions,
    layout,
    onLayoutChange,
    signature,
    onSignatureChange,
    signatureOptions,
}: TemplateFormProps) {
    return (
        <div className="flex w-full flex-col items-start gap-5 border border-[#E7E7E7] bg-white p-5">
            <div className="flex w-full flex-col items-start gap-2">
                <FieldLabel tone="required">Nama Template *</FieldLabel>
                <Input
                    value={name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Masukkan Nama"
                    className={fieldControlClassName}
                />
            </div>

            <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full items-start justify-between">
                    <FieldLabel>Deskripsi Template (Opsional)</FieldLabel>
                    <p className="font-poppins w-fit text-[10px] text-[#9CA3AF]">
                        {description.length}/{descriptionMaxLength}
                    </p>
                </div>
                <Textarea
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value.slice(0, descriptionMaxLength))}
                    maxLength={descriptionMaxLength}
                    placeholder="Masukkan Deskripsi"
                    className="h-20 w-full resize-none rounded border-[#E7E7E7] px-3 py-2.5 text-sm tracking-[0.01em]"
                />
            </div>

            <div className="flex w-full flex-col items-start gap-2">
                <FieldLabel tone="required">Kategori Dokumen *</FieldLabel>
                <Select value={documentCategory} onValueChange={onDocumentCategoryChange}>
                    <SelectTrigger className={cn(fieldControlClassName, 'justify-between')}>
                        <SelectValue placeholder="Pilih Kategori Dokumen" />
                    </SelectTrigger>
                    <SelectContent>
                        {documentCategoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex w-full flex-col items-start gap-2">
                <FieldLabel tone="required">Tipe Template *</FieldLabel>
                <Select value={templateType} onValueChange={onTemplateTypeChange}>
                    <SelectTrigger className={cn(fieldControlClassName, 'justify-between')}>
                        <SelectValue placeholder="Pilih Tipe Template" />
                    </SelectTrigger>
                    <SelectContent>
                        {templateTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex w-full flex-col items-start gap-2">
                <FieldLabel>Document layout</FieldLabel>
                <div className="flex w-full items-start gap-3">
                    <LayoutOptionButton
                        variant="icon-left"
                        label="Icon kiri"
                        selected={layout === 'icon-left'}
                        onSelect={() => onLayoutChange('icon-left')}
                    />
                    <LayoutOptionButton
                        variant="icon-right"
                        label="Icon kanan"
                        selected={layout === 'icon-right'}
                        onSelect={() => onLayoutChange('icon-right')}
                    />
                    <LayoutOptionButton
                        variant="icon-center"
                        label="Icon tengah"
                        selected={layout === 'icon-center'}
                        onSelect={() => onLayoutChange('icon-center')}
                    />
                </div>
            </div>

            <div className="flex w-full flex-col items-start gap-2">
                <FieldLabel>Tanda Tangan (Opsional)</FieldLabel>
                <Select value={signature} onValueChange={onSignatureChange}>
                    <SelectTrigger className={cn(fieldControlClassName, 'justify-between')}>
                        <SelectValue placeholder="Pilih Ttd" />
                    </SelectTrigger>
                    <SelectContent>
                        {signatureOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

export function TemplateFormDemo() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [documentCategory, setDocumentCategory] = useState<string>();
    const [templateType, setTemplateType] = useState('perusahaan');
    const [layout, setLayout] = useState<DocumentLayout>('icon-left');
    const [signature, setSignature] = useState<string>();

    return (
        <TemplateForm
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            documentCategory={documentCategory}
            onDocumentCategoryChange={setDocumentCategory}
            documentCategoryOptions={[
                { label: 'Surat Keterangan', value: 'surat-keterangan' },
                { label: 'Kontrak Kerja', value: 'kontrak-kerja' },
                { label: 'Sertifikat', value: 'sertifikat' },
            ]}
            templateType={templateType}
            onTemplateTypeChange={setTemplateType}
            templateTypeOptions={[
                { label: 'Template Perusahaan', value: 'perusahaan' },
                { label: 'Template Karyawan', value: 'karyawan' },
            ]}
            layout={layout}
            onLayoutChange={setLayout}
            signature={signature}
            onSignatureChange={setSignature}
            signatureOptions={[
                { label: 'Tanda Tangan HRD', value: 'hrd' },
                { label: 'Tanda Tangan Direktur', value: 'direktur' },
            ]}
        />
    );
}
