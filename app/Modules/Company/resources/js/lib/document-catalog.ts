import { type DocumentLayout, type SignatoryCount, type TemplateCategory } from '@/data/Company/companyDocumentTemplate';

/**
 * The selectable option lists behind the Document Center's tabs and dropdowns.
 * One source per concept — the index page's tabs and the create form's "Tipe
 * Template" select previously hardcoded the same two labels separately, so they
 * could drift apart.
 *
 * These are placeholder catalogs until the module has a real backend; swapping
 * them for fetched data means changing this file only.
 */
export interface Option<Value extends string> {
    value: Value;
    label: string;
}

export const TEMPLATE_TYPES: Option<TemplateCategory>[] = [
    { value: 'company', label: 'Template Perusahaan' },
    { value: 'department', label: 'Template Departemen' },
];

/** The index page shows the two template libraries plus a read-only sent log. */
export type DocumentTab = TemplateCategory | 'sent';

export const DOCUMENT_TABS: Option<DocumentTab>[] = [...TEMPLATE_TYPES, { value: 'sent', label: 'Dokumen Terkirim' }];

export const DOCUMENT_CATEGORIES: Option<string>[] = [
    { value: 'perizinan', label: 'Perizinan' },
    { value: 'surat-tugas', label: 'Surat Tugas' },
    { value: 'kontrak-kerja', label: 'Kontrak Kerja' },
    { value: 'surat-keterangan', label: 'Surat Keterangan' },
];

/** Thumbnails live in `public/images/document/`, so they're referenced by URL rather than imported. */
export interface LayoutOption extends Option<DocumentLayout> {
    thumbnail: string;
}

export const DOCUMENT_LAYOUTS: LayoutOption[] = [
    { value: 'logo-left', label: 'Logo di Kiri', thumbnail: '/images/document/layout-1.png' },
    { value: 'logo-right', label: 'Logo di Kanan', thumbnail: '/images/document/layout.png' },
    { value: 'logo-center', label: 'Logo di Tengah', thumbnail: '/images/document/layout-3.png' },
];

export const SIGNATORY_COUNTS: SignatoryCount[] = [1, 2, 3];

/** `SelectField` speaks strings; the caller converts back with `Number()`. */
export const SIGNATORY_OPTIONS: Option<string>[] = SIGNATORY_COUNTS.map((count) => ({
    value: String(count),
    label: `${count} Pihak`,
}));
