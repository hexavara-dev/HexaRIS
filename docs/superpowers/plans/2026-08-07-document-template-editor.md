# Document Template Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `DocumentCreate.tsx` (`/company/documents/create`) into a two-column "Template Baru" page — a form panel on the left, a live letterhead preview on the right — matching the provided screenshot mockup, per `docs/superpowers/specs/2026-08-07-document-template-editor-design.md`.

**Architecture:** Three new presentational components (`DocumentLayoutPicker`, `LetterheadPreview`, `TemplateFormPanel`) under `app/Modules/Company/resources/js/components/document-create/`, composed by a rewritten `DocumentCreate.tsx` page that owns all form state and lifts it down as props — the same page-owns-state/dumb-children pattern already used by `Structure.tsx` + `OrgChartPanel`/`StructureTable` in this module. `Card.tsx`'s `DocumentTemplate` type gains new optional fields so existing saved templates and index-page cards keep working unchanged.

**Tech Stack:** React 18 + TypeScript, Inertia.js, Tailwind, existing shared `@/components/form/form-field` primitives (`TextField`, `SelectField`), `lucide-react` icons. No new dependencies — no rich-text editor library is added in this pass (per spec, out of scope).

## Global Constraints

- No backend/model/migration changes — this module stays pure front-end mock (`localStorage` only), per the spec's Scope Decision.
- No new npm dependencies.
- **No automated component tests**: this project has no frontend test runner configured (confirmed — no `vitest`/`jest`/`@testing-library` in `package.json`, no `"test"` script). Every other page in this module (`Structure.tsx`, `OrgChartPanel`, the original `Document.tsx`) follows the same precedent, documented in the spec's own Testing section. Each task's acceptance check is therefore: `npx tsc --noEmit`, `npx eslint <files>`, `npx prettier --check <files>` all clean, plus a manual behavior checklist — not a test file.
- Final task additionally runs `npm run build`, `./vendor/bin/pint --test`, `./vendor/bin/phpstan analyse --memory-limit=512M` (route/controller are unchanged from the prior version of this page, but re-verify nothing broke).
- Match existing design tokens used throughout this module: primary blue `#1980C0`, border `#E2E8F0`, muted text `#64748B`/`#94A3B8`, dark text `#0F172A`/`#121212`, `font-poppins` for headings/labels. "Pixel-perfect" is approximated against these existing tokens/spacing scale — there is no Figma file wired into this repo to diff against pixel-for-pixel.
- Do not commit anything without the user's explicit go-ahead for that specific commit — stage/commit only when told to.

---

### Task 1: Make `DocumentTemplate` support authored (no-file) templates

**Files:**
- Modify: `app/Modules/Company/resources/js/components/Card.tsx`

**Interfaces:**
- Produces: `DocumentTemplate` (extended), `DocumentLayout = 'left' | 'center' | 'signature-sidebar'`, `SignatoryCount = 1 | 2 | 3` — all exported from this file, consumed by every later task.

- [ ] **Step 1: Read the current file**

Read `app/Modules/Company/resources/js/components/Card.tsx` to confirm current content (interface + `TemplateCard`).

- [ ] **Step 2: Extend the type and guard the `fileName` row**

Replace the `DocumentTemplate` interface and the `CardDescription` line inside `TemplateCard` with:

```tsx
export type DocumentLayout = 'left' | 'center' | 'signature-sidebar';
export type SignatoryCount = 1 | 2 | 3;

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    /** Only set for templates created via file upload (the previous flow) — authored templates have no uploaded file. */
    fileName?: string;
    documentCategory?: string;
    layout?: DocumentLayout;
    signatoryCount?: SignatoryCount;
    body?: string;
}
```

And inside `TemplateCard`'s JSX, change:

```tsx
<CardDescription className="text-xs text-[#94A3B8]">{template.fileName}</CardDescription>
```

to:

