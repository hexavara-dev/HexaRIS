import { COMPANY_ID } from '@/data/Employee/employee';

/** Which library a template belongs to — mirrors the tabs on the Document Center index page. */
export type TemplateCategory = 'company' | 'department';

/** Where the logo sits in the letterhead — the page's overall header arrangement. */
export type DocumentLayout = 'logo-left' | 'logo-right' | 'logo-center';

/** How many parties sign the document. */
export type SignatoryCount = 1 | 2 | 3;

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    /** Which tab this template appears under. */
    type: TemplateCategory;
    /** Free-text document type (Perizinan, Surat Tugas, ...) — see `DOCUMENT_CATEGORIES` in `document-catalog.ts` for the current option list. */
    documentCategory: string;
    /** Only set for templates created via the older file-upload flow — authored templates (`body` set) have no uploaded file. */
    fileName?: string;
    layout?: DocumentLayout;
    signatoryCount?: SignatoryCount;
    /** Sanitized HTML from the letterhead editor — absent for file-upload templates. */
    body?: string;
    company_id: string;
}

// PT Abadi Jaya — the same fictional company every other Employee/Company seed
// file belongs to (see resources/js/data/Employee/employee.ts).
export const companyDocumentTemplate: DocumentTemplate[] = [
    {
        id: 'doctpl-0001',
        name: 'Surat Tugas Kerja',
        description: 'Template surat penugasan karyawan untuk pekerjaan atau proyek tertentu.',
        type: 'company',
        documentCategory: 'surat-tugas',
        layout: 'logo-left',
        signatoryCount: 2,
        body: 'Yang bertanda tangan di bawah ini menugaskan karyawan yang namanya tercantum untuk melaksanakan pekerjaan sebagaimana dimaksud dalam surat ini.',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0002',
        name: 'Kontrak Kerja Waktu Tertentu (PKWT)',
        description: 'Template perjanjian kerja waktu tertentu untuk karyawan kontrak.',
        type: 'company',
        documentCategory: 'kontrak-kerja',
        layout: 'logo-left',
        signatoryCount: 3,
        body: 'Perjanjian ini dibuat antara perusahaan dan karyawan mengenai hubungan kerja untuk jangka waktu tertentu sesuai ketentuan yang berlaku.',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0003',
        name: 'Surat Keterangan Kerja',
        description: 'Template surat keterangan aktif bekerja untuk keperluan administratif karyawan.',
        type: 'company',
        documentCategory: 'surat-keterangan',
        layout: 'logo-right',
        signatoryCount: 2,
        body: 'Dengan ini menerangkan bahwa karyawan yang namanya tercantum benar merupakan karyawan aktif di perusahaan kami.',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0004',
        name: 'Kontrak Kerja Waktu Tidak Tertentu (PKWTT)',
        description: 'Template kontrak kerja untuk karyawan tetap, diunggah dari arsip lama.',
        type: 'company',
        documentCategory: 'kontrak-kerja',
        fileName: 'PKWTT_Karyawan_Tetap.pdf',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0005',
        name: 'Surat Izin Cuti Tahunan',
        description: 'Template pengajuan izin cuti tahunan departemen.',
        type: 'department',
        documentCategory: 'perizinan',
        layout: 'logo-center',
        signatoryCount: 1,
        body: 'Bersama surat ini kami mengajukan permohonan izin cuti tahunan bagi karyawan yang bersangkutan sesuai dengan sisa hak cuti yang dimiliki.',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0006',
        name: 'Surat Izin Sakit',
        description: 'Template surat izin tidak masuk kerja karena sakit.',
        type: 'department',
        documentCategory: 'perizinan',
        layout: 'logo-left',
        signatoryCount: 1,
        body: 'Sehubungan dengan kondisi kesehatan, bersama ini kami sampaikan permohonan izin tidak masuk kerja bagi karyawan yang bersangkutan.',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0007',
        name: 'Surat Tugas Dinas Luar Kota',
        description: 'Template penugasan perjalanan dinas ke luar kota, diunggah dari arsip lama.',
        type: 'department',
        documentCategory: 'surat-tugas',
        fileName: 'Template_Dinas_Luar_Kota.docx',
        company_id: COMPANY_ID,
    },
    {
        id: 'doctpl-0008',
        name: 'Surat Keterangan Pengalaman Kerja',
        description: 'Template referensi kerja untuk karyawan yang telah menyelesaikan masa kerja.',
        type: 'department',
        documentCategory: 'surat-keterangan',
        layout: 'logo-right',
        signatoryCount: 1,
        body: 'Dengan ini menerangkan bahwa karyawan yang namanya tercantum telah bekerja di departemen kami dengan penilaian kinerja yang baik.',
        company_id: COMPANY_ID,
    },
];
