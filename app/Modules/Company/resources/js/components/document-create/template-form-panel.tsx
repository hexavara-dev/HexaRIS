import { SelectField, TextField } from '@/components/form/form-field';
import { type DocumentLayout, type SignatoryCount, type TemplateCategory } from '@/data/Company/companyDocumentTemplate';

import { DOCUMENT_CATEGORIES, SIGNATORY_OPTIONS, TEMPLATE_TYPES } from '../../lib/document-catalog';
import { DocumentLayoutPicker } from './document-layout-picker';

interface TemplateFormPanelProps {
    name: string;
    onNameChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    documentCategory: string;
    onDocumentCategoryChange: (value: string) => void;
    templateType: TemplateCategory;
    onTemplateTypeChange: (value: TemplateCategory) => void;
    layout: DocumentLayout;
    onLayoutChange: (value: DocumentLayout) => void;
    signatoryCount: SignatoryCount;
    onSignatoryCountChange: (value: SignatoryCount) => void;
}

/** The left-hand form column of the "Buat Template" page. */
export function TemplateFormPanel({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    documentCategory,
    onDocumentCategoryChange,
    templateType,
    onTemplateTypeChange,
    layout,
    onLayoutChange,
    signatoryCount,
    onSignatoryCountChange,
}: TemplateFormPanelProps) {
    return (
        <div className="flex w-80 shrink-0 flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <TextField
                label="Nama Template"
                required
                htmlFor="template-name"
                value={name}
                onChange={onNameChange}
                placeholder="Mis. Surat Tugas Kerja"
            />

            <TextField
                label="Deskripsi Template (Opsional)"
                htmlFor="template-description"
                value={description}
                onChange={onDescriptionChange}
                placeholder="Masukkan Deskripsi"
            />

            <SelectField
                label="Kategori Dokumen"
                required
                htmlFor="template-document-category"
                value={documentCategory}
                onValueChange={onDocumentCategoryChange}
                options={DOCUMENT_CATEGORIES}
                placeholder="Pilih kategori"
            />

            <SelectField
                label="Tipe Template"
                required
                htmlFor="template-type"
                value={templateType}
                onValueChange={(value) => onTemplateTypeChange(value as TemplateCategory)}
                options={TEMPLATE_TYPES}
                placeholder="Pilih tipe template"
            />

            <DocumentLayoutPicker value={layout} onChange={onLayoutChange} />

            <SelectField
                label="Tanda Tangan (Opsional)"
                htmlFor="template-signatory-count"
                value={String(signatoryCount)}
                onValueChange={(value) => onSignatoryCountChange(Number(value) as SignatoryCount)}
                options={SIGNATORY_OPTIONS}
                placeholder="Pilih jumlah pihak"
            />
        </div>
    );
}
