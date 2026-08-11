# Company — Document Template Editor (Buat Template) — Design

**Date:** 2026-08-07
**Status:** FE-only pass. Redesigns `DocumentCreate.tsx` to pixel-match a provided screenshot
mockup — a two-column "Template Baru" page with a live letterhead preview, replacing the
single-column upload-based form built earlier the same day.

## Goal

Give a company admin a page at `/company/documents/create` to author a document template directly
in-app (name/description/category, a document-layout choice, a signatory-count choice, and a typed
body), with a live letterhead preview on the right that reflects those choices as they change. No
backend, no real rich-text engine — this pass is front-end structure, styling, and local
interactivity only.

## Scope decision

This is a **pure front-end mock**, same posture as the rest of the `Company` module (see
`2026-07-28-company-org-structure-design.md`): no models, no migrations, no API. The previous
version of this page (upload-a-file form) is fully replaced, not extended — screenshots show no
upload affordance at all.

Explicitly **not** in scope for this pass:
- A real rich-text editor library (Tiptap, Slate, etc.) — none exists in the project yet, and the
  toolbar buttons other than zoom are non-functional decoration.
- Real company-profile data for the letterhead header — hardcoded constant, same pattern as
  `CreateStructureDialog`'s `COMPANY_NAME`.
- A real "Kategori Dokumen" taxonomy — placeholder option list.
- Mobile/responsive treatment — matches every other page in this module (desktop-first, no special
  breakpoint handling).

## Architecture

### Component breakdown

Following the same decomposition convention `Structure.tsx` already established in this module
(page owns orchestration state; sub-components own only their own local, self-contained concerns):

```
app/Modules/Company/resources/js/
  pages/DocumentCreate.tsx                          — page shell, top bar, lifts shared form state
  components/document-create/
    template-form-panel.tsx                         — left column: all form fields
    document-layout-picker.tsx                       — the 3-thumbnail layout selector
    letterhead-preview.tsx                            — right column: toolbar + live preview, owns its own zoom state
  hooks/use-document-templates.ts                    — unchanged, reused for the save step
```

### State ownership

`DocumentCreate.tsx` owns the form state and passes it down as props/callbacks:

```ts
name: string
description: string
documentCategory: string        // "Kategori Dokumen" — Perizinan, Surat Tugas, etc. (placeholder list)
templateType: TemplateCategory  // "Tipe Template" — 'company' | 'department', renamed from the
                                 // previous single-column form's `category` field to avoid clashing
                                 // with the new, distinct `documentCategory` concept
layout: DocumentLayout          // 'left' | 'center' | 'signature-sidebar'
signatoryCount: 1 | 2 | 3
body: string                    // plain text typed into a styled <textarea>
```

`LetterheadPreview` owns its **zoom** state locally (`useState`, `ZOOM_MIN = 0.5`, `ZOOM_MAX = 1.5`,
`ZOOM_STEP = 0.1`) — copied from `OrgChartPanel.tsx`'s existing pattern verbatim, since nothing
outside the preview needs the zoom level.

### `document-layout-picker.tsx`

Three thumbnails, each a small real mirror of `LetterheadPreview`'s actual structure (not generic
gray placeholders) — header alignment and signature-block placement differ per variant:

| Layout | Header | Signature blocks |
|---|---|---|
| `left` | Left-aligned logo + company block | Left-aligned, stacked under body |
| `center` | Centered logo + company block | Centered, stacked under body |
| `signature-sidebar` | Left-aligned logo + company block | Right-side column, alongside body |