```tsx
{template.fileName && <CardDescription className="text-xs text-[#94A3B8]">{template.fileName}</CardDescription>}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors (there will be pre-existing unrelated project state only if any — this file alone must be clean).

Run: `npx eslint app/Modules/Company/resources/js/components/Card.tsx`
Expected: no output (clean).

Run: `npx prettier --check app/Modules/Company/resources/js/components/Card.tsx`
Expected: "All matched files use Prettier code style!" (if not, run `npx prettier --write` on it).

- [ ] **Step 4: Manual check**

Confirm `app/Modules/Company/resources/js/pages/Document.tsx` (the index page, unchanged by this plan) still compiles — it only reads `template.fileName` indirectly via `TemplateCard`, so no direct changes needed there. `npx tsc --noEmit` from Step 3 already covers this.

- [ ] **Step 5: Do not commit yet**

Leave this change unstaged — commits happen only when the user explicitly asks (see Global Constraints).

---

### Task 2: Build `DocumentLayoutPicker`

**Files:**
- Create: `app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx`

**Interfaces:**
- Consumes: `DocumentLayout` from `../Card` (Task 1).
- Produces: `DocumentLayoutPicker({ value: DocumentLayout, onChange: (layout: DocumentLayout) => void })` — a self-contained selector with no internal state, consumed by `TemplateFormPanel` (Task 4).

- [ ] **Step 1: Write the component**

Create `app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx`:

```tsx
import { cn } from '@/lib/utils';

import { type DocumentLayout } from '../Card';

interface DocumentLayoutPickerProps {
    value: DocumentLayout;
    onChange: (layout: DocumentLayout) => void;
}

const LAYOUTS: { value: DocumentLayout; label: string }[] = [
    { value: 'left', label: 'Rata Kiri' },
    { value: 'center', label: 'Rata Tengah' },
    { value: 'signature-sidebar', label: 'Tanda Tangan di Samping' },
];

/** Mini mirrors of LetterheadPreview's actual structure per layout — not generic gray placeholders. */
function LayoutThumbnail({ layout }: { layout: DocumentLayout }) {
    if (layout === 'center') {
        return (
            <div className="flex w-full flex-col items-center gap-1">
                <div className="h-1.5 w-8 rounded-full bg-[#94A3B8]" />
                <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" />
                <div className="mt-1 h-6 w-full rounded-sm bg-[#F1F5F9]" />
                <div className="h-1.5 w-6 rounded-full bg-[#CBD5E1]" />
            </div>
        );
    }

    if (layout === 'signature-sidebar') {
        return (
            <div className="flex w-full items-start gap-1">
                <div className="flex flex-1 flex-col items-start gap-1">
                    <div className="h-1.5 w-8 rounded-full bg-[#94A3B8]" />
                    <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" />
                    <div className="mt-1 h-6 w-full rounded-sm bg-[#F1F5F9]" />
                </div>
                <div className="h-9 w-3 shrink-0 rounded-sm bg-[#CBD5E1]" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-start gap-1">
            <div className="h-1.5 w-8 rounded-full bg-[#94A3B8]" />
            <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" />
            <div className="mt-1 h-6 w-full rounded-sm bg-[#F1F5F9]" />
            <div className="h-1.5 w-6 rounded-full bg-[#CBD5E1]" />
        </div>
    );
}

export function DocumentLayoutPicker({ value, onChange }: DocumentLayoutPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <p className="font-poppins text-base font-semibold text-[#121212]">Document Layout</p>
            <div className="flex items-center gap-3">
                {LAYOUTS.map((layout) => (
                    <button
                        key={layout.value}
                        type="button"
                        onClick={() => onChange(layout.value)}
                        aria-label={layout.label}
                        aria-pressed={value === layout.value}
                        className={cn(
                            'flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-white p-2',
                            value === layout.value ? 'border-[#1980C0]' : 'border-[#E2E8F0]',
                        )}
                    >
                        <LayoutThumbnail layout={layout.value} />
                    </button>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors. (This component isn't imported anywhere yet, but TypeScript still checks unreferenced files in the project.)

Run: `npx eslint app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx`
Expected: clean.

Run: `npx prettier --check app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx`
Expected: clean (or `--write` if not).

- [ ] **Step 3: Do not commit yet**

---

### Task 3: Build `LetterheadPreview`

**Files:**
- Create: `app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx`

**Interfaces:**
- Consumes: `DocumentLayout`, `SignatoryCount` from `../Card` (Task 1); `logoPt` image asset from `@/assets/icons/logo_pt.png` (already used by `create-structure-dialog.tsx` — confirm it still exists before using it).
- Produces: `LetterheadPreview({ layout: DocumentLayout, signatoryCount: SignatoryCount, body: string, onBodyChange: (value: string) => void })`, consumed by `DocumentCreate.tsx` (Task 5). Owns its own `zoom` state internally — no zoom prop, no zoom callback exposed.

- [ ] **Step 1: Confirm the logo asset path**

Run: `ls "app/Modules/Company/resources/js" 2>/dev/null; find . -iname "logo_pt.png" -not -path "*/node_modules/*" -not -path "*/public/build/*"` (or use Glob for `**/logo_pt.png`) to confirm the asset lives at `resources/js/assets/icons/logo_pt.png` and is importable as `@/assets/icons/logo_pt.png`, matching the import already used in `resources/js/components/design-system/pop-up/create-structure-dialog.tsx`.

- [ ] **Step 2: Write the component**

Create `app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx`:

```tsx
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronDown,
    Italic,
    List,
    ListOrdered,
    Minus,
    Plus,
    Redo2,
    Strikethrough,
    Underline,
    Undo2,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import logoPt from '@/assets/icons/logo_pt.png';
import { cn } from '@/lib/utils';

import { type DocumentLayout, type SignatoryCount } from '../Card';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

const COMPANY_NAME = 'PT. Hexaris Indonesia';
const COMPANY_ADDRESS = 'Jl. Muh Hatta No. 123 Jakarta';
const COMPANY_CONTACT = 'Tlp. 089263718387, Email: hexaris@gmail.com';
const COMPANY_WEBSITE = 'www.hexaris.com';
const DOCUMENT_TITLE = 'Surat Tugas Kerja';
const DOCUMENT_NUMBER = 'Nomor : SPD-2026-00123';

interface LetterheadPreviewProps {
    layout: DocumentLayout;
    signatoryCount: SignatoryCount;
    body: string;
    onBodyChange: (value: string) => void;
}

function ToolbarButton({ children, label }: { children: ReactNode; label: string }) {
    return (
        <button type="button" disabled aria-label={label} className="flex items-center rounded p-1.5 text-[#64748B] disabled:cursor-default">
            {children}
        </button>
    );
}

function SignatureBlock() {
    return (
        <div className="flex flex-col items-center gap-1 text-center">
            <div className="h-12 w-24 rounded-sm bg-[#F1F5F9]" />
            <p className="font-poppins text-xs font-semibold text-[#0F172A] underline">NAMA PENANDATANGAN</p>
        </div>
    );
}

/** Toolbar is pixel-accurate but non-functional (zoom excepted) — see spec's Scope Decision. */
export function LetterheadPreview({ layout, signatoryCount, body, onBodyChange }: LetterheadPreviewProps) {
    const [zoom, setZoom] = useState(1);

    function zoomBy(delta: number) {
        setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10)));
    }

    const isCentered = layout === 'center';
    const isSidebar = layout === 'signature-sidebar';

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] p-3">
                <ToolbarButton label="Urungkan">
                    <Undo2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Ulangi">
                    <Redo2 className="size-4" />
                </ToolbarButton>
                <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
                <ToolbarButton label="Tebal">
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Miring">
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Garis Bawah">
                    <Underline className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Coret">
                    <Strikethrough className="size-4" />
                </ToolbarButton>
                <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
                <ToolbarButton label="Daftar">
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Daftar Bernomor">
                    <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Rata Kiri">
                    <AlignLeft className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Rata Tengah">
                    <AlignCenter className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Rata Kanan">
                    <AlignRight className="size-4" />
                </ToolbarButton>
                <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
                <button
                    type="button"
                    disabled
                    className="flex items-center gap-1 rounded border border-[#E2E8F0] px-2 py-1 text-xs text-[#64748B] disabled:cursor-default"
                >
                    Heading 2 <ChevronDown className="size-3" />
                </button>

                <div className="ml-auto flex items-center rounded-lg border border-[#E2E8F0]">
                    <button
                        type="button"
                        onClick={() => zoomBy(-ZOOM_STEP)}
                        disabled={zoom <= ZOOM_MIN}
                        className="flex items-center p-1.5 text-[#94A3B8] disabled:opacity-40"
                        aria-label="Perkecil"
                    >
                        <Minus className="size-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs text-[#0F172A]">{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        onClick={() => zoomBy(ZOOM_STEP)}
                        disabled={zoom >= ZOOM_MAX}
                        className="flex items-center p-1.5 text-[#94A3B8] disabled:opacity-40"
                        aria-label="Perbesar"
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex justify-center overflow-auto bg-[#FAFBFD] p-8">
                <div
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    className="w-[600px] shrink-0 rounded border border-[#E2E8F0] bg-white p-8 shadow-sm"
                >
                    <div className={cn('flex items-center gap-3', isCentered && 'flex-col text-center')}>
                        <img src={logoPt} alt="" className="size-10" />
                        <div className={cn('flex flex-col', isCentered && 'items-center')}>
                            <p className="font-poppins text-sm font-bold text-[#0F172A]">{COMPANY_NAME.toUpperCase()}</p>
                            <p className="text-xs text-[#64748B]">{COMPANY_ADDRESS}</p>
                            <p className="text-xs text-[#64748B]">{COMPANY_CONTACT}</p>
                            <p className="text-xs text-[#64748B]">{COMPANY_WEBSITE}</p>
                        </div>
                    </div>

                    <div className="my-4 h-0.5 w-full bg-[#0F172A]" />

                    <div className="mb-4 text-center">
                        <p className="font-poppins text-sm font-bold text-[#0F172A]">{DOCUMENT_TITLE}</p>
                        <p className="text-xs text-[#64748B]">{DOCUMENT_NUMBER}</p>
                    </div>

                    <div className={cn('flex gap-6', isSidebar ? 'flex-row items-start' : 'flex-col')}>
                        <textarea
                            value={body}
                            onChange={(event) => onBodyChange(event.target.value)}
                            placeholder="Tulis disini"
                            rows={10}
                            className="min-h-[200px] flex-1 resize-none border-0 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                        />

                        <div
                            className={cn(
                                'flex gap-6',
                                isSidebar ? 'w-40 shrink-0 flex-col' : isCentered ? 'w-full justify-center' : 'w-full',
                            )}
                        >
                            {Array.from({ length: signatoryCount }).map((_, index) => (
                                <SignatureBlock key={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx eslint app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx`
Expected: clean.

Run: `npx prettier --check app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx`
Expected: clean (or `--write` if not).

- [ ] **Step 4: Do not commit yet**

---

### Task 4: Build `TemplateFormPanel`

**Files:**
- Create: `app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx`

**Interfaces:**
- Consumes: `DocumentLayout`, `SignatoryCount` from `../Card` (Task 1); `TemplateCategory` from `../../hooks/use-document-templates` (existing — `'company' | 'department'`); `DocumentLayoutPicker` from `./document-layout-picker` (Task 2); `TextField`, `SelectField` from `@/components/form/form-field` (existing, confirmed signatures: `TextField({ label, htmlFor?, error?, hint?, required?, value, onChange, placeholder? })`, `SelectField({ label, htmlFor?, error?, hint?, required?, value?, onValueChange, placeholder?, options: {label, value}[] })`).
- Produces: `TemplateFormPanel(props)` (full prop list below), consumed by `DocumentCreate.tsx` (Task 5).

- [ ] **Step 1: Write the component**

Create `app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx`:

```tsx
import { SelectField, TextField } from '@/components/form/form-field';

import { type DocumentLayout, type SignatoryCount } from '../Card';
import { type TemplateCategory } from '../../hooks/use-document-templates';
import { DocumentLayoutPicker } from './document-layout-picker';

const DOCUMENT_CATEGORY_OPTIONS = [
    { label: 'Perizinan', value: 'perizinan' },
    { label: 'Surat Tugas', value: 'surat-tugas' },
    { label: 'Kontrak Kerja', value: 'kontrak-kerja' },
    { label: 'Surat Keterangan', value: 'surat-keterangan' },
];

const TEMPLATE_TYPE_OPTIONS = [
    { label: 'Template Perusahaan', value: 'company' },
    { label: 'Template Departemen', value: 'department' },
];

const SIGNATORY_OPTIONS = [
    { label: '1 Pihak', value: '1' },
    { label: '2 Pihak', value: '2' },
    { label: '3 Pihak', value: '3' },
];

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
        <div className="flex w-80 shrink-0 flex-col gap-5">
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
                options={DOCUMENT_CATEGORY_OPTIONS}
                placeholder="Pilih kategori"
            />

            <SelectField
                label="Tipe Template"
                required
                htmlFor="template-type"
                value={templateType}
                onValueChange={(value) => onTemplateTypeChange(value as TemplateCategory)}
                options={TEMPLATE_TYPE_OPTIONS}
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx eslint app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx`
Expected: clean.

Run: `npx prettier --check app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx`
Expected: clean (or `--write` if not).

- [ ] **Step 3: Do not commit yet**

---

### Task 5: Rewrite `DocumentCreate.tsx` to compose everything

**Files:**
- Modify: `app/Modules/Company/resources/js/pages/DocumentCreate.tsx` (full rewrite — the current file is the previous, upload-based single-column version, being replaced per the spec)

**Interfaces:**
- Consumes: `TemplateFormPanel` (Task 4), `LetterheadPreview` (Task 3), `DocumentLayout`/`SignatoryCount` (Task 1, from `../components/Card`), `TemplateCategory`/`useDocumentTemplates` (existing, unchanged).
- Produces: the page itself — nothing downstream consumes it directly (Inertia resolves it by route name).

- [ ] **Step 1: Read the current file**

Read `app/Modules/Company/resources/js/pages/DocumentCreate.tsx` to confirm its current (previous-version) content before replacing it.

- [ ] **Step 2: Write the new page**

Replace the full contents of `app/Modules/Company/resources/js/pages/DocumentCreate.tsx` with:

```tsx
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { type DocumentLayout, type SignatoryCount } from '../components/Card';
import { LetterheadPreview } from '../components/document-create/letterhead-preview';
import { TemplateFormPanel } from '../components/document-create/template-form-panel';
import { type TemplateCategory, useDocumentTemplates } from '../hooks/use-document-templates';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dokumen Center', href: '/company/documents' },
    { title: 'Buat Template', href: '/company/documents/create' },
];

export default function DocumentCreate() {
    const { addTemplate } = useDocumentTemplates();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [documentCategory, setDocumentCategory] = useState('');
    const [templateType, setTemplateType] = useState<TemplateCategory>('company');
    const [layout, setLayout] = useState<DocumentLayout>('left');
    const [signatoryCount, setSignatoryCount] = useState<SignatoryCount>(1);
    const [body, setBody] = useState('');

    const goToIndex = () => router.visit(route('company.document.index'));

    function handleSubmit() {
        if (!name.trim()) {
            toast.error('Nama template wajib diisi.');
            return;
        }

        addTemplate(templateType, {
            name: name.trim(),
            description: description.trim(),
            documentCategory,
            layout,
            signatoryCount,
            body,
        });
        toast.success('Template berhasil dibuat.');
        goToIndex();
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Template" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <p className="font-poppins text-xl font-semibold text-[#121212]">Template Baru</p>
                    <div className="flex items-center gap-5">
                        <Link href={route('company.document.index')} className="font-poppins text-sm font-semibold text-[#64748B]">
                            Batal
                        </Link>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            className="h-auto rounded-lg bg-[#1980C0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1668a0]"
                        >
                            Simpan Template
                        </Button>
                    </div>
                </div>

                <div className="flex items-start gap-6">
                    <TemplateFormPanel
                        name={name}
                        onNameChange={setName}
                        description={description}
                        onDescriptionChange={setDescription}
                        documentCategory={documentCategory}
                        onDocumentCategoryChange={setDocumentCategory}
                        templateType={templateType}
                        onTemplateTypeChange={setTemplateType}
                        layout={layout}
                        onLayoutChange={setLayout}
                        signatoryCount={signatoryCount}
                        onSignatoryCountChange={setSignatoryCount}
                    />

                    <div className="min-w-0 flex-1">
                        <LetterheadPreview layout={layout} signatoryCount={signatoryCount} body={body} onBodyChange={setBody} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors — this is the task most likely to surface prop-mismatch bugs between Tasks 2–4 and this page (e.g. a renamed prop), since it's the first point everything is wired together.

Run: `npx eslint app/Modules/Company/resources/js/pages/DocumentCreate.tsx`
Expected: clean.

Run: `npx prettier --check app/Modules/Company/resources/js/pages/DocumentCreate.tsx`
Expected: clean (or `--write` if not).

- [ ] **Step 4: Manual verification checklist**

Start the dev server (`npm run dev` in one terminal, `php artisan serve` or Herd in another) and visit `/company/documents/create` in a browser. Confirm:
- Breadcrumb reads "Dokumen Center > Buat Template", page title "Template Baru".
- "Batal" (top-right) navigates back to `/company/documents` without saving.
- Filling only "Kategori Dokumen"/"Tipe Template"/leaving "Nama Template" empty and clicking "Simpan Template" shows the "Nama template wajib diisi." toast and does not navigate away.
- Typing into "Nama Template" and clicking a signature-count option, then clicking a different `DocumentLayoutPicker` thumbnail, visibly changes the preview's header alignment and signature-block placement on the right.
- Typing into the "Tulis disini" preview body area actually accepts text (per the spec's decision — typeable, toolbar still decorative).
- Toolbar buttons (bold/italic/undo/etc.) are visibly present but clicking them does nothing.
- Zoom `+`/`-` buttons visibly scale the preview letterhead; the percentage label updates; buttons disable at 50%/150%.
- Clicking "Simpan Template" with a name filled in shows a success toast and navigates to `/company/documents` — then reload that page and confirm the new template does **not** crash `TemplateCard` (it has no `fileName`, exercising Task 1's guard) and shows under the correct tab (`Template Perusahaan` or `Template Departemen`, matching the "Tipe Template" chosen).

- [ ] **Step 5: Do not commit yet**

---

### Task 6: Final full-branch verification

**Files:** none created/modified — verification only.

- [ ] **Step 1: Full frontend gate**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npx eslint app/Modules/Company/resources/js/components/Card.tsx app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx app/Modules/Company/resources/js/pages/DocumentCreate.tsx`
Expected: clean.

Run: `npx prettier --check app/Modules/Company/resources/js/components/Card.tsx app/Modules/Company/resources/js/components/document-create/document-layout-picker.tsx app/Modules/Company/resources/js/components/document-create/letterhead-preview.tsx app/Modules/Company/resources/js/components/document-create/template-form-panel.tsx app/Modules/Company/resources/js/pages/DocumentCreate.tsx`
Expected: clean.

Run: `npm run build`
Expected: succeeds, emits a `DocumentCreate-*.js` chunk.

- [ ] **Step 2: Full backend gate (no PHP changed, but re-confirm nothing broke)**

Run: `./vendor/bin/pint --test`
Expected: passed.

Run: `./vendor/bin/phpstan analyse --memory-limit=512M`
Expected: no errors.

Run: `php artisan route:list --path=company`
Expected: `company.document.index` and `company.document.create` both still listed.

- [ ] **Step 3: Spec coverage check**

Re-read `docs/superpowers/specs/2026-08-07-document-template-editor-design.md` section by section and confirm every piece has a corresponding change: component breakdown (Task 2–5), state ownership (Task 5), layout variants → live preview (Task 3), toolbar/zoom (Task 3), data model changes (Task 1), save flow (Task 5), page chrome (Task 5).

- [ ] **Step 4: Report to the user — do not commit**

Summarize what was built and the verification results. Per the user's explicit instruction ("JANGAN COMMIT APAPUN TANPA IZIN"), leave all changes uncommitted and wait for explicit go-ahead before running any `git add`/`git commit`.