Clicking a thumbnail sets `layout` on the page, which re-renders `LetterheadPreview` with that
structure live. Selected thumbnail gets a blue border (`border-[#1980C0]`), matching every other
"selected" affordance already used in this module (e.g. `TabsTrigger`'s active state).

### `letterhead-preview.tsx`

- **Toolbar:** undo/redo, bold/italic/underline/strikethrough, list/ordered-list, alignment,
  "Heading 2" dropdown — all rendered pixel-accurate, all `disabled`/no-op (no wiring, no state).
  Zoom control (`-` / `NN%` / `+`) is the one functional piece, reusing `OrgChartPanel`'s exact
  zoom pattern.
- **Preview body:** hardcoded letterhead header (logo + "PT. HEXARIS INDONESIA" + address/contact —
  a local constant, not a prop), a divider, doc title + a static example doc number, then a plain
  `<textarea>` (borderless, styled to look like body text, placeholder "Tulis disini") bound to
  `body`/`onBodyChange`. Below the body, `signatoryCount` renders that many signature-block columns
  (name + signature-image placeholder), laid out per the active `layout`.
- The whole preview area scales via CSS `transform: scale(zoom)` (or width-based scaling — final
  call left to implementation), matching `OrgChartPanel`'s zoom behavior.

### `template-form-panel.tsx`

Plain stacked `FormField`-style inputs (reusing `TextField`/`SelectField` from
`@/components/form/form-field`, same as the previous version of this page):

- Nama Template (`TextField`, required)
- Deskripsi Template (Opsional) (`TextField`)
- Kategori Dokumen (`SelectField`, required) — placeholder options: Perizinan, Surat Tugas, Kontrak
  Kerja, Surat Keterangan
- Tipe Template (`SelectField`, required) — Template Perusahaan / Template Departemen (existing
  `CATEGORY_OPTIONS` from the previous version, field renamed from `category` to `templateType`)
- `DocumentLayoutPicker`
- Tanda Tangan (Opsional) (`SelectField`) — 1 Pihak / 2 Pihak / 3 Pihak, driving `signatoryCount`

### Page chrome (`DocumentCreate.tsx`)

Top bar changes shape from the previous version: breadcrumb ("Dokumen Center > Buat Template"),
page title "Template Baru", and **"Batal"/"Simpan Template" actions move to the top-right of the
page header** (not a bottom action bar as in the previous version). Two-column body below:
`TemplateFormPanel` (fixed-width left column) and `LetterheadPreview` (flexible right column).

### Data model changes (`components/Card.tsx`)

`DocumentTemplate` gains new **optional** fields so the existing index-page grid/cards keep working
unchanged for any template saved before this change:

```ts
export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    fileName?: string;   // was required; now optional — authored templates have no uploaded file
    documentCategory?: string;
    layout?: DocumentLayout;
    signatoryCount?: 1 | 2 | 3;
    body?: string;
}
```

`TemplateCard` (same file) needs a one-line change: only render the `fileName` caption row when
`fileName` is present, instead of assuming it always exists.

### Save flow

"Simpan Template": validates `name` (required, matches the previous version's validation), then
calls the existing `useDocumentTemplates().addTemplate(templateType, {...})` — no new hook, no new
storage key. On success: toast, then `router.visit(route('company.document.index'))`. "Batal"
navigates back without saving, same as before.

## Known limitations (accepted for this iteration)

- No real rich-text formatting — the `body` field is plain text; toolbar formatting buttons are
  decorative only.
- No real backend for `documentCategory`'s option list, the letterhead header data, or persistence
  in general (same `localStorage`-only posture as the rest of `Company`).
- `layout`/`signatoryCount` values are stored on the template object but not yet rendered anywhere
  on the index page's `TemplateCard` grid — they only affect this create page's own live preview.

## Out of scope (follow-up work)

- A real rich-text editor (once a library is chosen) replacing the plain `<textarea>` and wiring the
  toolbar buttons to it.
- Real company-profile data source for the letterhead header.
- A real `documentCategory` taxonomy (likely backend-driven once the module gets real persistence).
- Surfacing `layout`/`signatoryCount` on the index page's template cards or in a template-detail view.
- Real backend persistence for the whole `Company::Document` resource (mirrors the same follow-up
  already tracked in the org-structure spec for `Company::Structure`).

## Testing

- `npx tsc --noEmit`, `npx eslint`, `npx prettier --check`, `npm run build` — must be green.
- `vendor/bin/pint --test`, `vendor/bin/phpstan analyse` — must be green (route/controller are
  unchanged from the previous version of this page; no new PHP surface).
- No Feature/Pest tests: this is a pure front-end mock page behind the existing `auth`-only route,
  same precedent as `CompanyStructureIndexTest`'s absence noted in the org-structure spec.
